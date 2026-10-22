import { useEffect } from 'react';
import { shortcutMatches } from '../lib/shortcuts.js';

const IGNORED_INPUT_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

export function useKeyboardShortcuts(shortcuts, handlers) {
  useEffect(() => {
    const onKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      const isEditable = event.target?.isContentEditable || IGNORED_INPUT_TAGS.includes(targetTag);

      for (const [action, shortcut] of Object.entries(shortcuts || {})) {
        if (!shortcut) continue;
        if (!handlers[action]) continue;

        if (shortcutMatches(event, shortcut)) {
          if (!handlers[action].allowInInput && isEditable) {
            continue;
          }
          event.preventDefault();
          handlers[action].handler(event);
          break;
        }
      }

      if (event.key === 'Escape' && handlers.escape) {
        handlers.escape.handler(event);
      }

      if (event.key === 'F11' && handlers.fullscreen) {
        event.preventDefault();
        handlers.fullscreen.handler(event);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts, handlers]);
}
