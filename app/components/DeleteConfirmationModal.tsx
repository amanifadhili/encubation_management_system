import React, { useState, useEffect, useRef } from "react";
import { ButtonLoader } from "./loading";
import Modal from "./Modal";
import { FormField } from "./FormField";

/**
 * DeleteConfirmationModal Component
 * 
 * A reusable modal component for confirming destructive delete operations.
 * Requires users to type "DELETE" (or custom confirmation text) to enable the delete button.
 * 
 * @example
 * ```tsx
 * <DeleteConfirmationModal
 *   open={deleteModalOpen}
 *   onClose={() => setDeleteModalOpen(false)}
 *   onConfirm={handleDelete}
 *   itemName="Inventory Item #123"
 *   itemType="inventory item"
 *   loading={deleting}
 * />
 * ```
 */
export interface DeleteConfirmationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed (cancel button or backdrop click) */
  onClose: () => void;
  /** Callback when delete is confirmed */
  onConfirm: () => Promise<void> | void;
  /** Name of the item being deleted (optional, for display) */
  itemName?: string;
  /** Type of item being deleted (e.g., "team", "mentor", "inventory item") */
  itemType?: string;
  /** Custom confirmation text (default: "DELETE"). Set to empty string or null to disable confirmation input. */
  confirmationText?: string | null;
  /** Loading state during delete operation */
  loading?: boolean;
  /** Error message to display (optional) */
  error?: string | null;
  /** Show as destructive action (default: true) */
  destructive?: boolean;
  /** Custom description text */
  description?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  confirmationText = null, // Changed default to null - no confirmation required by default
  loading = false,
  error = null,
  destructive = true,
  description
}) => {
  const [inputValue, setInputValue] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens (only if confirmation is required)
  useEffect(() => {
    if (open && inputRef.current && confirmationText) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, confirmationText]);

  // Reset input when modal closes
  useEffect(() => {
    if (!open) {
      setInputValue("");
      setTouched(false);
    }
  }, [open]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!touched) {
      setTouched(true);
    }
  };

  // Validate confirmation text (if required)
  const requiresConfirmation = confirmationText !== null && confirmationText !== "";
  const isValid = !requiresConfirmation || inputValue === confirmationText;
  const hasError = requiresConfirmation && touched && inputValue !== "" && !isValid;

  // Handle confirm
  const handleConfirm = async () => {
    if (!isValid || loading) return;
    
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done by parent component
      // The error prop will be passed to display error message
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !loading) {
      onClose();
    } else if (e.key === "Enter" && isValid && !loading) {
      handleConfirm();
    }
  };

  // Generate description text
  const defaultDescription = destructive
    ? `This action cannot be undone. This will permanently delete ${itemName ? `"${itemName}"` : `the ${itemType}`} and all associated data.`
    : `Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType}`}?`;

  const finalDescription = description || defaultDescription;

  // Determine if this is a soft delete (deactivate) based on description or default behavior
  // If description mentions "deactivate" or "restore", it's a soft delete
  const isSoftDelete = description?.toLowerCase().includes('deactivate') || 
                       description?.toLowerCase().includes('restore') ||
                       (!description && !destructive); // Default to soft delete if not explicitly destructive

  const actionVerb = isSoftDelete ? "Deactivate" : "Delete";
  const actionVerbLower = isSoftDelete ? "deactivate" : "delete";

  return (
    <Modal
      title={`${actionVerb} ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}${itemName ? `: ${itemName}` : ""}`}
      open={open}
      onClose={loading ? undefined : onClose}
      role="alertdialog"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
      loading={loading}
    >
      <div className="space-y-4">
        {/* Warning Icon and Description */}
        <div 
          id="delete-modal-description"
          className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${
            destructive
              ? "bg-red-50 border-red-500 text-red-900"
              : "bg-yellow-50 border-yellow-500 text-yellow-900"
          }`}
        >
          <svg
            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              destructive ? "text-red-600" : "text-yellow-600"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-semibold mb-1">
              {isSoftDelete ? "Deactivate" : "Warning: This action is irreversible"}
            </p>
            <p className="text-sm">{finalDescription}</p>
          </div>
        </div>

        {/* Confirmation Input - Only show if confirmation text is required */}
        {requiresConfirmation && (
          <FormField
            label={`Type "${confirmationText}" to confirm`}
            name="delete-confirmation"
            error={hasError ? `You must type "${confirmationText}" exactly to confirm deletion` : undefined}
            touched={touched}
            required
            autoFocus
          >
            <input
              ref={inputRef}
              id="delete-confirmation"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => setTouched(true)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                hasError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50"
                  : isValid
                  ? "border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white"
              } text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder={`Type "${confirmationText}" here`}
              aria-required="true"
              aria-invalid={hasError}
              aria-describedby={hasError ? "delete-confirmation-error" : undefined}
            />
          </FormField>
        )}

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
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <ButtonLoader
            type="button"
            onClick={handleConfirm}
            loading={loading}
            label={actionVerb}
            loadingText={isSoftDelete ? "Deactivating..." : "Deleting..."}
            variant={isSoftDelete ? "warning" : "danger"}
            disabled={!isValid || loading}
            className={`flex-1 px-4 py-3 ${
              isSoftDelete
                ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                : destructive
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            } text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`Confirm ${actionVerbLower} of ${itemType}`}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;

