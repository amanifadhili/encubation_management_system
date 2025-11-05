import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Layout';
import { getProfile, updateProfile } from '../services/api';
import Button from '../components/Button';
import { ButtonLoader, PageSkeleton } from '../components/loading';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  currentPassword: string;
  confirmPassword: string;
}

const Profile = () => {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    password: '',
    currentPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await getProfile();
      console.log('Profile API response:', result); // Debug log
      
      if (result.success && result.data?.user) {
        const userData = result.data.user;
        setProfile(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          password: '',
          currentPassword: '',
          confirmPassword: '',
        });
      } else {
        console.error('Unexpected response format:', result);
        showToast(result.message || 'Failed to load profile', 'error');
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (showPasswordFields) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }

      if (formData.password) {
        if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          errors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSaving(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (showPasswordFields && formData.password) {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }

      const result = await updateProfile(updateData);
      
      if (result.success) {
        // Update auth context with new user data
        if (result.data) {
          updateUser({
            name: result.data.name,
            email: result.data.email,
            role: result.data.role,
          });
        }
        
        setProfile(result.data);
        setFormData(prev => ({
          ...prev,
          password: '',
          currentPassword: '',
          confirmPassword: '',
        }));
        setShowPasswordFields(false);
        showToast('Profile updated successfully', 'success');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      showToast(errorMessage, 'error');
      
      // Set specific field errors if provided
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordFields(false);
    setFormData(prev => ({
      ...prev,
      password: '',
      currentPassword: '',
      confirmPassword: '',
    }));
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.password;
      delete newErrors.currentPassword;
      delete newErrors.confirmPassword;
      return newErrors;
    });
  };

  const roleDisplayNames: Record<string, string> = {
    director: 'Director',
    manager: 'Manager',
    mentor: 'Mentor',
    incubator: 'Incubator',
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and account settings</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={roleDisplayNames[profile.role] || profile.role}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="mt-1 text-sm text-gray-500">Role cannot be changed</p>
          </div>

          {/* Account Created Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Created
            </label>
            <input
              type="text"
              value={new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Change Password</h2>
            <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
          </div>
          {!showPasswordFields && (
            <Button
              onClick={() => setShowPasswordFields(true)}
              variant="outline"
            >
              Change Password
            </Button>
          )}
        </div>

        {showPasswordFields && (
          <div className="space-y-4 border-t pt-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your current password"
              />
              {formErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{formErrors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password (leave blank to keep current)"
              />
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            {formData.password && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCancelPassword}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          variant="primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <ButtonLoader />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Profile;

