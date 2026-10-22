export const APP_NAME = 'BioReader';

export const THEMES = {};

export const TERM_CATEGORY_COLORS = {
  Biology: '#4A90E2',
  Statistics: '#F5A623',
  Methods: '#7ED321',
  Format: '#BD10E0',
};

export const HIGHLIGHT_COLORS = [
  { id: 'general', label: 'General', color: '#FFE66D' },
  { id: 'important', label: 'Important', color: '#7ED957' },
  { id: 'methods', label: 'Methods', color: '#4A90E2' },
  { id: 'questions', label: 'Questions', color: '#FF9F1C' },
  { id: 'critique', label: 'Critique', color: '#FF66B3' },
  { id: 'novel', label: 'Novel', color: '#9D4EDD' },
];

export const NOTE_TYPES = {
  quick: {
    id: 'quick',
    label: 'Quick Note',
    shortcut: 'Mod+N',
    borderColor: '#2E86AB',
    icon: 'N',
  },
  deep: {
    id: 'deep',
    label: 'Deep Note',
    shortcut: 'Mod+Shift+N',
    borderColor: '#2E86AB',
    icon: 'D',
  },
  question: {
    id: 'question',
    label: 'Question Note',
    shortcut: 'Mod+Q',
    borderColor: '#F7B801',
    icon: '❓',
  },
  critique: {
    id: 'critique',
    label: 'Critique Note',
    shortcut: 'Mod+C',
    borderColor: '#F26419',
    icon: '⚠️',
  },
  insight: {
    id: 'insight',
    label: 'Key Insight',
    shortcut: 'Mod+I',
    borderColor: '#06D6A0',
    icon: '💡',
  },
};

export const WORKFLOW_BADGES = {
  wgs: 'WGS Analysis Paper',
  rnaseq: 'RNA-seq Analysis Paper',
  chipseq: 'ChIP-seq Analysis Paper',
  variant_calling: 'Variant Calling Study',
  metagenomic: 'Metagenomic Study',
  other: 'General Life Science Paper',
};

export const LAYOUT_PRESETS = {
  'Reading Focus': {
    left: 85,
    right: 15,
    leftCollapsed: false,
    rightCollapsed: false,
  },
  Balanced: {
    left: 70,
    right: 30,
    leftCollapsed: false,
    rightCollapsed: false,
  },
  'Notes Focus': {
    left: 55,
    right: 45,
    leftCollapsed: false,
    rightCollapsed: false,
  },
};

export const DEFAULT_SETTINGS = {
  theme: 'bright',
  fontScale: 100,
  reducedMotion: false,
  highContrast: false,
  dictionaryDepth: 'detailed',
  dictionarySensitivity: 0.75,
  animationEnabled: true,
  defaultNoteType: 'quick',
  noteAutosaveInterval: 30000,
  pdfDefaultZoom: 'fit-width',
  pdfScrollMode: 'continuous',
  highlightOpacity: 0.35,
  panelDefaults: 'Balanced',
  shortcuts: {
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
    undo: 'Mod+Z',
    redo: 'Mod+Shift+Z',
  },
};

export const EMPTY_STATE_TERMS = [
  'False discovery rate',
  'MAPQ',
  'Variant allele frequency',
  'TPM',
  'de Bruijn graph',
  'ChIP-seq peak',
  'SAM flag',
  'Hardy-Weinberg equilibrium',
  'PCR-free library prep',
  'VQSR',
];
