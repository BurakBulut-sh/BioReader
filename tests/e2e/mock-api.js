// Mock API for E2E testing in browser
window.api = {
    db: {
        papers: {
            list: async () => [],
            upsert: async () => ({ id: 1 }),
            updateProgress: async () => { },
        },
        terms: {
            list: async () => [
                { id: 1, name: 'Genome', definition: 'The complete set of genes...', personal_note: '' },
                { id: 2, name: 'CRISPR', definition: 'A family of DNA sequences...', personal_note: '' }
            ],
            categories: async () => ['Biology', 'Methods'],
            search: async () => [],
            get: async (name) => ({ id: 1, name, definition: 'Mock definition' }),
            updateNote: async () => { },
            recent: async () => [],
        },
        notes: {
            list: async () => [
                { id: 1, paper_id: 1, type: 'question', note_text: 'Test Question', page: 1, created_at: new Date().toISOString() },
                { id: 2, paper_id: 1, type: 'insight', note_text: 'Test Insight', page: 5, created_at: new Date().toISOString() },
                { id: 3, paper_id: 1, type: 'critique', note_text: 'Test Critique', page: 2, created_at: new Date().toISOString() }
            ],
            create: async (note) => ({ ...note, id: Date.now() }),
            update: async (note) => note,
            delete: async () => { },
        },
        topics: {
            list: async () => [],
            create: async () => { },
            update: async () => { },
            delete: async () => { },
            assignNote: async () => { },
            removeNote: async () => { },
            noteTopics: async () => [],
        },
        highlights: {
            list: async () => [],
            create: async () => { },
            update: async () => { },
            delete: async () => { },
        },
        prefs: {
            get: async ({ _key, fallback }) => fallback,
            set: async () => { },
        },
        backups: {
            create: async () => { },
            list: async () => [],
        },
        search: {
            addHistory: async () => { },
            history: async () => []
        }
    },
    system: {
        getPlatform: async () => 'mac',
        openExternal: async () => { },
        onOpenPdfRequest: () => { },
        onLayoutPreset: () => { },
        onHelpShortcuts: () => { },
        getPaths: async () => ({ documents: '/mock/docs' }),
    },
    pdf: {
        openDialog: async () => { },
        readFile: async () => ({ length: 0 }), // Return empty buffer
    },
    workflow: {
        detect: async () => ({ key: 'other', label: 'Mock Workflow', score: 0 }),
    },
    theme: {
        setNative: async () => { },
    },
};
console.log('Mock window.api injected');
