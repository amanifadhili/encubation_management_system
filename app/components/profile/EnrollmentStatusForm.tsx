import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';
import { 
  AcademicCapIcon, 
  CheckCircleIcon, 
  PauseCircleIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface EnrollmentStatusFormProps {
  onSave?: (status: string) => void;
}

const enrollmentStatusOptions = [
  {
    value: 'CurrentlyEnrolled',
    label: 'Currently Enrolled',
    icon: AcademicCapIcon,
    description: 'I am currently enrolled as a student',
    color: 'blue',
  },
  {
    value: 'Graduated',
    label: 'Graduated',
    icon: CheckCircleIcon,
    description: 'I have completed my studies',
    color: 'green',
  },
  {
    value: 'OnLeave',
    label: 'On Leave',
    icon: PauseCircleIcon,
    description: 'I am currently on leave from studies',
    color: 'yellow',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: DocumentTextIcon,
    description: 'Other enrollment status',
    color: 'gray',
  },
];

export const EnrollmentStatusForm: React.FC<EnrollmentStatusFormProps> = ({ onSave }) => {
  const { profile, updatePhase2 } = useProfile();
  const [formData, setFormData] = useState({
    enrollment_status: '',
    other_status: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        enrollment_status: profile.enrollment_status || '',
        other_status: '',
      });
    }
  }, [profile]);

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({
      ...prev,
      enrollment_status: status,
      other_status: status === 'Other' ? prev.other_status : '',
    }));

    // Clear error when user selects
    if (errors.enrollment_status) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.enrollment_status;
        return newErrors;
      });
    }
  };

  const handleOtherStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      other_status: e.target.value,
    }));
  };

  const handleBlur = () => {
    setTouched((prev) => ({ ...prev, enrollment_status: true }));
    validateForm();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.enrollment_status) {
      newErrors.enrollment_status = 'Please select your enrollment status';
    } else if (formData.enrollment_status === 'Other' && !formData.other_status.trim()) {
      newErrors.other_status = 'Please specify your enrollment status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      setTouched({ enrollment_status: true, other_status: true });
      return;
    }

    try {
      setSaving(true);

      // Pass the selected status to parent
      // The actual save will be handled by Phase2Form parent component when all fields are ready
      if (onSave) {
        const finalStatus = formData.enrollment_status === 'Other' 
          ? formData.other_status 
          : formData.enrollment_status;
        onSave(finalStatus);
      }
    } catch (error) {
      console.error('Failed to save enrollment status:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = enrollmentStatusOptions.find(
    (opt) => opt.value === formData.enrollment_status
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Current Enrollment Status"
        name="enrollment_status"
        required
        error={errors.enrollment_status}
        touched={touched.enrollment_status}
        helperText="Select your current academic status"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enrollmentStatusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.enrollment_status === option.value;
            const colorClasses = {
              blue: isSelected
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-blue-300',
              green: isSelected
                ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                : 'border-gray-200 hover:border-green-300',
              yellow: isSelected
                ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500'
                : 'border-gray-200 hover:border-yellow-300',
              gray: isSelected
                ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-500'
                : 'border-gray-200 hover:border-gray-300',
            };

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                onBlur={handleBlur}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  colorClasses[option.color as keyof typeof colorClasses]
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? option.color === 'blue'
                          ? 'bg-blue-500'
                          : option.color === 'green'
                          ? 'bg-green-500'
                          : option.color === 'yellow'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </FormField>

      {/* Other Status Input */}
      {formData.enrollment_status === 'Other' && (
        <FormField
          label="Please Specify"
          name="other_status"
          required
          error={errors.other_status}
          touched={touched.other_status}
        >
          <input
            type="text"
            id="other_status"
            name="other_status"
            value={formData.other_status}
            onChange={handleOtherStatusChange}
            onBlur={() => setTouched((prev) => ({ ...prev, other_status: true }))}
            placeholder="Describe your enrollment status"
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
              errors.other_status && touched.other_status
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200'
            }`}
            maxLength={100}
          />
        </FormField>
      )}

      {/* Visual Timeline Indicator */}
      {selectedOption && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedOption.color === 'blue'
                    ? 'bg-blue-100'
                    : selectedOption.color === 'green'
                    ? 'bg-green-100'
                    : selectedOption.color === 'yellow'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
                }`}
              >
                {React.createElement(selectedOption.icon, {
                  className: `w-6 h-6 ${
                    selectedOption.color === 'blue'
                      ? 'text-blue-600'
                      : selectedOption.color === 'green'
                      ? 'text-green-600'
                      : selectedOption.color === 'yellow'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`,
                })}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Status: {selectedOption.label}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {selectedOption.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
};

export default EnrollmentStatusForm;

