import { useState, useCallback } from 'react';

export function useUndoRedo() {
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // action: { type, description, undo: async () => {}, redo: async () => {} }
    const pushUndo = useCallback((action) => {
        setUndoStack((prev) => [...prev.slice(-29), action]); // Max depth 30
        setRedoStack([]); // Clear redo stack on new action
    }, []);

    const handleUndo = useCallback(async () => {
        if (undoStack.length === 0) return;
        const action = undoStack[undoStack.length - 1];

        // Perform undo
        if (action.undo) {
            await action.undo();
        }

        setUndoStack((prev) => prev.slice(0, -1));
        setRedoStack((prev) => [...prev, action]);
    }, [undoStack]);

    const handleRedo = useCallback(async () => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];

        // Perform redo
        if (action.redo) {
            await action.redo();
        }

        setRedoStack((prev) => prev.slice(0, -1));
        setUndoStack((prev) => [...prev, action]);
    }, [redoStack]);

    const canUndo = undoStack.length > 0;
    const canRedo = redoStack.length > 0;

    return { pushUndo, handleUndo, handleRedo, canUndo, canRedo };
}
