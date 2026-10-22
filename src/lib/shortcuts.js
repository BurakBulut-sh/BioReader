const SPECIAL_KEYS = {
  '/': 'Slash',
  '+': 'Equal',
  '-': 'Minus',
};

export function normalizeShortcut(shortcut) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform ? navigator.platform.includes('Mac') : true;
  return shortcut
    .toLowerCase()
    .replace('mod', isMac ? 'meta' : 'ctrl')
    .replace('cmdorctrl', isMac ? 'meta' : 'ctrl');
}

function eventKeyMatches(event, shortcutKey) {
  const mapped = SPECIAL_KEYS[event.key] || event.key;
  return mapped.toLowerCase() === shortcutKey.toLowerCase();
}

export function shortcutMatches(event, shortcut) {
  const normalized = normalizeShortcut(shortcut);
  const parts = normalized.split('+');
  const key = parts.at(-1);
  const modifiers = parts.slice(0, -1);

  const needsMeta = modifiers.includes('meta');
  const needsCtrl = modifiers.includes('ctrl');
  const needsShift = modifiers.includes('shift');
  const needsAlt = modifiers.includes('alt');

  if (needsMeta !== event.metaKey) return false;
  if (needsCtrl !== event.ctrlKey) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsAlt !== event.altKey) return false;

  return eventKeyMatches(event, key);
}

export function formatShortcut(shortcut) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform ? navigator.platform.includes('Mac') : true;
  return shortcut
    .replace('Mod', isMac ? '⌘' : 'Ctrl')
    .replace('CmdOrCtrl', isMac ? '⌘' : 'Ctrl')
    .replace('Shift', isMac ? '⇧' : 'Shift')
    .replace('Alt', isMac ? '⌥' : 'Alt');
}
