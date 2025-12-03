import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { useProfile } from '../../context/ProfileContext';
import Button from '../Button';

interface ContactInformationFormProps {
  onSave?: () => void;
}

// Common country codes for phone input
const countryCodes = [
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
];

export const ContactInformationForm: React.FC<ContactInformationFormProps> = ({ onSave }) => {
  const { profile, updatePhase1 } = useProfile();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    countryCode: '+250',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email || '',
        phone: profile.phone || '',
        countryCode: extractCountryCode(profile.phone || '+250'),
      });
    }
  }, [profile]);

  // Extract country code from phone number
  const extractCountryCode = (phone: string): string => {
    if (!phone) return '+250';
    // Check if phone starts with a country code
    for (const country of countryCodes) {
      if (phone.startsWith(country.code)) {
        return country.code;
      }
    }
    return '+250'; // Default to Rwanda
  };

  // Extract phone number without country code
  const extractPhoneNumber = (phone: string, code: string): string => {
    if (!phone) return '';
    if (phone.startsWith(code)) {
      return phone.slice(code.length).trim();
    }
    return phone;
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setFormData((prev) => ({
      ...prev,
      countryCode: newCode,
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Only allow digits

    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));

    // Clear error when user starts typing
    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
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

    if (field === 'phone') {
      const fullPhone = `${formData.countryCode}${formData.phone}`;
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (formData.phone.length < 9) {
        newErrors.phone = 'Please enter a valid phone number';
      } else if (!/^\+?[1-9]\d{1,14}$/.test(fullPhone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid international phone number';
      } else {
        delete newErrors.phone;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    if (!validateField('phone')) {
      setTouched((prev) => ({ ...prev, phone: true }));
      return false;
    }
    return true;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Format as: XXX XXX XXX for display
    return phone.replace(/(\d{3})(?=\d)/g, '$1 ');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Combine country code with phone number
      const fullPhoneNumber = `${formData.countryCode}${formData.phone.replace(/\s/g, '')}`;

      // Get current profile data for Phase 1 update
      const updateData = {
        first_name: profile?.first_name || '',
        middle_name: profile?.middle_name || null,
        last_name: profile?.last_name || '',
        phone: fullPhoneNumber,
        profile_photo_url: profile?.profile_photo_url || null,
      };

      const success = await updatePhase1(updateData);
      if (success && onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save contact information:', error);
    } finally {
      setSaving(false);
    }
  };

  const fullPhoneDisplay = formData.phone
    ? `${formData.countryCode} ${formatPhoneNumber(formData.phone)}`
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Address - Read Only */}
      <FormField
        label="Email Address"
        name="email"
        required
        disabled
        helperText="Email cannot be changed. Contact admin for assistance."
      >
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          </div>
        </div>
      </FormField>

      {/* Phone Number */}
      <FormField
        label="Phone Number"
        name="phone"
        required
        error={errors.phone}
        touched={touched.phone}
        helperText="Enter your phone number in international format"
      >
        <div className="flex gap-2">
          {/* Country Code Selector */}
          <div className="flex-shrink-0">
            <select
              id="countryCode"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleCountryCodeChange}
              className="h-full px-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white text-gray-900 text-sm font-medium"
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number Input */}
          <div className="flex-1">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              onBlur={() => handleBlur('phone')}
              placeholder="e.g., 788 123 456"
              className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                errors.phone && touched.phone
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
              maxLength={15}
            />
          </div>
        </div>

        {/* Phone Preview */}
        {fullPhoneDisplay && !errors.phone && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="font-medium">Formatted:</span>
            <span>{fullPhoneDisplay}</span>
          </div>
        )}
      </FormField>

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

export default ContactInformationForm;

