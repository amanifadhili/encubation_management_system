import React, { useState, useEffect, useMemo } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';

interface AcademicDetailsFormProps {
  enrollmentStatus: string;
  onSave?: () => void;
}

// Common majors/programs for autocomplete
const commonMajors = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Business Administration',
  'Business Management',
  'Economics',
  'Accounting',
  'Finance',
  'Marketing',
  'Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biomedical Engineering',
  'Agriculture',
  'Agricultural Science',
  'Health Sciences',
  'Medicine',
  'Nursing',
  'Public Health',
  'Education',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Environmental Science',
  'Social Sciences',
  'Psychology',
  'Sociology',
  'Law',
  'Journalism',
  'Communication',
  'Design',
  'Architecture',
  'Arts',
];

// Program types based on major (simplified mapping)
const getProgramTypes = (major: string): string[] => {
  const lowerMajor = major.toLowerCase();
  
  if (lowerMajor.includes('computer') || lowerMajor.includes('software') || lowerMajor.includes('information')) {
    return [
      'Bachelor of Science in Computer Science',
      'Bachelor of Science in Software Engineering',
      'Bachelor of Science in Information Technology',
      'Bachelor of Science in Information Systems',
      'Master of Science in Computer Science',
      'Master of Science in Software Engineering',
    ];
  }
  
  if (lowerMajor.includes('business') || lowerMajor.includes('management') || lowerMajor.includes('economics') || lowerMajor.includes('accounting') || lowerMajor.includes('finance') || lowerMajor.includes('marketing')) {
    return [
      'Bachelor of Business Administration',
      'Bachelor of Science in Business Management',
      'Bachelor of Science in Economics',
      'Bachelor of Science in Accounting',
      'Bachelor of Science in Finance',
      'Bachelor of Science in Marketing',
      'Master of Business Administration (MBA)',
      'Master of Science in Business',
    ];
  }
  
  if (lowerMajor.includes('engineering')) {
    return [
      'Bachelor of Science in Engineering',
      'Bachelor of Engineering',
      'Master of Science in Engineering',
      'Master of Engineering',
    ];
  }
  
  if (lowerMajor.includes('health') || lowerMajor.includes('medicine') || lowerMajor.includes('nursing')) {
    return [
      'Bachelor of Science in Health Sciences',
      'Bachelor of Medicine and Bachelor of Surgery (MBBS)',
      'Bachelor of Science in Nursing',
      'Master of Public Health',
      'Master of Science in Health Sciences',
    ];
  }
  
  if (lowerMajor.includes('education')) {
    return [
      'Bachelor of Education',
      'Bachelor of Science in Education',
      'Master of Education',
    ];
  }
  
  // Default programs
  return [
    'Bachelor of Science',
    'Bachelor of Arts',
    'Bachelor of Science (Honors)',
    'Master of Science',
    'Master of Arts',
    'Doctor of Philosophy (PhD)',
  ];
};

