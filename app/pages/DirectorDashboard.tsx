import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Modal from "../components/Modal";
import { FormField } from "../components/FormField";
import Button from "../components/Button";
import Table from "../components/Table";
import StatusBadge from "../components/StatusBadge";
import RoleGuard from "../components/RoleGuard";
import Tooltip from "../components/Tooltip";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string; // Optional - only for updates, not used in creation
  role: string;
}

const DirectorDashboard = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "manager",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await withRetry(() => getUsers(), {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          showToast(`Retrying... (${attempt}/3)`, "info", { duration: 2000 });
        },
      });

      // Handle different response formats
      let users: User[] = [];

      // If response is directly an array
      if (Array.isArray(response)) {
        users = response;
      }
      // If response has success and data structure
      else if (response.success && response.data) {
        users = Array.isArray(response.data) ? response.data : [];
      }
      // If response has data property (could be array or object with users array)
      else if (response.data) {
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (Array.isArray(response.data.users)) {
          users = response.data.users;
        } else {
          users = [];
        }
      }
      // If response has users property
      else if (Array.isArray(response.users)) {
        users = response.users;
      }
      // Fallback: empty array
      else {
        users = [];
      }

      setUsers(users);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      const errorDetails = ErrorHandler.parse(error);

      if (ErrorHandler.isTimeout(error)) {
        showToast("Request timed out. Please try again.", "error");
      } else {
        showToast(errorDetails.userMessage || "Failed to load users", "error");
      }
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadUsers(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "manager",
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password is no longer required - it will be generated and sent via email

    if (
      !["director", "manager", "mentor", "incubator"].includes(formData.role)
    ) {
      errors.role = "Please select a valid role";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Don't send password - backend will generate it and send via email
      const { password, ...userData } = formData;
      await createUser(userData);
      showToast("User created successfully. Password sent to email.", "success");
      setShowCreateModal(false);
      resetForm();
      loadUsers(true);
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const errorDetails = ErrorHandler.parse(error);
      showToast(errorDetails.userMessage || "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !validateForm()) return;

    setSubmitting(true);
    try {
      // Don't send password - password updates should be done separately
      const { password, ...updateData } = formData;

      await updateUser(editingUser.id, updateData);
      showToast("User updated successfully", "success");
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers(true);
    } catch (error: any) {
      console.error("Failed to update user:", error);
      const errorDetails = ErrorHandler.parse(error);
      showToast(errorDetails.userMessage || "Failed to update user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteUser(userId);
      showToast("User deleted successfully", "success");
      loadUsers(true);
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      const errorDetails = ErrorHandler.parse(error);
      showToast(errorDetails.userMessage || "Failed to delete user", "error");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "director":
        return "danger";
      case "manager":
        return "warning";
      case "mentor":
        return "info";
      case "incubator":
        return "success";
      default:
        return "secondary";
    }
  };

  const tableColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row: User) => (
        <StatusBadge
          status={row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: User) => {
        const isDeleteDisabled = row.role === "director";
        return (
          <div className="flex items-center gap-2">
            <Tooltip label="Edit">
              <button
                onClick={() => handleEditUser(row)}
                className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
                aria-label="Edit user"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M15.232 5.232a2.5 2.5 0 0 1 0 3.536l-7.5 7.5A2 2 0 0 1 6 17H3a1 1 0 0 1-1-1v-3c0-.53.21-1.04.586-1.414l7.5-7.5a2.5 2.5 0 0 1 3.536 0zm-2.828 2.828L5 15v2h2l7.404-7.404-2.828-2.828z" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip label={isDeleteDisabled ? "Cannot delete director" : "Delete"}>
              <button
            onClick={() => handleDeleteUser(row.id, row.name)}
                className={`p-2 rounded-lg transition-colors ${
                  isDeleteDisabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-red-100 text-red-700"
                }`}
                aria-label={isDeleteDisabled ? "Cannot delete director" : "Delete user"}
                disabled={isDeleteDisabled}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                </svg>
              </button>
            </Tooltip>
        </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <PageSkeleton count={6} layout="table" />
      </div>
    );
  }

  return (
    <RoleGuard allowed={["director"]}>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-900">
            Director Dashboard - User Management
          </h1>
          <div className="flex gap-4">
            <ButtonLoader
              onClick={handleRefresh}
              loading={refreshing}
              label="Refresh"
              loadingText="Refreshing..."
              variant="secondary"
              size="md"
            />
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              Add New User
            </Button>
          </div>
        </div>

        <div className="bg-white rounded shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">
              All Users
            </h2>
            <Table
              data={users}
              columns={tableColumns}
              emptyMessage="No users found"
            />
          </div>
        </div>

        {/* Create User Modal */}
        <Modal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create New User"
        >
          <div className="space-y-4">
            <FormField
              label="Name"
              name="name"
              error={formErrors.name}
              required
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            <FormField
              label="Email"
              name="email"
              error={formErrors.email}
              required
            >
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            {/* Password field removed - password will be auto-generated and sent via email */}
            
            <FormField
              label="Role"
              name="role"
              error={formErrors.role}
              required
            >
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                <option value="director">Director</option>
                <option value="director">Director</option>
                <option value="manager">Manager</option>
                <option value="mentor">Mentor</option>
                <option value="incubator">Incubator</option>
              </select>
            </FormField>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <ButtonLoader
                onClick={handleCreateUser}
                loading={submitting}
                label="Create User"
                loadingText="Creating..."
                variant="primary"
              />
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
            resetForm();
          }}
          title="Edit User"
        >
          <div className="space-y-4">
            <FormField
              label="Name"
              name="name"
              error={formErrors.name}
              required
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            <FormField
              label="Email"
              name="email"
              error={formErrors.email}
              required
            >
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            {/* Password field removed - password cannot be changed from here */}
            
            <FormField
              label="Role"
              name="role"
              error={formErrors.role}
              required
            >
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                <option value="manager">Manager</option>
                <option value="mentor">Mentor</option>
                <option value="incubator">Incubator</option>
              </select>
            </FormField>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <ButtonLoader
                onClick={handleUpdateUser}
                loading={submitting}
                label="Update User"
                loadingText="Updating..."
                variant="primary"
              />
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  );
};

export default DirectorDashboard;
