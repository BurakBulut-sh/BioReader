import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DEFAULT_LAYOUT = {
  preset: 'Balanced',
  left: 50,
  middle: 25,
  right: 25,
  leftCollapsed: false,
  middleCollapsed: false,
  rightCollapsed: false,
};

const DEFAULT_SHORTCUTS = {
  quickNote: 'Mod+N',
  deepNote: 'Mod+Shift+N',
  questionNote: 'Mod+Q',
  critiqueNote: 'Mod+C',
  insightNote: 'Mod+I',
  dictionaryLookup: 'Mod+D',
  globalDictionary: 'Mod+K',
  searchPdf: 'Mod+F',
  toggleHighlights: 'Mod+H',
  shortcutsOverlay: 'Mod+/',
  panelLeft: 'Mod+B',
  panelMiddle: 'Mod+E',
  panelRight: 'Mod+R',
  cycleLayout: 'Mod+L',
};

function normalizeName(name) {
  return name.trim().toLowerCase();
}

export function createDatabaseService({ app }) {
  const docsPath = app.getPath('documents');
  const dataDir = path.join(docsPath, 'BioReader');
  const backupDir = path.join(dataDir, 'backups');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });

  const dbPath = path.join(dataDir, 'bioreader.sqlite3');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');

  db.exec(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      journal TEXT,
      year INTEGER,
      doi TEXT,
      abstract TEXT,
      workflow_type TEXT DEFAULT 'other',
      added_date TEXT NOT NULL,
      last_opened TEXT,
      reading_progress REAL DEFAULT 0,
      rating INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      normalized_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      subcategory TEXT,
      parent_category TEXT,
      aliases TEXT,
      definition TEXT NOT NULL,
      etymology TEXT,
      why_it_matters TEXT,
      typical_values TEXT,
      pitfalls TEXT,
      related_prerequisites TEXT,
      related_alternatives TEXT,
      related_methods TEXT,
      related_downstream TEXT,
      examples TEXT,
      links TEXT,
      workflow_tags TEXT,
      personal_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER,
      page INTEGER,
      section TEXT,
      type TEXT NOT NULL,
      note_text TEXT NOT NULL,
      highlighted_text TEXT,
      highlight_color TEXT,
      position_x REAL,
      position_y REAL,
      paper_citation TEXT,
      tags TEXT,
      links TEXT,
      user_rating INTEGER DEFAULT 0,
      resolved INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#2E86AB',
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS note_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(note_id, topic_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER,
      page INTEGER,
      selected_text TEXT,
      color TEXT NOT NULL,
      opacity REAL DEFAULT 0.35,
      rects TEXT,
      associated_note_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
      FOREIGN KEY (associated_note_id) REFERENCES notes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recent_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      viewed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocab (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      definition TEXT NOT NULL,
      example TEXT,
      status TEXT DEFAULT 'New',
      workflow TEXT,
      personal_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_papers_last_opened ON papers(last_opened DESC);
    CREATE INDEX IF NOT EXISTS idx_papers_workflow_type ON papers(workflow_type);
    CREATE INDEX IF NOT EXISTS idx_terms_category ON terms(category);
    CREATE INDEX IF NOT EXISTS idx_terms_subcategory ON terms(subcategory);
    CREATE INDEX IF NOT EXISTS idx_terms_normalized ON terms(normalized_name);
    CREATE INDEX IF NOT EXISTS idx_notes_paper_id ON notes(paper_id);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_highlights_paper_id ON highlights(paper_id);
    CREATE INDEX IF NOT EXISTS idx_recent_terms_viewed_at ON recent_terms(viewed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_vocab_name ON vocab(name);
    CREATE INDEX IF NOT EXISTS idx_vocab_status ON vocab(status);
  `);

  // Migration for personal_note
  try {
    const tableInfo = db.pragma('table_info(terms)');
    const hasPersonalNote = tableInfo.some(col => col.name === 'personal_note');
    if (!hasPersonalNote) {
      db.prepare('ALTER TABLE terms ADD COLUMN personal_note TEXT').run();
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }

  function ensurePreference(key, fallback) {
    const row = db.prepare('SELECT value FROM user_preferences WHERE key = ?').get(key);
    if (!row) {
      db
        .prepare('INSERT INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)')
        .run(key, JSON.stringify(fallback), new Date().toISOString());
      return fallback;
    }

    try {
      return JSON.parse(row.value);
    } catch {
      return fallback;
    }
  }

  ensurePreference('theme', 'light');
  ensurePreference('layout', DEFAULT_LAYOUT);
  ensurePreference('shortcuts', DEFAULT_SHORTCUTS);
  ensurePreference('fontScale', 100);
  ensurePreference('reducedMotion', false);
  ensurePreference('highContrast', false);
  ensurePreference('dictionaryDepth', 'detailed');
  ensurePreference('dictionarySensitivity', 0.75);
  ensurePreference('animationEnabled', true);
  ensurePreference('noteAutosaveInterval', 30000);

  const glossaryPath = path.join(app.getAppPath(), 'src', 'data', 'glossary.json');
  const termCount = db.prepare('SELECT COUNT(*) as count FROM terms').get()?.count ?? 0;

  if (termCount < 5000 && fs.existsSync(glossaryPath)) {
    const terms = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));
    const insert = db.prepare(`
      INSERT OR REPLACE INTO terms (
        id,
        name,
        normalized_name,
        category,
        subcategory,
        parent_category,
        aliases,
        definition,
        etymology,
        why_it_matters,
        typical_values,
        pitfalls,
        related_prerequisites,
        related_alternatives,
        related_methods,
        related_downstream,
        examples,
        links,
        workflow_tags
      ) VALUES (
        @id,
        @name,
        @normalized_name,
        @category,
        @subcategory,
        @parent_category,
        @aliases,
        @definition,
        @etymology,
        @why_it_matters,
        @typical_values,
        @pitfalls,
        @related_prerequisites,
        @related_alternatives,
        @related_methods,
        @related_downstream,
        @examples,
        @links,
        @workflow_tags
      )
    `);

    const tx = db.transaction((payload) => {
      for (const term of payload) {
        insert.run({
          id: term.id,
          name: term.name,
          normalized_name: normalizeName(term.name),
          category: term.category,
          subcategory: term.subcategory ?? null,
          parent_category: term.parentCategory ?? null,
          aliases: JSON.stringify(term.aliases ?? []),
          definition: term.definition,
          etymology: term.etymology ?? '',
          why_it_matters: JSON.stringify(term.whyItMatters ?? {}),
          typical_values: term.typicalValues ?? '',
          pitfalls: term.commonPitfalls ?? '',
          related_prerequisites: JSON.stringify(term.relatedConcepts?.prerequisites ?? []),
          related_alternatives: JSON.stringify(term.relatedConcepts?.alternatives ?? []),
          related_methods: JSON.stringify(term.relatedConcepts?.relatedMethods ?? []),
          related_downstream: JSON.stringify(term.relatedConcepts?.downstreamAnalyses ?? []),
          examples: JSON.stringify(term.examples ?? []),
          links: JSON.stringify(term.externalLinks ?? {}),
          workflow_tags: JSON.stringify(term.workflowTags ?? []),
        });
      }
    });

    tx(terms);
  }

  function now() {
    return new Date().toISOString();
  }

  function parseRowTerm(row) {
    if (!row) {
      return null;
    }

    const parseJson = (value, fallback) => {
      if (!value) return fallback;
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    };

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      parentCategory: row.parent_category,
      aliases: parseJson(row.aliases, []),
      definition: row.definition,
      etymology: row.etymology,
      whyItMatters: parseJson(row.why_it_matters, {}),
      typicalValues: row.typical_values,
      commonPitfalls: row.pitfalls,
      relatedConcepts: {
        prerequisites: parseJson(row.related_prerequisites, []),
        alternatives: parseJson(row.related_alternatives, []),
        relatedMethods: parseJson(row.related_methods, []),
        downstreamAnalyses: parseJson(row.related_downstream, []),
      },
      examples: parseJson(row.examples, []),
      externalLinks: parseJson(row.links, {}),
      workflowTags: parseJson(row.workflow_tags, []),
      personalNote: row.personal_note || '',
    };
  }

  function setPreference(key, value) {
    db
      .prepare(`
        INSERT INTO user_preferences (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `)
      .run(key, JSON.stringify(value), now());
    return value;
  }

  function getPreference(key, fallback = null) {
    const row = db.prepare('SELECT value FROM user_preferences WHERE key = ?').get(key);
    if (!row) {
      return fallback;
    }

    try {
      return JSON.parse(row.value);
    } catch {
      return fallback;
    }
  }

  const statements = {
    insertPaper: db.prepare(`
      INSERT INTO papers (
        title,
        file_path,
        journal,
        year,
        doi,
        abstract,
        workflow_type,
        added_date,
        last_opened,
        reading_progress,
        rating
      ) VALUES (
        @title,
        @file_path,
        @journal,
        @year,
        @doi,
        @abstract,
        @workflow_type,
        @added_date,
        @last_opened,
        @reading_progress,
        @rating
      )
      ON CONFLICT(file_path) DO UPDATE SET
        title = excluded.title,
        journal = excluded.journal,
        year = excluded.year,
        doi = excluded.doi,
        abstract = excluded.abstract,
        workflow_type = excluded.workflow_type,
        last_opened = excluded.last_opened,
        reading_progress = excluded.reading_progress,
        rating = excluded.rating
      RETURNING *
    `),
    listPapers: db.prepare('SELECT * FROM papers ORDER BY last_opened DESC, added_date DESC'),
    getPaperByPath: db.prepare('SELECT * FROM papers WHERE file_path = ?'),
    updatePaperProgress: db.prepare(
      'UPDATE papers SET reading_progress = ?, last_opened = ?, workflow_type = ? WHERE id = ?'
    ),

    listNotesByPaper: db.prepare('SELECT * FROM notes WHERE paper_id = ? ORDER BY updated_at DESC'),
    listAllNotes: db.prepare('SELECT * FROM notes ORDER BY updated_at DESC'),
    insertNote: db.prepare(`
      INSERT INTO notes (
        id,
        paper_id,
        page,
        section,
        type,
        note_text,
        highlighted_text,
        highlight_color,
        position_x,
        position_y,
        paper_citation,
        tags,
        links,
        user_rating,
        resolved,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @paper_id,
        @page,
        @section,
        @type,
        @note_text,
        @highlighted_text,
        @highlight_color,
        @position_x,
        @position_y,
        @paper_citation,
        @tags,
        @links,
        @user_rating,
        @resolved,
        @created_at,
        @updated_at
      )
      RETURNING *
    `),
    updateNote: db.prepare(`
      UPDATE notes SET
        section = @section,
        type = @type,
        note_text = @note_text,
        highlighted_text = @highlighted_text,
        highlight_color = @highlight_color,
        tags = @tags,
        links = @links,
        user_rating = @user_rating,
        resolved = @resolved,
        updated_at = @updated_at
      WHERE id = @id
      RETURNING *
    `),
    deleteNote: db.prepare('DELETE FROM notes WHERE id = ?'),

    listTopics: db.prepare(
      `SELECT t.*, COUNT(nt.note_id) AS note_count
       FROM topics t
       LEFT JOIN note_topics nt ON nt.topic_id = t.id
       GROUP BY t.id
       ORDER BY t.updated_at DESC`
    ),
    insertTopic: db.prepare(
      'INSERT INTO topics (name, color, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING *'
    ),
    updateTopic: db.prepare(
      'UPDATE topics SET name = ?, color = ?, description = ?, updated_at = ? WHERE id = ? RETURNING *'
    ),
    deleteTopic: db.prepare('DELETE FROM topics WHERE id = ?'),
    assignNoteTopic: db.prepare(
      'INSERT OR IGNORE INTO note_topics (note_id, topic_id, created_at) VALUES (?, ?, ?)'
    ),
    removeNoteTopic: db.prepare('DELETE FROM note_topics WHERE note_id = ? AND topic_id = ?'),
    listNoteTopics: db.prepare(
      `SELECT nt.note_id, t.*
       FROM note_topics nt
       JOIN topics t ON t.id = nt.topic_id
       WHERE nt.note_id IN (SELECT id FROM notes)
       ORDER BY t.name ASC`
    ),

    listHighlightsByPaper: db.prepare(
      'SELECT * FROM highlights WHERE paper_id = ? ORDER BY updated_at DESC'
    ),
    listAllHighlights: db.prepare('SELECT * FROM highlights ORDER BY updated_at DESC'),
    insertHighlight: db.prepare(`
      INSERT INTO highlights (
        id,
        paper_id,
        page,
        selected_text,
        color,
        opacity,
        rects,
        associated_note_id,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @paper_id,
        @page,
        @selected_text,
        @color,
        @opacity,
        @rects,
        @associated_note_id,
        @created_at,
        @updated_at
      )
      RETURNING *
    `),
    updateHighlight: db.prepare(
      `UPDATE highlights SET
        color = @color,
        opacity = @opacity,
        associated_note_id = @associated_note_id,
        updated_at = @updated_at
       WHERE id = @id
       RETURNING *`
    ),
    deleteHighlight: db.prepare('DELETE FROM highlights WHERE id = ?'),

    searchTerms: db.prepare(
      `SELECT *
       FROM terms
       WHERE normalized_name LIKE ?
          OR name LIKE ?
          OR aliases LIKE ?
          OR definition LIKE ?
       LIMIT ?`
    ),
    getTermByName: db.prepare(
      'SELECT * FROM terms WHERE normalized_name = ? OR name = ? COLLATE NOCASE LIMIT 1'
    ),
    listTerms: db.prepare('SELECT * FROM terms ORDER BY category, subcategory, name'),
    listTermCategories: db.prepare(
      'SELECT category, subcategory, parent_category, COUNT(*) as count FROM terms GROUP BY category, subcategory, parent_category ORDER BY category, subcategory'
    ),

    recentTermsInsert: db.prepare(
      'INSERT INTO recent_terms (term_name, normalized_name, viewed_at) VALUES (?, ?, ?)'
    ),
    recentTermsList: db.prepare(
      'SELECT term_name, normalized_name, viewed_at FROM recent_terms ORDER BY viewed_at DESC LIMIT ?'
    ),
    searchHistoryInsert: db.prepare(
      'INSERT INTO search_history (query, context, created_at) VALUES (?, ?, ?)'
    ),
    searchHistoryList: db.prepare('SELECT * FROM search_history ORDER BY created_at DESC LIMIT ?'),
    updateTermNote: db.prepare('UPDATE terms SET personal_note = ? WHERE id = ? RETURNING *'),

    listVocab: db.prepare('SELECT * FROM vocab ORDER BY updated_at DESC'),
    getVocabByName: db.prepare('SELECT * FROM vocab WHERE name = ? COLLATE NOCASE'),
    insertVocab: db.prepare(`
        INSERT INTO vocab (name, definition, example, status, workflow, created_at, updated_at)
        VALUES (@name, @definition, @example, @status, @workflow, @created_at, @updated_at)
        RETURNING *
    `),
    updateVocab: db.prepare(`
        UPDATE vocab SET status = @status, personal_note = @personal_note, updated_at = @updated_at
        WHERE id = @id
        RETURNING *
    `),
    deleteVocab: db.prepare('DELETE FROM vocab WHERE id = ?'),
  };

  function parseNote(row) {
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      links: row.links ? JSON.parse(row.links) : [],
    };
  }

  function parseHighlight(row) {
    return {
      ...row,
      rects: row.rects ? JSON.parse(row.rects) : [],
    };
  }

  function createOrUpdatePaper(input) {
    const payload = {
      title: input.title || path.basename(input.file_path),
      file_path: input.file_path,
      journal: input.journal || null,
      year: input.year || null,
      doi: input.doi || null,
      abstract: input.abstract || null,
      workflow_type: input.workflow_type || 'other',
      added_date: input.added_date || now(),
      last_opened: now(),
      reading_progress: input.reading_progress || 0,
      rating: input.rating || 0,
    };
    return statements.insertPaper.get(payload);
  }

  function createNote(input) {
    const timestamp = now();
    return parseNote(
      statements.insertNote.get({
        id: input.id || null,
        paper_id: input.paper_id,
        page: input.page ?? null,
        section: input.section ?? null,
        type: input.type || 'quick',
        note_text: input.note_text || '',
        highlighted_text: input.highlighted_text || '',
        highlight_color: input.highlight_color || null,
        position_x: input.position_x ?? null,
        position_y: input.position_y ?? null,
        paper_citation: input.paper_citation || '',
        tags: JSON.stringify(input.tags || []),
        links: JSON.stringify(input.links || []),
        user_rating: input.user_rating || 0,
        resolved: input.resolved ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp,
      })
    );
  }

  function updateNote(input) {
    const row = statements.updateNote.get({
      ...input,
      tags: JSON.stringify(input.tags || []),
      links: JSON.stringify(input.links || []),
      updated_at: now(),
      resolved: input.resolved ? 1 : 0,
      user_rating: input.user_rating || 0,
      type: input.type || 'quick',
      section: input.section || null,
      note_text: input.note_text || '',
      highlighted_text: input.highlighted_text || '',
      highlight_color: input.highlight_color || null,
    });
    return parseNote(row);
  }

  function listNotes(paperId = null) {
    const rows = paperId ? statements.listNotesByPaper.all(paperId) : statements.listAllNotes.all();
    return rows.map(parseNote);
  }

  function createTopic(input) {
    return statements.insertTopic.get(
      input.name,
      input.color || '#2E86AB',
      input.description || '',
      now(),
      now()
    );
  }

  function updateTopic(input) {
    return statements.updateTopic.get(
      input.name,
      input.color || '#2E86AB',
      input.description || '',
      now(),
      input.id
    );
  }

  function listTopics() {
    return statements.listTopics.all();
  }

  function assignNoteToTopic(noteId, topicId) {
    statements.assignNoteTopic.run(noteId, topicId, now());
    db.prepare('UPDATE topics SET updated_at = ? WHERE id = ?').run(now(), topicId);
    return true;
  }

  function removeNoteFromTopic(noteId, topicId) {
    statements.removeNoteTopic.run(noteId, topicId);
    return true;
  }

  function listNoteTopics() {
    return statements.listNoteTopics.all();
  }

  function createHighlight(input) {
    const timestamp = now();
    return parseHighlight(
      statements.insertHighlight.get({
        id: input.id || null,
        paper_id: input.paper_id,
        page: input.page,
        selected_text: input.selected_text || '',
        color: input.color || '#FFE66D',
        opacity: input.opacity ?? 0.35,
        rects: JSON.stringify(input.rects || []),
        associated_note_id: input.associated_note_id || null,
        created_at: timestamp,
        updated_at: timestamp,
      })
    );
  }

  function updateHighlight(input) {
    return parseHighlight(
      statements.updateHighlight.get({
        id: input.id,
        color: input.color || '#FFE66D',
        opacity: input.opacity ?? 0.35,
        associated_note_id: input.associated_note_id || null,
        updated_at: now(),
      })
    );
  }

  function listHighlights(paperId = null) {
    const rows = paperId
      ? statements.listHighlightsByPaper.all(paperId)
      : statements.listAllHighlights.all();
    return rows.map(parseHighlight);
  }

  function searchTerms(query, workflow = null, limit = 50) {
    const like = `%${query}%`;
    const rows = statements.searchTerms.all(like, like, like, like, limit);

    const scored = rows.map((row) => {
      const term = parseRowTerm(row);
      let score = 0;
      const normalizedQuery = query.trim().toLowerCase();
      if (term.name.toLowerCase() === normalizedQuery) score += 100;
      if (term.name.toLowerCase().startsWith(normalizedQuery)) score += 40;
      if (term.definition.toLowerCase().includes(normalizedQuery)) score += 8;
      if (workflow && term.workflowTags.includes(workflow)) score += 20;
      return { ...term, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function getTermByName(name) {
    const row = statements.getTermByName.get(normalizeName(name), name.trim());
    const term = parseRowTerm(row);
    if (term) {
      statements.recentTermsInsert.run(term.name, normalizeName(term.name), now());
    }
    return term;
  }

  function listTerms() {
    return statements.listTerms.all().map(parseRowTerm);
  }

  function listTermCategories() {
    return statements.listTermCategories.all();
  }

  function listRecentTerms(limit = 20) {
    return statements.recentTermsList.all(limit);
  }

  function addSearchHistory(query, context = null) {
    statements.searchHistoryInsert.run(query, context, now());
    return true;
  }

  function listSearchHistory(limit = 30) {
    return statements.searchHistoryList.all(limit);
  }

  function createBackup() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = path.join(backupDir, `bioreader-${stamp}.sqlite3`);
    db.prepare('VACUUM').run();
    fs.copyFileSync(dbPath, target);

    const backups = fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith('.sqlite3'))
      .sort()
      .reverse();

    for (const [index, file] of backups.entries()) {
      if (index >= 7) {
        fs.unlinkSync(path.join(backupDir, file));
      }
    }

    return { path: target };
  }

  function listBackups() {
    return fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith('.sqlite3'))
      .map((file) => {
        const full = path.join(backupDir, file);
        const stat = fs.statSync(full);
        return {
          name: file,
          path: full,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  }

  function createVocab(input) {
    const timestamp = now();
    return statements.insertVocab.get({
      name: input.name,
      definition: input.definition,
      example: input.example || null,
      status: input.status || 'New',
      workflow: input.workflow || null,
      created_at: timestamp,
      updated_at: timestamp
    });
  }

  function updateVocab(input) {
    return statements.updateVocab.get({
      id: input.id,
      status: input.status,
      personal_note: input.personal_note || null,
      updated_at: now()
    });
  }

  function restoreBackup(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist.');
    }
    db.close();
    fs.copyFileSync(backupPath, dbPath);
    return { restored: true };
  }

  function close() {
    db.close();
  }

  return {
    close,
    dbPath,
    backupDir,
    createOrUpdatePaper,
    listPapers: () => statements.listPapers.all(),
    getPaperByPath: (value) => statements.getPaperByPath.get(value),
    updatePaperProgress: (id, progress, workflowType) =>
      statements.updatePaperProgress.run(progress, now(), workflowType, id),
    createNote,
    updateNote,
    deleteNote: (id) => statements.deleteNote.run(id),
    listNotes,
    createTopic,
    updateTopic,
    deleteTopic: (id) => statements.deleteTopic.run(id),
    listTopics,
    assignNoteToTopic,
    removeNoteFromTopic,
    listNoteTopics,
    createHighlight,
    updateHighlight,
    deleteHighlight: (id) => statements.deleteHighlight.run(id),
    listHighlights,
    searchTerms,
    getTermByName,
    listTerms,
    updateTermNote: (id, note) => {
      const row = statements.updateTermNote.get(note, id);
      return parseRowTerm(row);
    },
    listTermCategories,
    listRecentTerms,
    addSearchHistory,
    listSearchHistory,
    setPreference,
    getPreference,
    createBackup,
    listBackups,
    restoreBackup,
    createVocab,
    updateVocab,
    deleteVocab: (id) => statements.deleteVocab.run(id),
    listVocab: () => statements.listVocab.all(),
    getVocabByName: (name) => statements.getVocabByName.get(name),
  };
}
