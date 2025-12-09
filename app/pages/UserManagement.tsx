import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getUsers, createUser, updateUser, deleteUser, getIncubators } from "../services/api";
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
  teamId?: string;
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
    role: "incubator",
    teamId: "",
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
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
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

  useEffect(() => {
    if (isModalOpen) {
      fetchTeams();
    }
  }, [isModalOpen]);

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

      // Handle different response formats
      let users: User[] = [];
      let pagination: any = null;

      // If response is directly an array
      if (Array.isArray(response)) {
        users = response;
        pagination = null;
      }
      // If response has success and data structure
      else if (response.success && response.data) {
        users = Array.isArray(response.data) ? response.data : [];
        pagination = response.pagination || null;
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
        pagination = response.pagination || null;
      }
      // If response has users property
      else if (Array.isArray(response.users)) {
        users = response.users;
        pagination = response.pagination || null;
      }
      // Fallback: empty array
      else {
        users = [];
        pagination = null;
      }

      setUsers(users);
      if (pagination) {
        setTotalPages(pagination.pages || 1);
        setTotal(pagination.total || users.length);
      } else {
        setTotalPages(1);
        setTotal(users.length);
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

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);
      const response = await getIncubators();
      // Response could be {success,data} or array
      let list: any[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response?.data?.teams) {
        list = response.data.teams;
      } else if (response?.data) {
        list = response.data;
      } else if (response?.teams) {
        list = response.teams;
      }
      setTeams(list || []);
    } catch (error) {
      console.error("Failed to load teams", error);
      showToast("Failed to load teams for incubators", "error");
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleCreateUser = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setErrors({});
      setFormMessage(null);
      // Don't send password - backend will generate it and send via email
      const { password, ...userData } = formData;
      await createUser(userData);
      // Success - backend will generate password and send via email
      showToast("User created successfully. Password sent to email.", "success");
      handleCloseModal();
      // Reload to refresh pagination
      loadUsers();
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
        setFormMessage(error.response.data.message || "Please fix the highlighted fields.");
        showToast(error.response.data.message || "Please fix the highlighted fields.", "error");
      } else {
        const msg = error.response?.data?.message || error.message || "Failed to create user";
        setFormMessage(msg);
        showToast(msg, "error");
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
      setFormMessage(null);
      // Don't send password if it's empty (allows updating without changing password)
      const updateData: Partial<UserFormData> = { ...formData };
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }
      await updateUser(selectedUser.id, updateData);
      // Success
      showToast("User updated successfully", "success");
      handleCloseModal();
      // Reload to refresh pagination
      loadUsers();
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
        setFormMessage(error.response.data.message || "Please fix the highlighted fields.");
        showToast(error.response.data.message || "Please fix the highlighted fields.", "error");
      } else {
        const msg = error.response?.data?.message || error.message || "Failed to update user";
        setFormMessage(msg);
        showToast(msg, "error");
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
      role: "incubator",
      teamId: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      role: "incubator",
      teamId: "",
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
            {formMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                {formMessage}
              </div>
            )}
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

            {/* Password field removed - password will be auto-generated and sent via email */}

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

            {formData.role === "incubator" && (
              <FormField
                label="Team"
                name="teamId"
                error={errors.teamId?.[0]}
                required
              >
                <select
                  name="teamId"
                  value={formData.teamId || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base shadow-sm hover:shadow-md"
                  disabled={loadingTeams}
                >
                  <option value="">{loadingTeams ? "Loading teams..." : "Select team"}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.team_name || t.teamName || "Unnamed Team"}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

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
