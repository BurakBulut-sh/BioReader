import { contextBridge, ipcRenderer } from 'electron';

function invoke(channel, payload) {
  return ipcRenderer.invoke(channel, payload);
}

function on(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api = {
  system: {
    getPlatform: () => invoke('system:get-platform'),
    openExternal: (url) => invoke('system:open-external', url),
    onOpenPdfRequest: (cb) => on('menu:open-pdf', cb),
    onSaveRequest: (cb) => on('menu:save', cb),
    onPrintRequest: (cb) => on('menu:print', cb),
    onCloseDocumentRequest: (cb) => on('menu:close-document', cb),
    onFindRequest: (cb) => on('menu:find', cb),
    onLayoutPreset: (cb) => on('layout:preset', cb),
    onHelpShortcuts: (cb) => on('help:shortcuts', cb),
    onShowShortcuts: (cb) => on('help:shortcuts', cb),
    onOpenFileRequest: (cb) => on('app:open-file', cb),
    getPaths: () => invoke('app:get-paths'),
    saveFile: (payload) => invoke('system:save-file', payload),
  },
  workflow: {
    detect: (payload) => invoke('workflow:detect', payload),
  },
  pdf: {
    openDialog: () => invoke('pdf:open-dialog'),
    readFile: (filePath) => invoke('pdf:read-file', filePath),
  },
  db: {
    papers: {
      list: () => invoke('db:papers:list'),
      upsert: (payload) => invoke('db:papers:upsert', payload),
      updateProgress: (payload) => invoke('db:papers:update-progress', payload),
    },
    terms: {
      list: () => invoke('db:terms:list'),
      categories: () => invoke('db:terms:categories'),
      search: (payload) => invoke('db:terms:search', payload),
      get: (name) => invoke('db:terms:get', name),
      recent: (limit) => invoke('db:terms:recent', limit),
    },
    search: {
      addHistory: (payload) => invoke('db:search:add-history', payload),
      history: (limit) => invoke('db:search:history', limit),
    },
    notes: {
      list: (payload) => invoke('db:notes:list', payload),
      create: (payload) => invoke('db:notes:create', payload),
      update: (payload) => invoke('db:notes:update', payload),
      delete: (id) => invoke('db:notes:delete', id),
    },
    topics: {
      list: () => invoke('db:topics:list'),
      create: (payload) => invoke('db:topics:create', payload),
      update: (payload) => invoke('db:topics:update', payload),
      delete: (id) => invoke('db:topics:delete', id),
      assignNote: (payload) => invoke('db:topics:assign-note', payload),
      removeNote: (payload) => invoke('db:topics:remove-note', payload),
      noteTopics: () => invoke('db:topics:note-topics'),
    },
    highlights: {
      list: (payload) => invoke('db:highlights:list', payload),
      create: (payload) => invoke('db:highlights:create', payload),
      update: (payload) => invoke('db:highlights:update', payload),
      delete: (id) => invoke('db:highlights:delete', id),
    },
    prefs: {
      get: (payload) => invoke('db:prefs:get', payload),
      set: (payload) => invoke('db:prefs:set', payload),
    },
    backups: {
      create: () => invoke('db:backup:create'),
      list: () => invoke('db:backup:list'),
      restore: (path) => invoke('db:backup:restore', path),
    },
    vocab: {
      list: () => invoke('db:vocab:list'),
      create: (payload) => invoke('db:vocab:create', payload),
      update: (payload) => invoke('db:vocab:update', payload),
      delete: (id) => invoke('db:vocab:delete', id),
      get: (name) => invoke('db:vocab:get', name),
    },
  },
  theme: {
    setNative: (value) => invoke('theme:set-native', value),
  },
};

contextBridge.exposeInMainWorld('api', api);
