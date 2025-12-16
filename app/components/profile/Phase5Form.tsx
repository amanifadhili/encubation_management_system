import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import AdditionalNotesForm from './AdditionalNotesForm';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface Phase5FormProps {
  onComplete?: () => void;
}

export const Phase5Form: React.FC<Phase5FormProps> = ({ onComplete }) => {
  const { completion, profile } = useProfile();

  const isPhase5Complete = completion?.phases.phase5 || false;
  const hasNotes = !!profile?.additional_notes && profile.additional_notes.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Optional Section Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Additional Information
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              This section is completely optional. Share any additional context or information that might help us provide better support.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              <span>📝</span>
              <span>Optional - Bonus Information</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AdditionalNotesForm onSave={onComplete} />
      </div>

      {/* Completion Status */}
      {isPhase5Complete && hasNotes && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">📝 Additional Information Saved!</p>
              <p className="text-sm text-green-700">
                Your additional notes have been saved. This helps us provide better support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skip Option Info */}
      {!hasNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                You can skip this section
              </p>
              <p className="text-xs text-gray-600">
                This section is optional and doesn't block access to any features. You can always come back and add information later.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase5Form;

