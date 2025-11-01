import React, { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { FormField } from "../components/FormField";
import {
  ValidationErrors,
  type ValidationError,
} from "../components/ValidationErrors";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface TableColumn {
  key: string;
  label: string;
  render?: (row: User) => React.ReactNode;
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
  const showToast = useToast();

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      // getUsers returns the users array
      setUsers(data || []);
    } catch (error) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setErrors({});
      const response = await createUser(formData);
      if (response.success) {
        // backend returns { success, message, data: newUser }
        setUsers([...users, response.data]);
        showToast("User created successfully", "success");
        handleCloseModal();
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
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setErrors({});
      // Don't send password if it's empty (allows updating without changing password)
      const updateData: Partial<UserFormData> = { ...formData };
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }
      const response = await updateUser(selectedUser.id, updateData);
      if (response.success) {
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id ? { ...user, ...response.data } : user
          )
        );
        showToast("User updated successfully", "success");
        handleCloseModal();
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
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await deleteUser(userId);
      if (response.success) {
        setUsers(users.filter((user) => user.id !== userId));
        showToast("User deleted successfully", "success");
      }
    } catch (error) {
      showToast("Failed to delete user", "error");
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

  const columns: TableColumn[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (user: User) =>
        user.role.charAt(0).toUpperCase() + user.role.slice(1),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user: User) => (
        <div className="flex space-x-2">
          <Button
            onClick={() => handleOpenEditModal(user)}
            variant="secondary"
            className="text-sm"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteUser(user.id)}
            variant="danger"
            className="text-sm"
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

      <div className="bg-white rounded-lg shadow">
        <Table
          data={users}
          columns={columns}
          loading={loading}
          emptyMessage="No users found"
        />
      </div>

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
            <FormField label="Name" name="name" error={errors.name?.[0]}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </FormField>

            <FormField label="Email" name="email" error={errors.email?.[0]}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
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
            >
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </FormField>

            <FormField label="Role" name="role" error={errors.role?.[0]}>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="director">Director</option>
                <option value="manager">Manager</option>
                <option value="mentor">Mentor</option>
                <option value="incubator">Incubator</option>
              </select>
            </FormField>

            {Object.keys(errors).length > 0 && (
              <ValidationErrors
                errors={Object.entries(errors).map(([field, messages]) => ({
                  field,
                  message: messages[0],
                }))}
              />
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {modalMode === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
