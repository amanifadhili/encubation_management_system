import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { ButtonLoader } from "./loading";

/**
 * RestoreConfirmationModal Component
 * 
 * A reusable modal component for confirming restore operations.
 * 
 * @example
 * ```tsx
 * <RestoreConfirmationModal
 *   open={restoreModalOpen}
 *   onClose={() => setRestoreModalOpen(false)}
 *   onConfirm={handleRestore}
 *   itemName="Team ABC"
 *   itemType="team"
 *   loading={restoring}
 * />
 * ```
 */
export interface RestoreConfirmationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed (cancel button or backdrop click) */
  onClose: () => void;
  /** Callback when restore is confirmed */
  onConfirm: () => Promise<void> | void;
  /** Name of the item being restored (optional, for display) */
  itemName?: string;
  /** Type of item being restored (e.g., "team", "mentor", "user") */
  itemType?: string;
  /** Loading state during restore operation */
  loading?: boolean;
  /** Error message to display (optional) */
  error?: string | null;
  /** Custom description text */
  description?: string;
}

const RestoreConfirmationModal: React.FC<RestoreConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  loading = false,
  error = null,
  description
}) => {
  // Handle confirm
  const handleConfirm = async () => {
    if (loading) return;
    
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !loading) {
      onClose();
    } else if (e.key === "Enter" && !loading) {
      handleConfirm();
    }
  };

  // Generate description text
  const defaultDescription = `Are you sure you want to restore ${itemName ? `"${itemName}"` : `this ${itemType}`}? They will be able to access the system again.`;
  const finalDescription = description || defaultDescription;

  return (
    <Modal
      title={`Restore ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}${itemName ? `: ${itemName}` : ""}`}
      open={open}
      onClose={loading ? undefined : onClose}
      role="alertdialog"
      aria-labelledby="restore-modal-title"
      aria-describedby="restore-modal-description"
      loading={loading}
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Info Icon and Description */}
        <div 
          id="restore-modal-description"
          className="flex items-start gap-3 p-4 rounded-lg border-l-4 bg-green-50 border-green-500 text-green-900"
        >
          <svg
            className="w-6 h-6 flex-shrink-0 mt-0.5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-semibold mb-1">Restore {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</p>
            <p className="text-sm">{finalDescription}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            variant="secondary"
            className="flex-1"
            aria-label="Cancel restore"
          >
            Cancel
          </Button>
          <ButtonLoader
            type="button"
            onClick={handleConfirm}
            loading={loading}
            label="Restore"
            loadingText="Restoring..."
            variant="primary"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
            aria-label={`Confirm restore of ${itemType}`}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RestoreConfirmationModal;

