/**
 * Optimistic Updates Hook
 * Provides optimistic UI updates with automatic rollback on error
 */
import { useState, useCallback } from 'react';

export interface OptimisticAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  previousData?: T | T[];
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
}

export function useOptimistic<T extends { id?: number | string }>(initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingActions, setPendingActions] = useState<OptimisticAction<T>[]>([]);

  /**
   * Optimistically create an item
   */
  const optimisticCreate = useCallback(async (
    item: T,
    apiCall: (item: T) => Promise<T>
  ): Promise<T | null> => {
    const actionId = `opt-create-${Date.now()}`;
    
    // Optimistically add to data
    setData(prev => [...prev, item]);
    
    // Track pending action
    const action: OptimisticAction<T> = {
      id: actionId,
      type: 'create',
      data: item,
      previousData: [...data],
      timestamp: new Date(),
      status: 'pending'
    };
    setPendingActions(prev => [...prev, action]);

    try {
      // Make actual API call
      const result = await apiCall(item);
      
      // Update with real data from server
      setData(prev => prev.map(d => d === item ? result : d));
      
      // Mark action as success
      setPendingActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, status: 'success' as const } : a)
      );
      
      // Clean up after delay
      setTimeout(() => {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }, 1000);
      
      return result;
    } catch (error) {
      // Rollback on error
      setData(prev => prev.filter(d => d !== item));
      
      // Mark action as failed
      setPendingActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, status: 'failed' as const } : a)
      );
      
      // Clean up failed action after delay
      setTimeout(() => {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }, 2000);
      
      throw error;
    }
  }, [data]);

  /**
   * Optimistically update an item
   */
  const optimisticUpdate = useCallback(async (
    updatedItem: T,
    apiCall: (item: T) => Promise<T>
  ): Promise<T | null> => {
    const actionId = `opt-update-${Date.now()}`;
    
    // Find and store previous data
    const previousItem = data.find(d => d.id === updatedItem.id);
    if (!previousItem) {
      throw new Error('Item not found for update');
    }
    
    // Optimistically update data
    setData(prev => prev.map(d => d.id === updatedItem.id ? updatedItem : d));
    
    // Track pending action
    const action: OptimisticAction<T> = {
      id: actionId,
      type: 'update',
      data: updatedItem,
      previousData: previousItem,
      timestamp: new Date(),
      status: 'pending'
    };
    setPendingActions(prev => [...prev, action]);

    try {
      // Make actual API call
      const result = await apiCall(updatedItem);
      
      // Update with real data from server
      setData(prev => prev.map(d => d.id === updatedItem.id ? result : d));
      
      // Mark action as success
      setPendingActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, status: 'success' as const } : a)
      );
      
      // Clean up after delay
      setTimeout(() => {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }, 1000);
      
      return result;
    } catch (error) {
      // Rollback on error
      setData(prev => prev.map(d => d.id === updatedItem.id ? previousItem : d));
      
      // Mark action as failed
      setPendingActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, status: 'failed' as const } : a)
      );
      
      // Clean up failed action after delay
      setTimeout(() => {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }, 2000);
      
      throw error;
    }
  }, [data]);

  /**
   * Optimistically delete an item
   */
  const optimisticDelete = useCallback(async (
    itemId: number | string,
    apiCall: (id: number | string) => Promise<void>
  ): Promise<void> => {
    const actionId = `opt-delete-${Date.now()}`;
    
    // Find and store item to delete
    const itemToDelete = data.find(d => d.id === itemId);
    if (!itemToDelete) {
      throw new Error('Item not found for deletion');
    }
    
    // Optimistically remove from data
    setData(prev => prev.filter(d => d.id !== itemId));
    
    // Track pending action
    const action: OptimisticAction<T> = {
      id: actionId,
      type: 'delete',
      data: itemToDelete,
      previousData: itemToDelete,
      timestamp: new Date(),
      status: 'pending'
    };
    setPendingActions(prev => [...prev, action]);

    try {
      // Make actual API call
      await apiCall(itemId);
      
      // Mark action as success
      setPendingActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, status: 'success' as const } : a)
      );
      
      // Clean up after delay
      setTimeout(() => {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }, 1000);
    } catch (error) {
      // Rollback on error - restore deleted item
      setData(prev => [...prev, itemToDelete]);
      
      // Mark action as failed
      setPendingActions(prev =>
        prev.map(a => a.id === actionId ? { ...a, status: 'failed' as const } : a)
      );
      
      // Clean up failed action after delay
      setTimeout(() => {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }, 2000);
      
      throw error;
    }
  }, [data]);

  /**
   * Check if an item is pending
   */
  const isPending = useCallback((itemId?: number | string): boolean => {
    if (!itemId) {
      return pendingActions.some(a => a.status === 'pending');
    }
    return pendingActions.some(
      a => a.status === 'pending' && a.data.id === itemId
    );
  }, [pendingActions]);

  /**
   * Get pending actions
   */
  const getPendingActions = useCallback((): OptimisticAction<T>[] => {
    return pendingActions.filter(a => a.status === 'pending');
  }, [pendingActions]);

  return {
    data,
    setData,
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    isPending,
    getPendingActions,
    hasPending: pendingActions.some(a => a.status === 'pending'),
    pendingCount: pendingActions.filter(a => a.status === 'pending').length
  };
}

export default useOptimistic;
