import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";
import Table, { type TableColumn } from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { FormField } from "../components/FormField";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
}

export default function UserManagement() {
  const { user, loading: authLoading } = useAuth();

  // While auth is initializing, don't redirect (avoid flashing away)
  if (authLoading) {
    return null;
  }

  // Redirect if not a director
  if (!user || user.role !== "director") {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "incubator",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const showToast = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when searching
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Load users on component mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [page, debouncedSearch, roleFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== "all") params.role = roleFilter;

      const response = await getUsers(params);
      console.log("Users API Response:", response);

      // Backend returns { success: true, data: users[], pagination: { page, limit, total, pages } }
      if (response.success && response.data) {
        setUsers(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
          setTotal(response.pagination.total || 0);
        } else {
          // Fallback if pagination is missing
          setTotalPages(1);
          setTotal(response.data?.length || 0);
        }
      } else if (response.data) {
        // Handle case where response might be directly the data array
        setUsers(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
          setTotal(response.pagination.total || 0);
        } else {
          setTotalPages(1);
          setTotal(Array.isArray(response.data) ? response.data.length : 0);
        }
      } else {
        // If response structure is unexpected
        console.error("Unexpected response structure:", response);
        setUsers([]);
        setTotalPages(1);
        setTotal(0);
        showToast("Unexpected response format from server", "error");
      }
    } catch (error: any) {
      console.error("Failed to load users:", error);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to load users",
        "error"
      );
      setUsers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setErrors({});
      const response = await createUser(formData);
      if (response.success) {
        showToast("User created successfully", "success");
        handleCloseModal();
        // Reload to refresh pagination
        loadUsers();
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Convert array format to Record format
        const errorRecord: Record<string, string[]> = {};
        error.response.data.errors.forEach((err: any) => {
          if (!errorRecord[err.field]) {
            errorRecord[err.field] = [];
          }
          errorRecord[err.field].push(err.message);
        });
        setErrors(errorRecord);
      } else {
        showToast("Failed to create user", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || isSubmitting) return;
    setIsSubmitting(true);

    try {
      setErrors({});
      // Don't send password if it's empty (allows updating without changing password)
      const updateData: Partial<UserFormData> = { ...formData };
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }
      const response = await updateUser(selectedUser.id, updateData);
      if (response.success) {
        showToast("User updated successfully", "success");
        handleCloseModal();
        // Reload to refresh pagination
        loadUsers();
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Convert array format to Record format
        const errorRecord: Record<string, string[]> = {};
        error.response.data.errors.forEach((err: any) => {
          if (!errorRecord[err.field]) {
            errorRecord[err.field] = [];
          }
          errorRecord[err.field].push(err.message);
        });
        setErrors(errorRecord);
      } else {
        showToast("Failed to update user", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    setDeletingUserId(userToDelete.id);
    try {
      const response = await deleteUser(userToDelete.id);
      if (response.success) {
        showToast("User deleted successfully", "success");
        setDeleteModalOpen(false);
        setUserToDelete(null);
        // Reload to refresh pagination
        loadUsers();
      }
    } catch (error) {
      showToast("Failed to delete user", "error");
      // Don't close modal on error so user can retry
    } finally {
      setDeleting(false);
      setDeletingUserId(null);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "incubator",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "incubator",
    });
    setErrors({});
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (!password)
      return {
        strength: 0,
        checks: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        },
      };

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const handleOpenDetailModal = (user: User) => {
    setDetailUser(user);
    setShowDetailModal(true);
  };

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (user: User) => (
        <button
          onClick={() => handleOpenDetailModal(user)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {user.name}
        </button>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (user: User) => (
        <span className="text-blue-600 font-medium">{user.email}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user: User) => (
        <span className="text-blue-600 font-medium">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: User) => (
        <div className="flex space-x-2">
          <Button
            onClick={() => handleOpenDetailModal(user)}
            variant="secondary"
            className="text-sm"
          >
            View
          </Button>
          <Button
            onClick={() => handleOpenEditModal(user)}
            variant="secondary"
            className="text-sm"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteClick(user)}
            variant="danger"
            className="text-sm"
            disabled={deleting}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={handleOpenCreateModal} variant="primary">
          Create New User
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
        </div>
        <div className="sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1); // Reset to first page when filtering
            }}
            className="w-full p-2 border rounded text-gray-900"
          >
            <option value="all">All Roles</option>
            <option value="director">Director</option>
            <option value="manager">Manager</option>
            <option value="mentor">Mentor</option>
            <option value="incubator">Incubator</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {users.length} of {total} users
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <Table
          data={users}
          columns={columns}
          loading={loading}
          emptyMessage="No users found"
          onSort={(key, order) => {
            setSortBy(key);
            setSortOrder(order);
            setPage(1); // Reset to first page when sorting
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === "create" ? "Create New User" : "Edit User"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            modalMode === "create" ? handleCreateUser() : handleUpdateUser();
          }}
        >
          <div className="space-y-4">
            <FormField
              label="Name"
              name="name"
              error={errors.name?.[0]}
              required
            >
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            <FormField
              label="Email"
              name="email"
              error={errors.email?.[0]}
              required
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            <FormField
              label={
                modalMode === "create"
                  ? "Password"
                  : "New Password (leave blank to keep current)"
              }
              name="password"
              error={errors.password?.[0]}
              required={modalMode === "create"}
            >
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              />
            </FormField>

            {modalMode === "create" && formData.password && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Password Strength
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      checkPasswordStrength(formData.password).strength === 5
                        ? "text-green-600"
                        : checkPasswordStrength(formData.password).strength >= 3
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {checkPasswordStrength(formData.password).strength === 5
                      ? "Strong"
                      : checkPasswordStrength(formData.password).strength >= 3
                      ? "Medium"
                      : "Weak"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      checkPasswordStrength(formData.password).strength === 5
                        ? "bg-green-600"
                        : checkPasswordStrength(formData.password).strength >= 3
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                    style={{
                      width: `${
                        (checkPasswordStrength(formData.password).strength /
                          5) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div
                    className={
                      checkPasswordStrength(formData.password).checks.length
                        ? "text-green-600"
                        : ""
                    }
                  >
                    {checkPasswordStrength(formData.password).checks.length
                      ? "✓"
                      : "○"}{" "}
                    At least 8 characters
                  </div>
                  <div
                    className={
                      checkPasswordStrength(formData.password).checks.uppercase
                        ? "text-green-600"
                        : ""
                    }
                  >
                    {checkPasswordStrength(formData.password).checks.uppercase
                      ? "✓"
                      : "○"}{" "}
                    One uppercase letter
                  </div>
                  <div
                    className={
                      checkPasswordStrength(formData.password).checks.lowercase
                        ? "text-green-600"
                        : ""
                    }
                  >
                    {checkPasswordStrength(formData.password).checks.lowercase
                      ? "✓"
                      : "○"}{" "}
                    One lowercase letter
                  </div>
                  <div
                    className={
                      checkPasswordStrength(formData.password).checks.number
                        ? "text-green-600"
                        : ""
                    }
                  >
                    {checkPasswordStrength(formData.password).checks.number
                      ? "✓"
                      : "○"}{" "}
                    One number
                  </div>
                  <div
                    className={
                      checkPasswordStrength(formData.password).checks.special
                        ? "text-green-600"
                        : ""
                    }
                  >
                    {checkPasswordStrength(formData.password).checks.special
                      ? "✓"
                      : "○"}{" "}
                    One special character
                  </div>
                </div>
              </div>
            )}

            <FormField
              label="Role"
              name="role"
              error={errors.role?.[0]}
              required
            >
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                <option value="director">Director</option>
                <option value="manager">Manager</option>
                <option value="mentor">Mentor</option>
                <option value="incubator">Incubator</option>
              </select>
            </FormField>

            {/* ValidationErrors component removed - inline errors in FormField provide better UX */}

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {modalMode === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="User Details"
      >
        {detailUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{detailUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{detailUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Role
                </label>
                <p className="text-gray-900">
                  {detailUser.role.charAt(0).toUpperCase() +
                    detailUser.role.slice(1)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  User ID
                </label>
                <p className="text-gray-600 text-sm font-mono">
                  {detailUser.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">
                  {new Date(detailUser.created_at).toLocaleString()}
                </p>
              </div>
              {detailUser.updated_at && (
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(detailUser.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenEditModal(detailUser);
                }}
              >
                Edit User
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={userToDelete?.name}
        itemType="user"
        loading={deleting}
        description="This will permanently delete the user account and all associated data. This action cannot be undone."
      />
    </div>
  );
}
