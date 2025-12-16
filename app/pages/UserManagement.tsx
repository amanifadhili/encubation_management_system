import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getUsers, createUser, updateUser, deleteUser, getIncubators, getInactiveUsers, restoreUser } from "../services/api";
import Table, { type TableColumn } from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { FormField } from "../components/FormField";
import Pagination from "../components/Pagination";
import SearchBar from "../components/SearchBar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Tooltip from "../components/Tooltip";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
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
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
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
    if (!showInactive) {
      loadUsers();
    }
  }, [page, debouncedSearch, roleFilter, sortBy, sortOrder, showInactive]);

  useEffect(() => {
    if (showInactive) {
      loadInactiveUsers();
    }
  }, [showInactive]);

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

  const loadInactiveUsers = async () => {
    try {
      setLoadingInactive(true);
      const response = await getInactiveUsers();

      let users: User[] = [];
      if (Array.isArray(response)) {
        users = response as User[];
      } else if (response?.data) {
        users = Array.isArray(response.data) ? response.data : response.data.users || [];
      }

      setInactiveUsers(users);
    } catch (error: any) {
      console.error("Failed to load inactive users:", error);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to load inactive users",
        "error"
      );
      setInactiveUsers([]);
    } finally {
      setLoadingInactive(false);
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

  const handleRestoreUser = async (user: User) => {
    if (
      !confirm(
        `Restore ${user.name}? This will reactivate their account and allow them to log in again.`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setDeletingUserId(user.id);
      const response = await restoreUser(user.id);
      if (response.success) {
        showToast("User restored successfully", "success");
        // Refresh inactive and active lists
        await loadInactiveUsers();
        await loadUsers();
      } else {
        showToast(response.message || "Failed to restore user", "error");
      }
    } catch (error: any) {
      console.error("Failed to restore user:", error);
      showToast(
        error.response?.data?.message ||
          error.message ||
          "Failed to restore user",
        "error"
      );
    } finally {
      setDeleting(false);
      setDeletingUserId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    setDeletingUserId(userToDelete.id);
    try {
      const response = await deleteUser(userToDelete.id);
      if (response.success) {
        showToast("User deactivated successfully", "success");
        setDeleteModalOpen(false);
        setUserToDelete(null);
        // Reload to refresh lists
        if (showInactive) {
          loadInactiveUsers();
        } else {
          loadUsers();
        }
      } else {
        showToast(response.message || "Failed to deactivate user", "error");
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
      key: "status",
      label: "Status",
      sortable: false,
      render: (user: User) => (
        <span className={`text-sm font-medium ${user.status === "inactive" ? "text-red-600" : "text-green-600"}`}>
          {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : "Active"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Tooltip label="View Details">
            <button
            onClick={() => handleOpenDetailModal(user)}
              className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
              aria-label="View user details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip label="Edit">
            <button
              onClick={() => handleOpenEditModal(user)}
              className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
              aria-label="Edit user"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M15.232 5.232a2.5 2.5 0 0 1 0 3.536l-7.5 7.5A2 2 0 0 1 6 17H3a1 1 0 0 1-1-1v-3c0-.53.21-1.04.586-1.414l7.5-7.5a2.5 2.5 0 0 1 3.536 0zm-2.828 2.828L5 15v2h2l7.404-7.404-2.828-2.828z" />
              </svg>
            </button>
          </Tooltip>
          {showInactive ? (
            <Tooltip label="Restore">
              <button
                onClick={() => handleRestoreUser(user)}
                className={`p-2 rounded-lg transition-colors ${
                  deleting && deletingUserId === user.id
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-green-100 text-green-700"
                }`}
                aria-label="Restore user"
                disabled={deleting && deletingUserId === user.id}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M4.5 2.75a.75.75 0 0 1 .75.75v2.69A6.5 6.5 0 1 1 3.06 9.22a.75.75 0 1 1 1.44.34A5 5 0 1 0 10 5.5H7.25a.75.75 0 0 1-.75-.75V3.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V4a.75.75 0 0 1-1.5 0v-.25H8v.44A6.5 6.5 0 1 1 4.5 3.5v-.75z" />
                </svg>
              </button>
            </Tooltip>
          ) : (
            <Tooltip label="Deactivate">
              <button
                onClick={() => handleDeleteClick(user)}
                className={`p-2 rounded-lg transition-colors ${
                  deleting && deletingUserId === user.id
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-red-100 text-red-700"
                }`}
                aria-label="Deactivate user"
                disabled={deleting && deletingUserId === user.id}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex gap-3">
          <Button
            variant={showInactive ? "secondary" : "outline"}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? "Show Active Users" : "Show Inactive Users"}
          </Button>
          <Button onClick={handleOpenCreateModal} variant="primary">
            Create New User
          </Button>
        </div>
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
      {!loading && !showInactive && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {users.length} of {total} users
        </div>
      )}
      {showInactive && !loadingInactive && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {inactiveUsers.length} inactive users
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <Table
          data={showInactive ? inactiveUsers : users}
          columns={columns}
          loading={showInactive ? loadingInactive : loading}
          emptyMessage={showInactive ? "No inactive users found" : "No users found"}
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
      {!showInactive && totalPages > 1 && (
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
      
      {/* Delete (Deactivate) Confirmation Modal */}
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
        description="This will deactivate the user account. The user will no longer be able to access the system, but you can restore the account later from the inactive users view."
        confirmationText={null}
      />
    </div>
  );
}
