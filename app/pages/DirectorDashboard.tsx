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
      render: (row: User) => (
        <div className="flex gap-2">
          <Button onClick={() => handleEditUser(row)} variant="secondary">
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteUser(row.id, row.name)}
            variant="danger"
            disabled={row.role === "director"}
          >
            Delete
          </Button>
        </div>
      ),
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
