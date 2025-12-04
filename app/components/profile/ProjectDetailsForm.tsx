import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import Button from '../Button';
import {
  ComputerDesktopIcon,
  BeakerIcon,
  HeartIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  LeafIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  FolderOpenIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

interface ProjectDetailsFormProps {
  initialData?: {
    description?: string;
    challenge_description?: string;
    category?: string;
  };
  onSave?: (data: {
    description: string;
    challenge_description: string;
    category: string;
  }) => void;
  onSubmit?: () => void;
}

const categoryOptions = [
  {
    value: 'Technology',
    label: 'Technology',
    icon: ComputerDesktopIcon,
    emoji: '💻',
    color: 'blue',
  },
  {
    value: 'AgriTech',
    label: 'Agriculture / AgriTech',
    icon: BeakerIcon,
    emoji: '🌾',
    color: 'green',
  },
  {
    value: 'HealthTech',
    label: 'Health / HealthTech',
    icon: HeartIcon,
    emoji: '🏥',
    color: 'red',
  },
  {
    value: 'EdTech',
    label: 'Education / EdTech',
    icon: AcademicCapIcon,
    emoji: '📚',
    color: 'purple',
  },
  {
    value: 'Design',
    label: 'Design',
    icon: PaintBrushIcon,
    emoji: '🎨',
    color: 'pink',
  },
  {
    value: 'SocialImpact',
    label: 'Social Impact',
    icon: GlobeAltIcon,
    emoji: '🌍',
    color: 'indigo',
  },
  {
    value: 'Sustainability',
    label: 'Sustainability / Green Tech',
    icon: LeafIcon,
    emoji: '🌱',
    color: 'green',
  },
  {
    value: 'RoboticsAI',
    label: 'Robotics / AI',
    icon: CpuChipIcon,
    emoji: '🤖',
    color: 'gray',
  },
  {
    value: 'FinTech',
    label: 'FinTech',
    icon: CurrencyDollarIcon,
    emoji: '💳',
    color: 'yellow',
  },
  {
    value: 'OpenToAny',
    label: 'Open to any project',
    icon: FolderOpenIcon,
    emoji: '📋',
    color: 'gray',
  },
  {
    value: 'Other',
    label: 'Other',
    icon: PlusCircleIcon,
    emoji: '➕',
    color: 'gray',
  },
];

const colorClasses = {
  blue: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
  green: 'border-green-500 bg-green-50 ring-2 ring-green-500',
  red: 'border-red-500 bg-red-50 ring-2 ring-red-500',
  purple: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500',
  pink: 'border-pink-500 bg-pink-50 ring-2 ring-pink-500',
  indigo: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500',
  yellow: 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500',
  gray: 'border-gray-500 bg-gray-50 ring-2 ring-gray-500',
};

export const ProjectDetailsForm: React.FC<ProjectDetailsFormProps> = ({
  initialData,
  onSave,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    challenge_description: '',
    category: '',
    other_category: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description || '',
        challenge_description: initialData.challenge_description || '',
        category: initialData.category || '',
        other_category: '',
      });
    }
  }, [initialData]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category,
      other_category: category === 'Other' ? prev.other_category : '',
    }));

    if (errors.category) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.category;
        return newErrors;
      });
    }
  };

  const handleOtherCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      other_category: e.target.value,
    }));

    if (errors.other_category) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.other_category;
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
      case 'description':
        if (!formData.description.trim()) {
          newErrors.description = 'Project description is required';
        } else {
          const wordCount = formData.description.trim().split(/\s+/).length;
          if (wordCount < 20) {
            newErrors.description = 'Description should be at least 20 words (recommended: 200-500 words)';
          } else {
            delete newErrors.description;
          }
        }
        break;
      case 'challenge_description':
        if (!formData.challenge_description.trim()) {
          newErrors.challenge_description = 'Challenge/problem description is required';
        } else {
          const wordCount = formData.challenge_description.trim().split(/\s+/).length;
          if (wordCount < 10) {
            newErrors.challenge_description = 'Challenge description should be at least 10 words (recommended: 100-300 words)';
          } else {
            delete newErrors.challenge_description;
          }
        }
        break;
      case 'category':
        if (!formData.category) {
          newErrors.category = 'Please select a project category';
        } else if (formData.category === 'Other' && !formData.other_category.trim()) {
          newErrors.other_category = 'Please specify the category';
        } else {
          delete newErrors.category;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const fieldsToValidate = ['description', 'challenge_description', 'category'];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    setTouched({
      description: true,
      challenge_description: true,
      category: true,
      other_category: true,
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

      const finalCategory = formData.category === 'Other' 
        ? formData.other_category 
        : formData.category;

      if (onSave) {
        onSave({
          description: formData.description.trim(),
          challenge_description: formData.challenge_description.trim(),
          category: finalCategory,
        });
      }

      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      console.error('Failed to save project details:', error);
    } finally {
      setSaving(false);
    }
  };

  const descriptionWordCount = formData.description.trim().split(/\s+/).filter(w => w).length;
  const challengeWordCount = formData.challenge_description.trim().split(/\s+/).filter(w => w).length;
  const selectedCategory = categoryOptions.find((opt) => opt.value === formData.category);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Description */}
      <FormField
        label="Project Description"
        name="description"
        required
        error={errors.description}
        touched={touched.description}
        helperText="Describe your project in detail (recommended: 200-500 words)"
      >
        <div className="relative">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleTextareaChange}
            onBlur={() => handleBlur('description')}
            placeholder="Describe your project..."
            rows={8}
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md resize-y ${
              errors.description && touched.description
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200'
            }`}
          />
          <div className="absolute bottom-3 right-3">
            <span
              className={`text-xs ${
                descriptionWordCount < 20
                  ? 'text-red-500'
                  : descriptionWordCount < 200
                  ? 'text-yellow-500'
                  : 'text-gray-400'
              }`}
            >
              {descriptionWordCount} words
              {descriptionWordCount < 200 && ' (recommended: 200-500)'}
            </span>
          </div>
        </div>
      </FormField>

      {/* Challenge/Problem Description */}
      <FormField
        label="Specific Challenge/Problem"
        name="challenge_description"
        required
        error={errors.challenge_description}
        touched={touched.challenge_description}
        helperText="Be specific about the problem you're addressing (recommended: 100-300 words)"
      >
        <div className="relative">
          <textarea
            id="challenge_description"
            name="challenge_description"
            value={formData.challenge_description}
            onChange={handleTextareaChange}
            onBlur={() => handleBlur('challenge_description')}
            placeholder="Describe the specific challenge or problem..."
            rows={6}
            className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md resize-y ${
              errors.challenge_description && touched.challenge_description
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200'
            }`}
          />
          <div className="absolute bottom-3 right-3">
            <span
              className={`text-xs ${
                challengeWordCount < 10
                  ? 'text-red-500'
                  : challengeWordCount < 100
                  ? 'text-yellow-500'
                  : 'text-gray-400'
              }`}
            >
              {challengeWordCount} words
              {challengeWordCount < 100 && ' (recommended: 100-300)'}
            </span>
          </div>
        </div>
      </FormField>

      {/* Project Category */}
      <FormField
        label="Project Category"
        name="category"
        required
        error={errors.category}
        touched={touched.category}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.category === option.value;
            const colorClass = colorClasses[option.color as keyof typeof colorClasses] || colorClasses.gray;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleCategoryChange(option.value)}
                onBlur={() => handleBlur('category')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? colorClass
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? option.color === 'blue'
                        ? 'bg-blue-500'
                        : option.color === 'green'
                        ? 'bg-green-500'
                        : option.color === 'red'
                        ? 'bg-red-500'
                        : option.color === 'purple'
                        ? 'bg-purple-500'
                        : option.color === 'pink'
                        ? 'bg-pink-500'
                        : option.color === 'indigo'
                        ? 'bg-indigo-500'
                        : option.color === 'yellow'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                      : 'bg-gray-100'
                  }`}>
                    <span className="text-xl">{option.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Other Category Input */}
        {formData.category === 'Other' && (
          <div className="mt-4">
            <input
              type="text"
              id="other_category"
              name="other_category"
              value={formData.other_category}
              onChange={handleOtherCategoryChange}
              onBlur={() => handleBlur('other_category')}
              placeholder="Specify the category"
              className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                errors.other_category && touched.other_category
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
              maxLength={100}
            />
          </div>
        )}

        {/* Selected Category Display */}
        {selectedCategory && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white">
                  <span className="text-2xl">{selectedCategory.emoji}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Selected Category: {selectedCategory.label}
                </p>
              </div>
            </div>
          </div>
        )}
      </FormField>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Project Details'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectDetailsForm;

