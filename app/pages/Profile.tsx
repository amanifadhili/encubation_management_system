import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { getProfile, updateProfile } from "../services/api";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton, Spinner } from "../components/loading";
import IncubateeProfile from "./IncubateeProfile";

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

  // For incubators, show the phased profile page
  if (user?.role === 'incubator') {
    return <IncubateeProfile />;
  }
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    password: "",
    currentPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await getProfile();
      console.log("Profile API response:", result); // Debug log

      if (result.success && result.data?.user) {
        const userData = result.data.user;
        setProfile(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          password: "",
          currentPassword: "",
          confirmPassword: "",
        });
      } else {
        console.error("Unexpected response format:", result);
        showToast(result.message || "Failed to load profile", "error");
      }
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load profile";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (showPasswordFields) {
      if (!formData.currentPassword) {
        errors.currentPassword = "Current password is required";
      }

      if (formData.password) {
        if (formData.password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          errors.password =
            "Password must contain uppercase, lowercase, and number";
        }

        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
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
        setFormData((prev) => ({
          ...prev,
          password: "",
          currentPassword: "",
          confirmPassword: "",
        }));
        setShowPasswordFields(false);
        showToast("Profile updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      showToast(errorMessage, "error");

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
    setFormData((prev) => ({
      ...prev,
      password: "",
      currentPassword: "",
      confirmPassword: "",
    }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.password;
      delete newErrors.currentPassword;
      delete newErrors.confirmPassword;
      return newErrors;
    });
  };

  const roleDisplayNames: Record<string, string> = {
    director: "Director",
    manager: "Manager",
    mentor: "Mentor",
    incubator: "Incubator",
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
          <p className="text-gray-600 mt-2">
            Manage your personal information and account settings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Personal Information
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                formErrors.name ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
              placeholder="Enter your full name"
            />
            {formErrors.name && (
              <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span>{formErrors.name}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white shadow-sm hover:shadow-md ${
                formErrors.email ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
              placeholder="Enter your email address"
            />
            {formErrors.email && (
              <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span>{formErrors.email}</span>
              </div>
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
              value={new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
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
            <h2 className="text-xl font-semibold text-gray-900">
              Change Password
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update your password to keep your account secure
            </p>
          </div>
          {!showPasswordFields && (
            <Button
              onClick={() => setShowPasswordFields(true)}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Change Password
            </Button>
          )}
        </div>

        {showPasswordFields && (
          <div className="space-y-4 border-t pt-4">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                    formErrors.currentPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    showCurrentPassword ? "Hide password" : "Show password"
                  }
                >
                  {showCurrentPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.29 3.29L3 3m0 0l18 18m-8.61-8.61a3 3 0 11-4.243-4.243m4.242 4.242L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                    formErrors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter new password (leave blank to keep current)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.29 3.29L3 3m0 0l18 18m-8.61-8.61a3 3 0 11-4.243-4.243m4.242 4.242L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.password}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 8 characters with uppercase,
                lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            {formData.password && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                      formErrors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.29 3.29L3 3m0 0l18 18m-8.61-8.61a3 3 0 11-4.243-4.243m4.242 4.242L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCancelPassword}
                variant="outline"
                disabled={saving}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
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
          loading={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
