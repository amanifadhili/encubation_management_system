import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface AdditionalNotesFormProps {
  onSave?: () => void;
}

export const AdditionalNotesForm: React.FC<AdditionalNotesFormProps> = ({ onSave }) => {
  const { profile, updatePhase5 } = useProfile();
  const [formData, setFormData] = useState({
    additional_notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile?.additional_notes) {
      setFormData({
        additional_notes: profile.additional_notes,
      });
    }
  }, [profile]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    
    // Check word limit (500 words)
    const wordCount = value.trim().split(/\s+/).filter(w => w).length;
    if (wordCount > 500) {
      setErrors({
        additional_notes: 'Additional notes cannot exceed 500 words',
      });
    } else {
      setErrors({});
    }

    setFormData({
      additional_notes: value,
    });
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const validateForm = (): boolean => {
    const wordCount = formData.additional_notes.trim().split(/\s+/).filter(w => w).length;
    
    if (wordCount > 500) {
      setErrors({
        additional_notes: 'Additional notes cannot exceed 500 words',
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      setTouched(true);
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        additional_notes: formData.additional_notes.trim() || undefined,
      };

      const success = await updatePhase5(updateData);
      if (success && onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save additional notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = formData.additional_notes.trim().split(/\s+/).filter(w => w).length;
  const maxWords = 500;
  const isNearLimit = wordCount > maxWords * 0.9;
  const isOverLimit = wordCount > maxWords;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">📝 Optional Information</p>
            <p className="text-sm text-blue-700">
              This section is optional but helps us provide better support. You can add any additional context or information about yourself or your project.
            </p>
          </div>
        </div>
      </div>

      <FormField
        label="Additional Comments/Notes"
        name="additional_notes"
        error={errors.additional_notes}
        touched={touched}
        helperText="This information helps us provide better support (optional, max 500 words)"
      >
        <div className="relative">
          <textarea
            id="additional_notes"
            name="additional_notes"
            value={formData.additional_notes}
            onChange={handleTextareaChange}
            onBlur={handleBlur}
            placeholder="Any additional information you'd like to share..."
            rows={8}
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md resize-y ${
              errors.additional_notes && touched
                ? 'border-red-500 bg-red-50'
                : isOverLimit
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200'
            }`}
          />
          <div className="absolute bottom-3 right-3">
            <span
              className={`text-xs font-medium ${
                isOverLimit
                  ? 'text-red-600'
                  : isNearLimit
                  ? 'text-yellow-600'
                  : 'text-gray-400'
              }`}
            >
              {wordCount}/{maxWords} words
              {isOverLimit && ' (over limit)'}
            </span>
          </div>
        </div>
      </FormField>

      {/* Word Count Info */}
      {wordCount > 0 && (
        <div className={`text-sm ${
          isOverLimit
            ? 'text-red-600'
            : isNearLimit
            ? 'text-yellow-600'
            : 'text-gray-600'
        }`}>
          {isOverLimit && (
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Please reduce the word count to 500 words or less.
            </p>
          )}
          {!isOverLimit && isNearLimit && (
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Approaching word limit. Consider being more concise.
            </p>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving || isOverLimit}
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>

      {/* Optional Badge Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">💡 Note:</span>
          <p className="text-sm text-gray-600">
            This section is completely optional. You can skip it or fill it out later. It doesn't block access to any features.
          </p>
        </div>
      </div>
    </form>
  );
};

export default AdditionalNotesForm;