export const AcademicDetailsForm: React.FC<AcademicDetailsFormProps> = ({
  enrollmentStatus,
  onSave,
}) => {
  const { profile, updatePhase2 } = useProfile();
  const [formData, setFormData] = useState({
    major_program: '',
    program_of_study: '',
    graduation_year: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [majorSuggestions, setMajorSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        major_program: profile.major_program || '',
        program_of_study: profile.program_of_study || '',
        graduation_year: profile.graduation_year?.toString() || '',
      });
    }
  }, [profile]);

  // Generate graduation years (current year - 10 to current year + 10)
  const graduationYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years.reverse(); // Most recent first
  }, []);

  // Filter majors based on input
  useEffect(() => {
    if (formData.major_program.length > 0) {
      const filtered = commonMajors.filter((major) =>
        major.toLowerCase().includes(formData.major_program.toLowerCase())
      );
      setMajorSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setMajorSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.major_program]);

  // Get available programs based on major
  const availablePrograms = useMemo(() => {
    if (!formData.major_program.trim()) {
      return [];
    }
    return getProgramTypes(formData.major_program);
  }, [formData.major_program]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear program of study if major changes
    if (name === 'major_program') {
      setFormData((prev) => ({
        ...prev,
        major_program: value,
        program_of_study: '', // Reset program when major changes
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFormData((prev) => ({
      ...prev,
      major_program: suggestion,
    }));
    setShowSuggestions(false);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors: Record<string, string> = { ...errors };

    switch (field) {
      case 'major_program':
        if (!formData.major_program.trim()) {
          newErrors.major_program = 'Major/Program of study is required';
        } else if (formData.major_program.length < 2) {
          newErrors.major_program = 'Major must be at least 2 characters';
        } else if (formData.major_program.length > 100) {
          newErrors.major_program = 'Major cannot exceed 100 characters';
        } else {
          delete newErrors.major_program;
        }
        break;
      case 'program_of_study':
        if (!formData.program_of_study.trim()) {
          newErrors.program_of_study = 'Program of study is required';
        } else if (formData.program_of_study.length < 2) {
          newErrors.program_of_study = 'Program of study must be at least 2 characters';
        } else if (formData.program_of_study.length > 100) {
          newErrors.program_of_study = 'Program of study cannot exceed 100 characters';
        } else {
          delete newErrors.program_of_study;
        }
        break;
      case 'graduation_year':
        if (!formData.graduation_year) {
          newErrors.graduation_year = 'Graduation year is required';
        } else {
          const year = parseInt(formData.graduation_year);
          const currentYear = new Date().getFullYear();
          if (year < 1900 || year > currentYear + 10) {
            newErrors.graduation_year = `Year must be between 1900 and ${currentYear + 10}`;
          } else {
            delete newErrors.graduation_year;
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const fieldsToValidate = ['major_program', 'program_of_study', 'graduation_year'];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    setTouched({
      major_program: true,
      program_of_study: true,
      graduation_year: true,
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

      const updateData = {
        enrollment_status: enrollmentStatus,
        major_program: formData.major_program.trim(),
        program_of_study: formData.program_of_study.trim(),
        graduation_year: parseInt(formData.graduation_year),
      };

      const success = await updatePhase2(updateData);
      if (success && onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save academic details:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Two-column layout for related fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Major/Program of Study */}
        <div className="md:col-span-2">
          <FormField
            label="Major/Program of Study"
            name="major_program"
            required
            error={errors.major_program}
            touched={touched.major_program}
            helperText="e.g., Computer Science, Business Administration"
          >
            <div className="relative">
              <input
                type="text"
                id="major_program"
                name="major_program"
                value={formData.major_program}
                onChange={handleInputChange}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                  handleBlur('major_program');
                }}
                onFocus={() => {
                  if (majorSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="e.g., Computer Science"
                className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                  errors.major_program && touched.major_program
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
                maxLength={100}
                list="major-suggestions"
              />

              {/* Autocomplete Suggestions */}
              {showSuggestions && majorSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {majorSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Program of Study */}
        <div className="md:col-span-2">
          <FormField
            label="Program of Study"
            name="program_of_study"
            required
            error={errors.program_of_study}
            touched={touched.program_of_study}
            helperText="Select your specific program"
          >
            {availablePrograms.length > 0 ? (
              <select
                id="program_of_study"
                name="program_of_study"
                value={formData.program_of_study}
                onChange={handleInputChange}
                onBlur={() => handleBlur('program_of_study')}
                className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                  errors.program_of_study && touched.program_of_study
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <option value="">Select specific program</option>
                {availablePrograms.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="program_of_study"
                name="program_of_study"
                value={formData.program_of_study}
                onChange={handleInputChange}
                onBlur={() => handleBlur('program_of_study')}
                placeholder="Enter your program of study"
                className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                  errors.program_of_study && touched.program_of_study
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
                maxLength={100}
              />
            )}
          </FormField>
        </div>

        {/* Graduation Year */}
        <div className="md:col-span-2">
          <FormField
            label="Expected/Actual Graduation Year"
            name="graduation_year"
            required
            error={errors.graduation_year}
            touched={touched.graduation_year}
            helperText="When did you graduate or when will you graduate?"
          >
            <select
              id="graduation_year"
              name="graduation_year"
              value={formData.graduation_year}
              onChange={handleInputChange}
              onBlur={() => handleBlur('graduation_year')}
              className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                errors.graduation_year && touched.graduation_year
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <option value="">Select graduation year</option>
              {graduationYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default AcademicDetailsForm;

