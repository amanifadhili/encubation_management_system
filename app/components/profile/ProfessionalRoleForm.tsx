import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';
import {
  UserIcon,
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

interface ProfessionalRoleFormProps {
  onSave?: (role: string, otherRole?: string) => void;
  initialRole?: string;
}

const roleOptions = [
  {
    value: 'ProjectLead',
    label: 'Project Lead',
    icon: UserIcon,
    description: 'I lead and manage the project',
    emoji: '👑',
    color: 'purple',
  },
  {
    value: 'Founder',
    label: 'Founder/Co-Founder',
    icon: UserGroupIcon,
    description: 'I founded or co-founded the company',
    emoji: '👥',
    color: 'blue',
  },
  {
    value: 'Employee',
    label: 'Employee',
    icon: BriefcaseIcon,
    description: 'I work as an employee on the project',
    emoji: '💼',
    color: 'green',
  },
  {
    value: 'AttendsWorkshopsOnly',
    label: 'Attends Workshops/Events Only',
    icon: AcademicCapIcon,
    description: 'I participate in events',
    emoji: '📚',
    color: 'yellow',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: PlusCircleIcon,
    description: 'Other role',
    emoji: '➕',
    color: 'gray',
  },
];

export const ProfessionalRoleForm: React.FC<ProfessionalRoleFormProps> = ({ onSave, initialRole }) => {
  const { profile } = useProfile();
  const [formData, setFormData] = useState({
    current_role: '',
    other_role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data from profile or initialRole prop
  useEffect(() => {
    const role = initialRole || profile?.current_role || '';
    setFormData({
      current_role: role,
      other_role: '',
    });
  }, [profile, initialRole]);

  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      current_role: role,
      other_role: role === 'Other' ? prev.other_role : '',
    }));

    // Clear error when user selects
    if (errors.current_role) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.current_role;
        return newErrors;
      });
    }
  };

  const handleOtherRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      other_role: e.target.value,
    }));

    if (errors.other_role) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.other_role;
        return newErrors;
      });
    }
  };

  const handleBlur = () => {
    setTouched((prev) => ({ ...prev, current_role: true }));
    validateForm();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_role) {
      newErrors.current_role = 'Please select your current role';
    } else if (formData.current_role === 'Other' && !formData.other_role.trim()) {
      newErrors.other_role = 'Please specify your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      setTouched({ current_role: true, other_role: true });
      return;
    }

    try {
      setSaving(true);

      // Pass data to parent
      if (onSave) {
        const finalRole = formData.current_role === 'Other' 
          ? formData.other_role 
          : formData.current_role;
        onSave(formData.current_role, formData.other_role);
      }
    } catch (error) {
      console.error('Failed to save professional role:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = roleOptions.find(
    (opt) => opt.value === formData.current_role
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Current Role in Company/Project"
        name="current_role"
        required
        error={errors.current_role}
        touched={touched.current_role}
        helperText="Select your primary role in the project or company"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.current_role === option.value;
            const colorClasses = {
              purple: isSelected
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                : 'border-gray-200 hover:border-purple-300',
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
                onClick={() => handleRoleChange(option.value)}
                onBlur={handleBlur}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  colorClasses[option.color as keyof typeof colorClasses]
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        isSelected
                          ? option.color === 'purple'
                            ? 'bg-purple-500'
                            : option.color === 'blue'
                            ? 'bg-blue-500'
                            : option.color === 'green'
                            ? 'bg-green-500'
                            : option.color === 'yellow'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <span className={isSelected ? 'text-white' : 'text-gray-600'}>
                        {option.emoji}
                      </span>
                    </div>
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

      {/* Other Role Input */}
      {formData.current_role === 'Other' && (
        <FormField
          label="Please Specify Your Role"
          name="other_role"
          required
          error={errors.other_role}
          touched={touched.other_role}
        >
          <input
            type="text"
            id="other_role"
            name="other_role"
            value={formData.other_role}
            onChange={handleOtherRoleChange}
            onBlur={() => setTouched((prev) => ({ ...prev, other_role: true }))}
            placeholder="Describe your role"
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
              errors.other_role && touched.other_role
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200'
            }`}
            maxLength={100}
          />
        </FormField>
      )}

      {/* Selected Role Display */}
      {selectedOption && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  selectedOption.color === 'purple'
                    ? 'bg-purple-100'
                    : selectedOption.color === 'blue'
                    ? 'bg-blue-100'
                    : selectedOption.color === 'green'
                    ? 'bg-green-100'
                    : selectedOption.color === 'yellow'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
                }`}
              >
                {selectedOption.emoji}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Selected Role: {selectedOption.label}
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

export default ProfessionalRoleForm;

