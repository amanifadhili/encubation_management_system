import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Table from "../components/Table";
import Badge from "../components/Badge";

// Define column type locally to avoid ES module import issues
type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../services/api";

const StockManagement = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    description: "",
    total_quantity: 1,
    status: "available"
  });
  
  // Loading states for different operations
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const isManager = user?.role === "manager" || user?.role === "director";

  // Load inventory on mount
  useEffect(() => {
    if (user) {
      loadInventory();
    }
  }, [user]);

  const loadInventory = async () => {
    try {
      const data = await withRetry(
        () => getInventory(),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            showToast(`Retrying... (${attempt}/3)`, 'info', { duration: 2000 });
          }
        }
      );
      setInventory(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading inventory');
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string): "success" | "warning" | "danger" | "default" | "info" => {
    switch (status?.toLowerCase()) {
      case "available":
        return "success";
      case "low_stock":
        return "warning";
      case "out_of_stock":
        return "danger";
      case "unavailable":
        return "danger";
      case "maintenance":
        return "info";
      default:
        return "default";
    }
  };

  // Format status display text
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filtered and sorted inventory
  const filteredInventory = useMemo(() => {
    let filtered = inventory.filter(item =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    );

    // Sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        // Handle different data types
        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = (bVal || "").toLowerCase();
        }
        if (typeof aVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventory, search, sortBy, sortOrder]);

  // Handle sort
  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  // Table columns definition
  const columns: TableColumn<any>[] = useMemo(() => {
    const baseColumns: TableColumn<any>[] = [
      {
        key: "name",
        label: "Item Name",
        sortable: true,
        render: (item: any) => (
          <div>
            <div className="font-semibold text-gray-900">{item.name || "-"}</div>
            {item.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                {item.description}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "total_quantity",
        label: "Total",
        sortable: true,
        className: "text-center",
        render: (item: any) => (
          <span className="font-semibold text-gray-900">{item.total_quantity ?? 0}</span>
        ),
      },
      {
        key: "available_quantity",
        label: "Available",
        sortable: true,
        className: "text-center",
        render: (item: any) => {
          const available = item.available_quantity ?? 0;
          const total = item.total_quantity ?? 0;
          const assigned = total - available;
          const isLowStock = available > 0 && available < total * 0.2;
          const isOutOfStock = available === 0 && total > 0;

          return (
            <div className="flex flex-col items-center">
              <span className={`font-semibold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-green-600"}`}>
                {available}
              </span>
              {assigned > 0 && (
                <span className="text-xs text-gray-500">({assigned} assigned)</span>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (item: any) => (
          <Badge variant={getStatusVariant(item.status)}>
            {formatStatus(item.status || "available")}
          </Badge>
        ),
      },
      {
        key: "created_at",
        label: "Created",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-600">{formatDate(item.created_at)}</span>
        ),
      },
      {
        key: "updated_at",
        label: "Last Updated",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-600">{formatDate(item.updated_at)}</span>
        ),
      },
    ];

    return baseColumns;
  }, []);

  const openAddModal = () => {
    setForm({ id: 0, name: "", description: "", total_quantity: 1, status: "available" });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      total_quantity: item.total_quantity,
      status: item.status
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'total_quantity' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      showToast("Please enter item name.", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateInventoryItem(form.id, {
          name: form.name,
          description: form.description,
          total_quantity: form.total_quantity,
          status: form.status
        });
        showToast("Inventory item updated!", "success");
        // Reload inventory to get updated available_quantity
        await loadInventory();
      } else {
        const result = await createInventoryItem({
          name: form.name,
          description: form.description,
          total_quantity: form.total_quantity,
          status: form.status
        });
        showToast("Inventory item created!", "success");
        // Reload inventory to get fresh data
        await loadInventory();
      }
      setShowModal(false);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'saving inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await deleteInventoryItem(itemToDelete.id);
      showToast("Inventory item deleted!", "success");
      // Reload inventory to get fresh data
      await loadInventory();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting inventory item');
      // Don't close modal on error so user can retry
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Inventory / Stock Management</h1>
          <div className="text-white opacity-90 mb-2">Manage tools, facilities, and assignments to teams.</div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search by item name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isManager && (
            <ButtonLoader
              loading={false}
              onClick={openAddModal}
              label="+ Add Inventory Item"
              variant="primary"
              className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600"
            />
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Inventory Items</h2>
              {!loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredInventory.length} of {inventory.length} items
                </p>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredInventory}
            loading={loading}
            emptyMessage="No inventory items found. Create your first item to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={isManager ? (item: any) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
                  aria-label="Edit item"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M15.232 5.232a2.5 2.5 0 0 1 0 3.536l-7.5 7.5A2 2 0 0 1 6 17H3a1 1 0 0 1-1-1v-3c0-.53.21-1.04.586-1.414l7.5-7.5a2.5 2.5 0 0 1 3.536 0zm-2.828 2.828L5 15v2h2l7.404-7.404-2.828-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                  aria-label="Delete item"
                  title="Delete"
                  disabled={deleting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : undefined}
          />
        </div>

        {/* Add/Edit Inventory Item Modal */}
        <Modal
          title={isEdit ? "Edit Inventory Item" : "Add Inventory Item"}
          open={showModal && isManager}
          onClose={() => setShowModal(false)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Item Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                rows={3}
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Total Quantity *</label>
              <input
                name="total_quantity"
                type="number"
                min={1}
                value={form.total_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                loading={false}
                onClick={() => setShowModal(false)}
                label="Cancel"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={submitting}
                label={isEdit ? "Update Item" : "Create Item"}
                loadingText={isEdit ? "Updating..." : "Creating..."}
                variant="primary"
                type="submit"
                disabled={submitting}
              />
            </div>
          </form>
        </Modal>
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={itemToDelete?.name}
          itemType="inventory item"
          loading={deleting}
          description="This will permanently delete the inventory item and remove all team assignments. This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default StockManagement;