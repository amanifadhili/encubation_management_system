import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import Button from '../Button';
import {
  LightBulbIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  BeakerIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface ProjectBasicsFormProps {
  initialData?: {
    name?: string;
    status_at_enrollment?: string;
  };
  onSave?: (data: {
    name: string;
    status_at_enrollment: string;
  }) => void;
  onNext?: () => void;
}

const statusOptions = [
  {
    value: 'Idea',
    label: 'Idea Stage',
    description: 'Just an idea',
    icon: LightBulbIcon,
    emoji: '💡',
    color: 'yellow',
    progress: 0,
  },
  {
    value: 'Prototype',
    label: 'Prototype',
    description: 'Working prototype',
    icon: WrenchScrewdriverIcon,
    emoji: '🛠️',
    color: 'blue',
    progress: 25,
  },
  {
    value: 'MVP',
    label: 'MVP',
    description: 'Minimum viable product',
    icon: BoltIcon,
    emoji: '⚡',
    color: 'green',
    progress: 50,
  },
  {
    value: 'Beta',
    label: 'Beta',
    description: 'Testing with users',
    icon: BeakerIcon,
    emoji: '🧪',
    color: 'purple',
    progress: 75,
  },
  {
    value: 'Launched',
    label: 'Launched',
    description: 'Live and operating',
    icon: RocketLaunchIcon,
    emoji: '🚀',
    color: 'indigo',
    progress: 100,
  },
];

const colorClasses = {
  yellow: {
    selected: 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500',
    unselected: 'border-gray-200 hover:border-yellow-300',
    icon: 'bg-yellow-100 text-yellow-600',
  },
  blue: {
    selected: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
    unselected: 'border-gray-200 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-600',
  },
  green: {
    selected: 'border-green-500 bg-green-50 ring-2 ring-green-500',
    unselected: 'border-gray-200 hover:border-green-300',
    icon: 'bg-green-100 text-green-600',
  },
  purple: {
    selected: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500',
    unselected: 'border-gray-200 hover:border-purple-300',
    icon: 'bg-purple-100 text-purple-600',
  },
  indigo: {
    selected: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500',
    unselected: 'border-gray-200 hover:border-indigo-300',
    icon: 'bg-indigo-100 text-indigo-600',
  },
};

export const ProjectBasicsForm: React.FC<ProjectBasicsFormProps> = ({
  initialData,
  onSave,
  onNext,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    status_at_enrollment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        status_at_enrollment: initialData.status_at_enrollment || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({
      ...prev,
      status_at_enrollment: status,
    }));

    if (errors.status_at_enrollment) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.status_at_enrollment;
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors: Record<string, string> = { ...errors };

    switch (field) {
      case 'name':
        if (!formData.name.trim()) {
          newErrors.name = 'Project name is required';
        } else if (formData.name.length < 2) {
          newErrors.name = 'Project name must be at least 2 characters';
        } else if (formData.name.length > 100) {
          newErrors.name = 'Project name cannot exceed 100 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'status_at_enrollment':
        if (!formData.status_at_enrollment) {
          newErrors.status_at_enrollment = 'Please select project status';
        } else {
          delete newErrors.status_at_enrollment;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const fieldsToValidate = ['name', 'status_at_enrollment'];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    setTouched({
      name: true,
      status_at_enrollment: true,
    });

    return isValid;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (onSave) {
        onSave({
          name: formData.name.trim(),
          status_at_enrollment: formData.status_at_enrollment,
        });
      }

      if (onNext) {
        setTimeout(() => {
          onNext();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to save project basics:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedStatus = statusOptions.find(
    (opt) => opt.value === formData.status_at_enrollment
  );

  const maxNameLength = 100;
  const nameCharCount = formData.name.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name (Required) */}
      <FormField
        label="Project Name"
        name="name"
        required
        error={errors.name}
        touched={touched.name}
      >
        <div className="relative">
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={() => handleBlur('name')}
            placeholder="Enter your project name"
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
              errors.name && touched.name
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200'
            }`}
            maxLength={maxNameLength}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span
              className={`text-xs ${
                nameCharCount > maxNameLength * 0.9
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`}
            >
              {nameCharCount}/{maxNameLength}
            </span>
          </div>
        </div>
      </FormField>

      {/* Project Status at Enrollment */}
      <FormField
        label="Project Status at Enrollment"
        name="status_at_enrollment"
        required
        error={errors.status_at_enrollment}
        touched={touched.status_at_enrollment}
        helperText="Current stage of your project"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.status_at_enrollment === option.value;
            const colors = colorClasses[option.color as keyof typeof colorClasses];

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                onBlur={() => handleBlur('status_at_enrollment')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected ? colors.selected : colors.unselected
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                    <span className="text-2xl">{option.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold text-sm ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0"
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

        {/* Visual Timeline */}
        {selectedStatus && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Project Progress Timeline
              </p>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                    selectedStatus.color === 'yellow'
                      ? 'bg-yellow-500'
                      : selectedStatus.color === 'blue'
                      ? 'bg-blue-500'
                      : selectedStatus.color === 'green'
                      ? 'bg-green-500'
                      : selectedStatus.color === 'purple'
                      ? 'bg-purple-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${selectedStatus.progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Idea</span>
              <span>Prototype</span>
              <span>MVP</span>
              <span>Beta</span>
              <span>Launched</span>
            </div>
          </div>
        )}
      </FormField>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        {onNext && (
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Next: Project Details'}
          </Button>
        )}
        {!onNext && (
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </form>
  );
};

export default ProjectBasicsForm;

