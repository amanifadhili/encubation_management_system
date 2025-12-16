import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ErrorHandler } from "../utils/errorHandler";
import { ButtonLoader } from "../components/loading";
import * as authService from "../services/auth";

const ForcePasswordChange = () => {
  const { user, logout } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword({ newPassword });
      
      setSuccess("Password updated successfully! Redirecting to dashboard...");
      
      // Use window.location for a full page reload to ensure AuthContext is properly initialized
      // This prevents the "useAuth must be used within an AuthProvider" error
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      ErrorHandler.handleError(err, (msg) => setError(msg || "Failed to change password."), "change-password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-blue-900">Update Your Password</h1>
          <p className="text-sm text-gray-700">
            For security, you need to change your default password before using the app.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">New password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 mb-1">Confirm new password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded border border-green-200 bg-green-50 text-green-700 text-sm">{success}</div>
          )}

          <div className="flex gap-3">
            <ButtonLoader
              type="submit"
              variant="primary"
              loading={loading}
              label="Update password"
              loadingText="Updating..."
            />
            <ButtonLoader
              type="button"
              variant="secondary"
              loading={false}
              onClick={() => logout()}
              label="Logout"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
