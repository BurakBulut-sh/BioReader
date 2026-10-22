import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, shell } from 'electron';
import { createDatabaseService } from './database.js';
import { windowStateKeeper } from './windowState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let dbService = null;
let fileToOpen = null;

app.on('open-file', (event, path) => {
  event.preventDefault();
  if (app.isReady() && mainWindow && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send('app:open-file', path);
  } else {
    fileToOpen = path;
  }
});

function isMac() {
  return process.platform === 'darwin';
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open PDF',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:open-pdf');
          },
        },
        {
          label: 'Save / Export Notes',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:print'),
        },
        { type: 'separator' },
        {
          label: 'Close Document',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow?.webContents.send('menu:close-document');
            // If the frontend doesn't handle it or says ok, we can close the window
          }
        },
        isMac() ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow?.webContents.send('menu:find'),
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reading Focus (80-20-0)',
          accelerator: 'CmdOrCtrl+Alt+1',
          click: () => mainWindow?.webContents.send('layout:preset', 'Reading Focus'),
        },
        {
          label: 'Balanced (50-25-25)',
          accelerator: 'CmdOrCtrl+Alt+2',
          click: () => mainWindow?.webContents.send('layout:preset', 'Balanced'),
        },
        {
          label: 'Analysis (40-30-30)',
          accelerator: 'CmdOrCtrl+Alt+3',
          click: () => mainWindow?.webContents.send('layout:preset', 'Analysis'),
        },
        {
          label: 'Notes Focus (40-20-40)',
          accelerator: 'CmdOrCtrl+Alt+4',
          click: () => mainWindow?.webContents.send('layout:preset', 'Notes Focus'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac() ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ]),
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => mainWindow?.webContents.send('help:shortcuts'),
        },
      ],
    },
  ];

  if (isMac()) {
    template.unshift({ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'services' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const mainWindowState = windowStateKeeper('main');

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1180,
    minHeight: 760,
    title: 'BioReader',
    backgroundColor: '#FAFAFA',
    titleBarStyle: 'hidden', // Native Mac traffic lights
    trafficLightPosition: { x: 16, y: 16 }, // Align nicely with the 48px toolbar
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindowState.manage(mainWindow);

  const distPath = path.join(app.getAppPath(), 'dist-react', 'index.html');
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const label = level === 2 ? 'error' : level === 1 ? 'warn' : 'info';
    console.log(`[renderer:${label}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[renderer:crash] reason=${details.reason} exitCode=${details.exitCode}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (fileToOpen) {
      mainWindow.webContents.send('app:open-file', fileToOpen);
      fileToOpen = null;
    }
  });

  // Native Right-Click Context Menu
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const defaultActions = {
      cut: params.editFlags.canCut,
      copy: params.editFlags.canCopy,
      paste: params.editFlags.canPaste,
      selectAll: params.editFlags.canSelectAll,
    };

    const template = [];

    // Only show editable actions if there's text/input to interact with
    if (defaultActions.cut || defaultActions.copy || defaultActions.paste) {
      if (defaultActions.cut) template.push({ role: 'cut' });
      if (defaultActions.copy) template.push({ role: 'copy' });
      if (defaultActions.paste) template.push({ role: 'paste' });
      template.push({ type: 'separator' });
    }

    if (defaultActions.selectAll) {
      template.push({ role: 'selectAll' });
    }

    // Always show a basic Copy if text is selected, even if not editable
    if (params.selectionText && !defaultActions.copy) {
      template.push({ role: 'copy' });
    }

    if (template.length > 0) {
      Menu.buildFromTemplate(template).popup({ window: mainWindow });
    }
  });
}

function detectWorkflowType(payload) {
  const content = `${payload?.title ?? ''} ${payload?.abstract ?? ''} ${payload?.methods ?? ''}`.toLowerCase();

  const workflows = [
    {
      key: 'wgs',
      label: 'WGS Analysis Paper',
      terms: ['whole genome', 'wgs', 'depth of coverage', 'germline', 'somatic', 'variant calling'],
    },
    {
      key: 'rnaseq',
      label: 'RNA-seq Analysis Paper',
      terms: ['rna-seq', 'deseq2', 'edger', 'transcriptome', 'tpm', 'fpkm', 'differential expression'],
    },
    {
      key: 'chipseq',
      label: 'ChIP-seq Analysis Paper',
      terms: ['chip-seq', 'macs2', 'peak calling', 'idr', 'motif'],
    },
    {
      key: 'variant_calling',
      label: 'Variant Calling Study',
      terms: ['snv', 'indel', 'vqsr', 'haplotypecaller', 'structural variant', 'copy number'],
    },
    {
      key: 'metagenomic',
      label: 'Metagenomic Study',
      terms: ['metagenomic', '16s rrna', 'microbiome', 'taxonomic profiling', 'kraken', 'bracken'],
    },
  ];

  const scores = workflows.map((workflow) => {
    const score = workflow.terms.reduce((acc, term) => acc + (content.includes(term) ? 1 : 0), 0);
    return { ...workflow, score };
  });

  const top = scores.sort((a, b) => b.score - a.score)[0];
  if (!top || top.score === 0) {
    return { key: 'other', label: 'General Life Science Paper', score: 0 };
  }

  return { key: top.key, label: top.label, score: top.score };
}

function registerIpcHandlers() {
  ipcMain.handle('system:get-platform', () => process.platform);

  ipcMain.handle('system:open-external', async (_event, url) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('system:save-file', async (_event, { content, defaultPath, filters }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File',
      defaultPath: defaultPath,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });

    if (result.canceled || !result.filePath) return null;

    fs.writeFileSync(result.filePath, content, 'utf8');
    return result.filePath;
  });

  ipcMain.handle('pdf:open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Scientific PDF',
      properties: ['openFile'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    mainWindow.setTitle(`BioReader - ${path.basename(filePath)}`);
    mainWindow.setRepresentedFilename(filePath); // Mac OS specific document icon in titlebar

    return filePath;
  });

  ipcMain.handle('pdf:read-file', async (_event, filePath) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid PDF file path.');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('Selected PDF file does not exist.');
    }

    try {
      const bytes = fs.readFileSync(filePath);
      return Uint8Array.from(bytes);
    } catch (error) {
      throw new Error(`Unable to read PDF file: ${error.message}`);
    }
  });

  ipcMain.handle('workflow:detect', async (_event, payload) => detectWorkflowType(payload));

  ipcMain.handle('db:papers:list', async () => dbService.listPapers());
  ipcMain.handle('db:papers:upsert', async (_event, payload) => dbService.createOrUpdatePaper(payload));
  ipcMain.handle('db:papers:update-progress', async (_event, payload) =>
    dbService.updatePaperProgress(payload.id, payload.progress, payload.workflowType)
  );

  ipcMain.handle('db:terms:list', async () => dbService.listTerms());
  ipcMain.handle('db:terms:categories', async () => dbService.listTermCategories());
  ipcMain.handle('db:terms:search', async (_event, payload) =>
    dbService.searchTerms(payload.query, payload.workflow ?? null, payload.limit ?? 50)
  );
  ipcMain.handle('db:terms:get', async (_event, name) => dbService.getTermByName(name));
  ipcMain.handle('db:terms:update-note', async (_event, payload) =>
    dbService.updateTermNote(payload.id, payload.note)
  );
  ipcMain.handle('db:terms:recent', async (_event, limit) => dbService.listRecentTerms(limit ?? 20));
  ipcMain.handle('db:search:add-history', async (_event, payload) =>
    dbService.addSearchHistory(payload.query, payload.context ?? null)
  );
  ipcMain.handle('db:search:history', async (_event, limit) => dbService.listSearchHistory(limit ?? 30));

  ipcMain.handle('db:notes:list', async (_event, payload) => dbService.listNotes(payload?.paperId ?? null));
  ipcMain.handle('db:notes:create', async (_event, payload) => dbService.createNote(payload));
  ipcMain.handle('db:notes:update', async (_event, payload) => dbService.updateNote(payload));
  ipcMain.handle('db:notes:delete', async (_event, id) => dbService.deleteNote(id));

  ipcMain.handle('db:topics:list', async () => dbService.listTopics());
  ipcMain.handle('db:topics:create', async (_event, payload) => dbService.createTopic(payload));
  ipcMain.handle('db:topics:update', async (_event, payload) => dbService.updateTopic(payload));
  ipcMain.handle('db:topics:delete', async (_event, id) => dbService.deleteTopic(id));
  ipcMain.handle('db:topics:assign-note', async (_event, payload) =>
    dbService.assignNoteToTopic(payload.noteId, payload.topicId)
  );
  ipcMain.handle('db:topics:remove-note', async (_event, payload) =>
    dbService.removeNoteFromTopic(payload.noteId, payload.topicId)
  );
  ipcMain.handle('db:topics:note-topics', async () => dbService.listNoteTopics());

  ipcMain.handle('db:highlights:list', async (_event, payload) =>
    dbService.listHighlights(payload?.paperId ?? null)
  );
  ipcMain.handle('db:highlights:create', async (_event, payload) => dbService.createHighlight(payload));
  ipcMain.handle('db:highlights:update', async (_event, payload) => dbService.updateHighlight(payload));
  ipcMain.handle('db:highlights:delete', async (_event, id) => dbService.deleteHighlight(id));

  ipcMain.handle('db:prefs:get', async (_event, payload) =>
    dbService.getPreference(payload.key, payload.fallback)
  );
  ipcMain.handle('db:prefs:set', async (_event, payload) => dbService.setPreference(payload.key, payload.value));

  ipcMain.handle('db:backup:create', async () => dbService.createBackup());
  ipcMain.handle('db:backup:list', async () => dbService.listBackups());
  ipcMain.handle('db:backup:restore', async (_event, backupPath) => dbService.restoreBackup(backupPath));

  ipcMain.handle('db:vocab:list', async () => dbService.listVocab());
  ipcMain.handle('db:vocab:create', async (_event, payload) => dbService.createVocab(payload));
  ipcMain.handle('db:vocab:update', async (_event, payload) => dbService.updateVocab(payload));
  ipcMain.handle('db:vocab:delete', async (_event, id) => dbService.deleteVocab(id));
  ipcMain.handle('db:vocab:get', async (_event, name) => dbService.getVocabByName(name));

  ipcMain.handle('app:get-paths', async () => ({
    dbPath: dbService.dbPath,
    backupDir: dbService.backupDir,
    documents: app.getPath('documents'),
  }));

  ipcMain.handle('theme:set-native', async (_event, payload) => {
    nativeTheme.themeSource = payload;
    return nativeTheme.themeSource;
  });
}

app.whenReady().then(() => {
  dbService = createDatabaseService({ app });
  createWindow();
  createMenu();
  registerIpcHandlers();

  setInterval(() => {
    try {
      dbService.createBackup();
    } catch {
      // Best effort backup task.
    }
  }, 24 * 60 * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac()) {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (dbService) {
    dbService.close();
  }
});
