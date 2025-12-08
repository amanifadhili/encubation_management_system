import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';

interface PersonalIdentityFormProps {
  onSave?: () => void;
}

export const PersonalIdentityForm: React.FC<PersonalIdentityFormProps> = ({ onSave }) => {
  const { profile, updatePhase1, uploadPhoto, saveToLocalStorage, getFromLocalStorage } = useProfile();
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    profile_photo_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        profile_photo_url: profile.profile_photo_url || '',
      });
      if (profile.profile_photo_url) {
        setPhotoPreview(profile.profile_photo_url);
      }
    }
  }, [profile]);

  // Auto-generate display name
  const displayName = React.useMemo(() => {
    const parts = [];
    if (formData.first_name) parts.push(formData.first_name);
    if (formData.middle_name) parts.push(formData.middle_name);
    if (formData.last_name) parts.push(formData.last_name);
    return parts.join(' ').trim() || '';
  }, [formData.first_name, formData.middle_name, formData.last_name]);

  // Capitalize first letter helper
  const capitalizeFirst = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Auto-capitalize first letter for first and last name
    if (name === 'first_name' || name === 'last_name') {
      if (value.length > 0) {
        processedValue = capitalizeFirst(value);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
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

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors: Record<string, string> = { ...errors };

    switch (field) {
      case 'first_name':
        if (!formData.first_name.trim()) {
          newErrors.first_name = 'First name is required';
        } else if (formData.first_name.length < 2) {
          newErrors.first_name = 'First name must be at least 2 characters';
        } else if (formData.first_name.length > 50) {
          newErrors.first_name = 'First name cannot exceed 50 characters';
        } else {
          delete newErrors.first_name;
        }
        break;
      case 'last_name':
        if (!formData.last_name.trim()) {
          newErrors.last_name = 'Last name is required';
        } else if (formData.last_name.length < 2) {
          newErrors.last_name = 'Last name must be at least 2 characters';
        } else if (formData.last_name.length > 50) {
          newErrors.last_name = 'Last name cannot exceed 50 characters';
        } else {
          delete newErrors.last_name;
        }
        break;
      case 'middle_name':
        if (formData.middle_name && formData.middle_name.length > 50) {
          newErrors.middle_name = 'Middle name cannot exceed 50 characters';
        } else {
          delete newErrors.middle_name;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const fieldsToValidate = ['first_name', 'last_name'];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    setTouched({
      first_name: true,
      last_name: true,
      middle_name: true,
    });

    return isValid;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Please select a valid image file',
        }));
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Image size must be less than 2MB',
        }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        // In a real app, you'd upload to a service and get URL
        // For now, we'll use data URL as placeholder
        setFormData((prev) => ({
          ...prev,
          profile_photo_url: result, // This should be the uploaded URL in production
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({
      ...prev,
      profile_photo_url: '',
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const draft = getFromLocalStorage('phase1')?.data || {};
      const phoneFromProfile = profile?.phone || draft.phone || '';

      // Prepare data for API
      const updateData = {
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name?.trim() || null,
        last_name: formData.last_name.trim(),
        phone: phoneFromProfile, // phone is required by backend; defer API call if missing
        profile_photo_url: formData.profile_photo_url || null,
      };

      // If phone is not yet provided, save draft locally and move to contact section without API call
      if (!phoneFromProfile) {
        saveToLocalStorage('phase1', updateData);
        if (onSave) {
          onSave();
        }
        return;
      }

      const success = await updatePhase1(updateData);
      if (success && onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save personal identity:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    const first = formData.first_name?.charAt(0)?.toUpperCase() || '';
    const last = formData.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || profile?.name?.charAt(0)?.toUpperCase() || '?';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                aria-label="Remove photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200">
              {getInitials()}
            </div>
          )}
        </div>

        <label className="mt-4 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            aria-label="Upload profile photo"
          />
          <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {photoPreview ? 'Change Photo' : 'Upload Photo'}
          </span>
        </label>
        <p className="mt-2 text-xs text-gray-500 text-center">
          Recommended: 200x200px, max 2MB
        </p>
        {errors.photo && (
          <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
        )}
      </div>

      {/* First Name */}
      <FormField
        label="First Name"
        name="first_name"
        required
        error={errors.first_name}
        touched={touched.first_name}
      >
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
          onBlur={() => handleBlur('first_name')}
          placeholder="Enter your first name"
          className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
            errors.first_name && touched.first_name
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200'
          }`}
          maxLength={50}
        />
      </FormField>

      {/* Middle Name */}
      <FormField
        label="Middle Name (Optional)"
        name="middle_name"
        error={errors.middle_name}
        touched={touched.middle_name}
        helperText="Optional middle name or initial"
      >
        <input
          type="text"
          id="middle_name"
          name="middle_name"
          value={formData.middle_name}
          onChange={handleInputChange}
          onBlur={() => handleBlur('middle_name')}
          placeholder="Middle name (optional)"
          className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
            errors.middle_name && touched.middle_name
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200'
          }`}
          maxLength={50}
        />
      </FormField>

      {/* Last Name */}
      <FormField
        label="Last Name"
        name="last_name"
        required
        error={errors.last_name}
        touched={touched.last_name}
      >
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
          onBlur={() => handleBlur('last_name')}
          placeholder="Enter your last name"
          className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
            errors.last_name && touched.last_name
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200'
          }`}
          maxLength={50}
        />
      </FormField>

      {/* Display Name Preview */}
      {displayName && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">Display Name Preview</p>
          <p className="text-lg font-semibold text-blue-700">{displayName}</p>
          <p className="text-xs text-blue-600 mt-1">
            This is how your name will appear in the system
          </p>
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
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default PersonalIdentityForm;

