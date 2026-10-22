import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { APP_NAME, NOTE_TYPES, HIGHLIGHT_COLORS } from '../src/lib/constants.js';
import { formatCitation, CITATION_FORMATS } from '../src/lib/citationGenerator.js';
import { exportPaperToMarkdown, exportPaperToBibtex, exportNotesToAnki } from '../src/lib/exporters.js';
import { normalizeShortcut, formatShortcut, shortcutMatches } from '../src/lib/shortcuts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Constants export valid configuration', () => {
  assert.equal(APP_NAME, 'BioReader');
  const typeKeys = Object.keys(NOTE_TYPES);
  assert.ok(typeKeys.length > 0, 'NOTE_TYPES should not be empty');
  assert.ok(NOTE_TYPES.question);
  assert.ok(NOTE_TYPES.insight);
  assert.ok(NOTE_TYPES.critique);
  assert.ok(HIGHLIGHT_COLORS.length > 0, 'HIGHLIGHT_COLORS should not be empty');
});

test('Citation generator formats correctly across all styles', () => {
  const paper = {
    title: 'Developmental speed and mutation rate in Chironomus riparius',
    authors: 'Bulut, B. and Pfenninger, M.',
    year: 2026,
    journal: 'Evolution Letters',
    doi: '10.1093/evlett/qrag010',
  };

  assert.equal(CITATION_FORMATS.length, 5);

  const apa = formatCitation(paper, 'apa');
  assert.ok(apa.includes('Bulut, B. and Pfenninger, M.'));
  assert.ok(apa.includes('(2026)'));
  assert.ok(apa.includes('10.1093/evlett/qrag010'));

  const bibtex = formatCitation(paper, 'bibtex');
  assert.ok(bibtex.startsWith('@article{'));
  assert.ok(bibtex.includes('Evolution Letters'));
  assert.ok(bibtex.includes('title = {Developmental speed'));

  const mla = formatCitation(paper, 'mla');
  assert.ok(mla.includes('"Developmental speed'));

  const vancouver = formatCitation(paper, 'vancouver');
  assert.ok(vancouver.includes('doi: 10.1093/evlett/qrag010'));
});

test('Markdown and Anki exporters generate structured output', () => {
  const paper = {
    title: 'Genomics of Chironomus',
    authors: 'Bulut et al.',
    year: 2026,
    journal: 'Molecular Ecology',
    doi: '10.1111/mec.70503',
  };

  const notes = [
    {
      id: 1,
      type: 'question',
      page: 3,
      note_text: 'What is the germline mutation rate?',
      quote: 'Germline mutation rate was evaluated',
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 2,
      type: 'insight',
      page: 4,
      note_text: 'Mutations follow Poisson distribution',
      created_at: '2026-01-15T11:00:00Z',
    },
  ];

  const mdResult = exportPaperToMarkdown({ paper, notes });
  assert.ok(mdResult.content.includes('# Genomics of Chironomus'));
  assert.ok(mdResult.content.includes('What is the germline mutation rate?'));

  const bibResult = exportPaperToBibtex({ paper });
  assert.ok(bibResult.content.includes('@article'));
  assert.ok(bibResult.content.includes('Genomics of Chironomus'));

  const ankiResult = exportNotesToAnki({ paper, notes });
  assert.ok(ankiResult.content.includes('Front,Back,Tags'));
  assert.ok(ankiResult.content.includes('What is the germline mutation rate?'));
});

test('Keyboard shortcut parser handles modifiers correctly', () => {
  const normalized = normalizeShortcut('Mod+Shift+N');
  assert.ok(normalized.includes('shift+n'));
  const formatted = formatShortcut('Mod+Shift+N');
  assert.ok((formatted.includes('⇧') || formatted.includes('Shift')) && formatted.includes('N'));

  const mockEvent = { metaKey: true, ctrlKey: false, shiftKey: true, altKey: false, key: 'N' };
  assert.equal(shortcutMatches(mockEvent, 'Mod+Shift+N'), true);
});

test('Glossary dictionary dataset is valid and non-empty', () => {
  const glossaryPath = path.join(__dirname, '..', 'src', 'data', 'glossary.json');
  assert.ok(fs.existsSync(glossaryPath), 'glossary.json must exist');

  const content = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
  assert.ok(Array.isArray(content), 'glossary should be an array');
  assert.ok(content.length >= 100, 'glossary should have at least 100 terms');

  const first = content[0];
  assert.ok(first.name, 'term should have a name');
  assert.ok(first.definition, 'term should have a definition');
});
