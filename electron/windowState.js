import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export function windowStateKeeper(windowName) {
  let windowState;
  let hasSavedState = false;
  
  function getStorePath() {
    return path.join(app.getPath('userData'), `window-state-${windowName}.json`);
  }

  function saveState(win) {
    if (!windowState.isMaximized && !windowState.isFullScreen) {
      windowState = win.getBounds();
    }
    windowState.isMaximized = win.isMaximized();
    windowState.isFullScreen = win.isFullScreen();
    
    fs.writeFileSync(getStorePath(), JSON.stringify(windowState));
  }

  function restore() {
    let savedState;
    try {
      savedState = JSON.parse(fs.readFileSync(getStorePath(), 'utf8'));
      hasSavedState = true;
    } catch {
      // Create default state
    }

    const defaultState = {
      x: undefined,
      y: undefined,
      width: 1650,
      height: 980,
      isMaximized: false,
      isFullScreen: false,
    };

    windowState = Object.assign(defaultState, savedState);
  }

  function manage(win) {
    if (windowState.isMaximized) {
      win.maximize();
    }
    if (windowState.isFullScreen) {
      win.setFullScreen(true);
    }
    win.on('resize', () => saveState(win));
    win.on('move', () => saveState(win));
    win.on('close', () => saveState(win));
    win.on('maximize', () => saveState(win));
    win.on('unmaximize', () => saveState(win));
    win.on('enter-full-screen', () => saveState(win));
    win.on('leave-full-screen', () => saveState(win));
  }

  restore();

  return {
    get x() { return windowState.x; },
    get y() { return windowState.y; },
    get width() { return windowState.width; },
    get height() { return windowState.height; },
    get isMaximized() { return windowState.isMaximized; },
    get isFullScreen() { return windowState.isFullScreen; },
    hasSavedState,
    manage,
    saveState
  };
}
