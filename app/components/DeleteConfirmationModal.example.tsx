/**
 * DeleteConfirmationModal Usage Examples
 *
 * This file demonstrates various ways to use the DeleteConfirmationModal component
 * and the useDeleteConfirmation hook.
 */

import React, { useState } from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useDeleteConfirmation } from "../hooks/useDeleteConfirmation";
import { useToast } from "../components/Layout";
import {
  deleteInventoryItem,
  deleteMentor,
  deleteIncubator,
} from "../services/api";

// ============================================================================
// EXAMPLE 1: Basic Usage (Manual State Management)
// ============================================================================

export const Example1_BasicUsage = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

  const handleDeleteClick = (item: { id: string; name: string }) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      // Convert id to number if it's a string
      const itemId =
        typeof itemToDelete.id === "string"
          ? Number(itemToDelete.id)
          : itemToDelete.id;
      await deleteInventoryItem(itemId);
      // Remove from list or reload data
      showToast("Item deleted successfully", "success");
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      showToast("Failed to delete item", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => handleDeleteClick({ id: "123", name: "Sample Item" })}
      >
        Delete Item
      </button>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name}
        itemType="item"
        loading={deleting}
      />
    </>
  );
};

// ============================================================================
// EXAMPLE 2: Using useDeleteConfirmation Hook
// ============================================================================

export const Example2_WithHook = () => {
  const showToast = useToast();

  const {
    isOpen,
    itemToDelete,
    loading,
    error,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useDeleteConfirmation<{ id: string; name: string }>({
    onConfirm: async (item) => {
      // Convert id to number if it's a string
      const itemId = typeof item.id === "string" ? Number(item.id) : item.id;
      await deleteInventoryItem(itemId);
      // Handle success - reload data, update state, etc.
      showToast(`${item.name} deleted successfully`, "success");
    },
    onError: (error, item) => {
      showToast(`Failed to delete ${item.name}`, "error");
    },
  });

  return (
    <>
      <button
        onClick={() => openDeleteModal({ id: "123", name: "Sample Item" })}
      >
        Delete Item
      </button>

      <DeleteConfirmationModal
        open={isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name}
        itemType="item"
        loading={loading}
        error={error}
      />
    </>
  );
};

// ============================================================================
// EXAMPLE 3: Delete Mentor with Custom Confirmation
// ============================================================================

export const Example3_CustomConfirmation = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mentorToDelete, setMentorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

  const handleDeleteMentor = async () => {
    if (!mentorToDelete) return;

    setDeleting(true);
    try {
      await deleteMentor(mentorToDelete.id);
      showToast("Mentor deleted successfully", "success");
      setDeleteModalOpen(false);
      setMentorToDelete(null);
    } catch (error: any) {
      showToast("Failed to delete mentor", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmationModal
      open={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setMentorToDelete(null);
      }}
      onConfirm={handleDeleteMentor}
      itemName={mentorToDelete?.name}
      itemType="mentor"
      confirmationText="DELETE MENTOR"
      loading={deleting}
      description="This will permanently delete the mentor account and remove all team assignments. This action cannot be undone."
    />
  );
};

// ============================================================================
// EXAMPLE 4: Delete Team with Error Handling
// ============================================================================

export const Example4_WithErrorHandling = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast();

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setDeleting(true);
    setError(null);
    try {
      // Convert id to number if it's a string
      const teamId =
        typeof teamToDelete.id === "string"
          ? Number(teamToDelete.id)
          : teamToDelete.id;
      await deleteIncubator(teamId);
      showToast("Team deleted successfully", "success");
      setDeleteModalOpen(false);
      setTeamToDelete(null);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete team";
      setError(errorMessage);
      // Don't close modal on error so user can retry
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmationModal
      open={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setTeamToDelete(null);
        setError(null);
      }}
      onConfirm={handleDeleteTeam}
      itemName={teamToDelete?.name}
      itemType="team"
      loading={deleting}
      error={error}
      description="This will permanently delete the team and all associated data including members, projects, and assignments. This action cannot be undone."
    />
  );
};

// ============================================================================
// EXAMPLE 5: In Table Row Actions
// ============================================================================

interface Item {
  id: string;
  name: string;
  description: string;
}

export const Example5_TableRow = ({ items }: { items: Item[] }) => {
  const {
    isOpen,
    itemToDelete,
    loading,
    error,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useDeleteConfirmation<Item>({
    onConfirm: async (item) => {
      // Convert id to number if it's a string
      const itemId = typeof item.id === "string" ? Number(item.id) : item.id;
      await deleteInventoryItem(itemId);
      // Reload data or update state
    },
  });

  return (
    <>
      <table>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>
                <button
                  onClick={() => openDeleteModal(item)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DeleteConfirmationModal
        open={isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.name}
        itemType="item"
        loading={loading}
        error={error}
      />
    </>
  );
};
