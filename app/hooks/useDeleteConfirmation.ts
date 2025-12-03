import { useState, useCallback } from "react";

/**
 * Hook for managing delete confirmation state and logic
 * 
 * Provides a convenient way to manage delete confirmation modals
 * with loading states and error handling.
 * 
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   itemToDelete,
 *   loading,
 *   error,
 *   openDeleteModal,
 *   closeDeleteModal,
 *   confirmDelete
 * } = useDeleteConfirmation<ItemType>({
 *   onConfirm: async (item) => {
 *     await deleteItem(item.id);
 *     // Handle success
 *   }
 * });
 * 
 * // In component
 * <DeleteConfirmationModal
 *   open={isOpen}
 *   onClose={closeDeleteModal}
 *   onConfirm={() => confirmDelete()}
 *   itemName={itemToDelete?.name}
 *   loading={loading}
 *   error={error}
 * />
 * ```
 */
export interface UseDeleteConfirmationOptions<T> {
  /** Callback function that performs the actual delete operation */
  onConfirm: (item: T) => Promise<void> | void;
  /** Optional callback after successful deletion */
  onSuccess?: (item: T) => void;
  /** Optional callback for errors */
  onError?: (error: any, item: T) => void;
  /** Custom confirmation text (default: "DELETE") */
  confirmationText?: string;
}

export interface UseDeleteConfirmationReturn<T> {
  /** Whether the delete confirmation modal is open */
  isOpen: boolean;
  /** The item currently being deleted */
  itemToDelete: T | null;
  /** Loading state during delete operation */
  loading: boolean;
  /** Error message if delete failed */
  error: string | null;
  /** Open the delete confirmation modal with an item */
  openDeleteModal: (item: T) => void;
  /** Close the delete confirmation modal */
  closeDeleteModal: () => void;
  /** Confirm and execute the delete operation */
  confirmDelete: () => Promise<void>;
  /** Reset all state */
  reset: () => void;
}

export function useDeleteConfirmation<T>({
  onConfirm,
  onSuccess,
  onError,
  confirmationText = "DELETE"
}: UseDeleteConfirmationOptions<T>): UseDeleteConfirmationReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Open the delete confirmation modal
   */
  const openDeleteModal = useCallback((item: T) => {
    setItemToDelete(item);
    setError(null);
    setIsOpen(true);
  }, []);

  /**
   * Close the delete confirmation modal
   */
  const closeDeleteModal = useCallback(() => {
    if (loading) return; // Prevent closing during delete operation
    
    setIsOpen(false);
    setError(null);
    // Don't reset itemToDelete immediately to allow for smooth transitions
    setTimeout(() => {
      setItemToDelete(null);
    }, 300);
  }, [loading]);

  /**
   * Confirm and execute the delete operation
   */
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete || loading) return;

    setLoading(true);
    setError(null);

    try {
      await onConfirm(itemToDelete);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(itemToDelete);
      }
      
      // Close modal after successful deletion
      setIsOpen(false);
      setTimeout(() => {
        setItemToDelete(null);
      }, 300);
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || "Failed to delete item. Please try again.";
      setError(errorMessage);
      
      // Call error callback if provided
      if (onError) {
        onError(err, itemToDelete);
      }
    } finally {
      setLoading(false);
    }
  }, [itemToDelete, loading, onConfirm, onSuccess, onError]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsOpen(false);
    setItemToDelete(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    isOpen,
    itemToDelete,
    loading,
    error,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    reset
  };
}

