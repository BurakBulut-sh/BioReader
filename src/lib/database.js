const isElectron = typeof window !== 'undefined' && Boolean(window.api);

export const dbClient = isElectron ? {
  papers: {
    list: () => window.api.db.papers.list(),
    upsert: (payload) => window.api.db.papers.upsert(payload),
    updateProgress: (payload) => window.api.db.papers.updateProgress(payload),
  },
  terms: {
    list: () => window.api.db.terms.list(),
    categories: () => window.api.db.terms.categories(),
    search: ({ query, workflow, limit = 50 }) =>
      window.api.db.terms.search({ query, workflow, limit }),
    get: (name) => window.api.db.terms.get(name),
    updateNote: (id, note) => window.api.db.terms.updateNote({ id, note }),
    recent: (limit = 20) => window.api.db.terms.recent(limit),
  },
  vocab: {
    list: () => window.api.db.vocab.list(),
    create: (payload) => window.api.db.vocab.create(payload),
    update: (payload) => window.api.db.vocab.update(payload),
    delete: (id) => window.api.db.vocab.delete(id),
    get: (name) => window.api.db.vocab.get(name),
  },
  search: {
    addHistory: (query, context = null) => window.api.db.search.addHistory({ query, context }),
    history: (limit = 30) => window.api.db.search.history(limit),
  },
  notes: {
    list: (paperId = null) => window.api.db.notes.list({ paperId }),
    create: (payload) => window.api.db.notes.create(payload),
    update: (payload) => window.api.db.notes.update(payload),
    delete: (id) => window.api.db.notes.delete(id),
  },
  topics: {
    list: () => window.api.db.topics.list(),
    create: (payload) => window.api.db.topics.create(payload),
    update: (payload) => window.api.db.topics.update(payload),
    delete: (id) => window.api.db.topics.delete(id),
    assignNote: (noteId, topicId) => window.api.db.topics.assignNote({ noteId, topicId }),
    removeNote: (noteId, topicId) => window.api.db.topics.removeNote({ noteId, topicId }),
    noteTopics: () => window.api.db.topics.noteTopics(),
  },
  highlights: {
    list: (paperId = null) => window.api.db.highlights.list({ paperId }),
    create: (payload) => window.api.db.highlights.create(payload),
    update: (payload) => window.api.db.highlights.update(payload),
    delete: (id) => window.api.db.highlights.delete(id),
  },
  prefs: {
    get: (key, fallback = null) => window.api.db.prefs.get({ key, fallback }),
    set: (key, value) => window.api.db.prefs.set({ key, value }),
  },
  backups: {
    create: () => window.api.db.backups.create(),
    list: () => window.api.db.backups.list(),
    restore: (path) => window.api.db.backups.restore(path),
  }
} : {
  papers: { list: async () => [], upsert: async () => ({}), updateProgress: async () => ({}) },
  terms: { list: async () => [], categories: async () => [], search: async () => [], get: async () => null, updateNote: async () => { }, recent: async () => [] },
  search: { addHistory: async () => { }, history: async () => [] },
  notes: { list: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => { } },
  topics: { list: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => { }, assignNote: async () => { }, removeNote: async () => { }, noteTopics: async () => [] },
  highlights: { list: async () => [], create: async () => ({}), update: async () => ({}), delete: async () => { } },
  vocab: { list: async () => [], create: async (p) => ({ ...p, id: Date.now() }), update: async () => ({}), delete: async () => { }, get: async () => null },
  prefs: { get: async (key, fb) => fb, set: async () => { } },
  backups: { create: async () => { }, list: async () => [], restore: async () => { } }
};

export const systemClient = isElectron ? {
  getPlatform: () => window.api.system.getPlatform(),
  openPdfDialog: () => window.api.pdf.openDialog(),
  readPdfFile: (filePath) => window.api.pdf.readFile(filePath),
  saveFile: (options) => window.api.system.saveFile(options),
  openExternal: (url) => window.api.system.openExternal(url),
  detectWorkflow: (payload) => window.api.workflow.detect(payload),
  setNativeTheme: (theme) => window.api.theme.setNative(theme),
  onOpenPdfRequest: (cb) => window.api.system.onOpenPdfRequest(cb),
  onLayoutPreset: (cb) => window.api.system.onLayoutPreset(cb),
  onHelpShortcuts: (cb) => window.api.system.onHelpShortcuts(cb),
  getPaths: () => window.api.system.getPaths(),
  onOpenFileRequest: (callback) => window.api.system.onOpenFileRequest(callback),
  onSaveRequest: (callback) => window.api.system.onSaveRequest(callback),
  onPrintRequest: (callback) => window.api.system.onPrintRequest(callback),
  onCloseDocumentRequest: (callback) => window.api.system.onCloseDocumentRequest(callback),
  onFindRequest: (callback) => window.api.system.onFindRequest(callback),
  onShowShortcuts: (callback) => window.api.system.onShowShortcuts(callback),
} : {
  getPlatform: async () => 'web',
  openPdfDialog: async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return resolve(null);
        // We simulate returning a path, but we'll attach the blob to a global cache
        // so readPdfFile can grab it.
        const fakePath = `web://${file.name}`;
        window.__webFileCache = window.__webFileCache || {};
        window.__webFileCache[fakePath] = file;
        resolve(fakePath);
      };
      input.click();
    });
  },
  readPdfFile: async (filePath) => {
    if (filePath.startsWith('web://')) {
      const file = window.__webFileCache?.[filePath];
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    }
    return new Uint8Array();
  },
  openExternal: async () => { },
  detectWorkflow: async () => ({}),
  setNativeTheme: () => { },
  onOpenPdfRequest: () => () => { },
  onLayoutPreset: () => () => { },
  onHelpShortcuts: () => () => { },
  getPaths: async () => ({}),
  saveFile: async () => null,
  onOpenFileRequest: () => () => { },
  onSaveRequest: () => () => { },
  onPrintRequest: () => () => { },
  onCloseDocumentRequest: () => () => { },
  onFindRequest: () => () => { },
  onShowShortcuts: () => () => { },
};
