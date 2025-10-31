/**
 * Conflict Dialog Component
 * Displays 409 conflict errors with resolution options
 */
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ButtonLoader } from './loading';

export interface ConflictDetails {
  field?: string;
  value?: any;
  existingResource?: any;
  conflictType?: 'duplicate' | 'version' | 'state' | 'concurrent';
  message: string;
}

export interface ConflictDialogProps {
  open: boolean;
  onClose: () => void;
  conflictDetails: ConflictDetails;
  onResolve?: (action: 'overwrite' | 'merge' | 'cancel') => void;
  onViewExisting?: () => void;
  allowOverwrite?: boolean;
  allowMerge?: boolean;
  className?: string;
  loading?: boolean;
  resolvingAction?: 'overwrite' | 'merge' | 'view' | null;
}

export function ConflictDialog({
  open,
  onClose,
  conflictDetails,
  onResolve,
  onViewExisting,
  allowOverwrite = false,
  allowMerge = false,
  className = '',
  loading = false,
  resolvingAction = null
}: ConflictDialogProps) {
  const { field, value, conflictType = 'duplicate', message, existingResource } = conflictDetails;

  const getConflictIcon = () => {
    switch (conflictType) {
      case 'duplicate':
        return '⚠️';
      case 'version':
        return '🔄';
      case 'state':
        return '⛔';
      case 'concurrent':
        return '👥';
      default:
        return '⚠️';
    }
  };

  const getConflictTitle = () => {
    switch (conflictType) {
      case 'duplicate':
        return 'Duplicate Resource Detected';
      case 'version':
        return 'Version Conflict';
      case 'state':
        return 'State Conflict';
      case 'concurrent':
        return 'Concurrent Modification';
      default:
        return 'Conflict Detected';
    }
  };

  const handleResolve = (action: 'overwrite' | 'merge' | 'cancel') => {
    if (onResolve) {
      onResolve(action);
    }
    if (action === 'cancel') {
      onClose();
    }
  };

  return (
    <Modal
      title={getConflictTitle()}
      open={open}
      onClose={onClose}
      actions={null}
      role="alertdialog"
      aria-modal="true"
      className={className}
    >
      <div className="space-y-4">
        {/* Icon and Message */}
        <div className="flex items-start">
          <span className="text-4xl mr-3 flex-shrink-0">{getConflictIcon()}</span>
          <div className="flex-1">
            <p className="text-gray-800 text-base leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Conflict Details */}
        {field && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Conflict Details:</h4>
            <div className="space-y-1 text-sm">
              <p className="text-orange-800">
                <span className="font-medium">Field:</span> {field}
              </p>
              {value !== undefined && (
                <p className="text-orange-800">
                  <span className="font-medium">Your Value:</span> {String(value)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Existing Resource Info */}
        {existingResource && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Existing Resource:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {Object.entries(existingResource).map(([key, val]) => (
                <p key={key}>
                  <span className="font-medium">{key}:</span> {String(val)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Suggestions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">What would you like to do?</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Cancel and modify your input</li>
            {onViewExisting && <li>View the existing resource</li>}
            {allowOverwrite && <li>Overwrite the existing resource (if permitted)</li>}
            {allowMerge && <li>Merge your changes with the existing resource</li>}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
          <ButtonLoader
            loading={false}
            onClick={() => handleResolve('cancel')}
            label="Cancel"
            variant="secondary"
            disabled={loading}
          />
          
          {onViewExisting && (
            <ButtonLoader
              loading={resolvingAction === 'view'}
              onClick={onViewExisting}
              label="View Existing"
              loadingText="Loading..."
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            />
          )}
          
          {allowMerge && (
            <ButtonLoader
              loading={resolvingAction === 'merge'}
              onClick={() => handleResolve('merge')}
              label="Merge Changes"
              loadingText="Merging..."
              variant="success"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            />
          )}
          
          {allowOverwrite && (
            <ButtonLoader
              loading={resolvingAction === 'overwrite'}
              onClick={() => handleResolve('overwrite')}
              label="Overwrite"
              loadingText="Overwriting..."
              variant="danger"
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ConflictDialog;
