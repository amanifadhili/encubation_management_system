/**
 * Undo Hook
 * Provides undo/redo functionality for actions
 */
import { useState, useCallback } from 'react';

export interface UndoAction<T = any> {
  id: string;
  action: string;
  data: T;
  timestamp: Date;
  undo: () => void | Promise<void>;
  redo?: () => void | Promise<void>;
}

export interface UseUndoOptions {
  maxHistory?: number;
  timeout?: number; // Auto-clear after timeout (ms)
}

export function useUndo<T = any>(options: UseUndoOptions = {}) {
  const { maxHistory = 10, timeout } = options;

  const [history, setHistory] = useState<UndoAction<T>[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction<T>[]>([]);

  /**
   * Add an action to undo history
   */
  const addAction = useCallback((
    action: string,
    data: T,
    undoFn: () => void | Promise<void>,
    redoFn?: () => void | Promise<void>
  ): string => {
    const id = `undo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const undoAction: UndoAction<T> = {
      id,
      action,
      data,
      timestamp: new Date(),
      undo: undoFn,
      redo: redoFn
    };

    setHistory(prev => {
      const newHistory = [...prev, undoAction];
      // Keep only maxHistory items
      if (newHistory.length > maxHistory) {
        return newHistory.slice(-maxHistory);
      }
      return newHistory;
    });

    // Clear redo stack when new action is added
    setRedoStack([]);

    // Auto-clear after timeout
    if (timeout) {
      setTimeout(() => {
        setHistory(prev => prev.filter(a => a.id !== id));
      }, timeout);
    }

    return id;
  }, [maxHistory, timeout]);

  /**
   * Undo the last action
   */
  const undo = useCallback(async (): Promise<boolean> => {
    if (history.length === 0) return false;

    const lastAction = history[history.length - 1];
    
    try {
      await lastAction.undo();
      
      // Move to redo stack
      setRedoStack(prev => [...prev, lastAction]);
      setHistory(prev => prev.slice(0, -1));
      
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  }, [history]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async (): Promise<boolean> => {
    if (redoStack.length === 0) return false;

    const lastRedo = redoStack[redoStack.length - 1];
    
    if (!lastRedo.redo) return false;

    try {
      await lastRedo.redo();
      
      // Move back to history
      setHistory(prev => [...prev, lastRedo]);
      setRedoStack(prev => prev.slice(0, -1));
      
      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      return false;
    }
  }, [redoStack]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setRedoStack([]);
  }, []);

  /**
   * Remove specific action from history
   */
  const removeAction = useCallback((id: string) => {
    setHistory(prev => prev.filter(a => a.id !== id));
    setRedoStack(prev => prev.filter(a => a.id !== id));
  }, []);

  /**
   * Get the last action
   */
  const getLastAction = useCallback((): UndoAction<T> | null => {
    return history.length > 0 ? history[history.length - 1] : null;
  }, [history]);

  return {
    addAction,
    undo,
    redo,
    clearHistory,
    removeAction,
    getLastAction,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    historyCount: history.length,
    history
  };
}

export default useUndo;
