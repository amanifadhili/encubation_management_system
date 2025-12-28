import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Table from "../components/Table";
import Badge from "../components/Badge";
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getInventory
} from "../services/api";

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  notes?: string;
  items_count?: number;
}

const SuppliersPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const isManager = user?.role === "manager" || user?.role === "director";

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppliersData, inventoryData] = await Promise.all([
        withRetry(() => getAllSuppliers(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 })
      ]);
      
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading suppliers');
    } finally {
      setLoading(false);
    }
  };

  // Calculate items count per supplier
  const suppliersWithCounts = useMemo(() => {
    const countMap = new Map<string, number>();
    inventory.forEach(item => {
      if (item.supplier_id) {
        countMap.set(item.supplier_id, (countMap.get(item.supplier_id) || 0) + 1);
      }
    });

    return suppliers.map(supplier => ({
      ...supplier,
      items_count: countMap.get(supplier.id) || 0
    }));
  }, [suppliers, inventory]);

  // Filtered and sorted suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliersWithCounts;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.contact_person?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.phone?.toLowerCase().includes(searchLower)
      );
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = (a as any)[sortBy];
        let bVal = (b as any)[sortBy];

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = (bVal || "").toLowerCase();
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [suppliersWithCounts, search, sortBy, sortOrder]);

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <defs>
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path fill={`url(#half-${i})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            );
          } else {
            return (
              <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            );
          }
        })}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    rating: "",
    notes: ""
  });

  const openAddModal = () => {
    setIsEdit(false);
    setSelectedSupplier(null);
    setForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      rating: "",
      notes: ""
    });
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setIsEdit(true);
    setSelectedSupplier(supplier);
    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      rating: supplier.rating?.toString() || "",
      notes: supplier.notes || ""
    });
    setShowModal(true);
  };

  const openDetailModal = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setLoadingDetails(true);
    setShowDetailModal(true);
    try {
      const details = await getSupplierById(supplier.id);
      setSelectedSupplierDetails(details);
      
      // Get items from this supplier
      const supplierItems = inventory.filter(item => item.supplier_id === supplier.id);
      setSelectedSupplierDetails((prev: any) => ({
        ...prev,
        items: supplierItems
      }));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading supplier details');
      setShowDetailModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openDeleteModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Supplier name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: form.name.trim(),
        contact_person: form.contact_person.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        rating: form.rating ? parseFloat(form.rating) : undefined,
        notes: form.notes.trim() || undefined
      };

      if (isEdit && selectedSupplier) {
        await updateSupplier(selectedSupplier.id, data);
        showToast("Supplier updated successfully!", "success");
      } else {
        await createSupplier(data);
        showToast("Supplier created successfully!", "success");
      }

      setShowModal(false);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, isEdit ? 'updating supplier' : 'creating supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;

    // Check if supplier has items
    const itemsFromSupplier = inventory.filter(item => item.supplier_id === selectedSupplier.id);
    if (itemsFromSupplier.length > 0) {
      showToast(`Cannot delete supplier with ${itemsFromSupplier.length} item(s). Please update items first.`, "error");
      setShowDeleteModal(false);
      return;
    }

    setDeleting(true);
    try {
      await deleteSupplier(selectedSupplier.id);
      showToast("Supplier deleted successfully!", "success");
      setShowDeleteModal(false);
      setSelectedSupplier(null);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting supplier');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<Supplier>[] = useMemo(() => [
    {
      key: "name",
      label: "Supplier Name",
      sortable: true,
      render: (supplier: Supplier) => (
        <div>
          <div className="font-semibold text-gray-900">{supplier.name}</div>
          {supplier.contact_person && (
            <div className="text-xs text-gray-500">Contact: {supplier.contact_person}</div>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (supplier: Supplier) => (
        <span className="text-sm text-gray-600">{supplier.email || "-"}</span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (supplier: Supplier) => (
        <span className="text-sm text-gray-600">{supplier.phone || "-"}</span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (supplier: Supplier) => renderRating(supplier.rating),
    },
    {
      key: "items_count",
      label: "Items",
      sortable: true,
      className: "text-center",
      render: (supplier: Supplier) => (
        <Badge variant={supplier.items_count && supplier.items_count > 0 ? "info" : "default"}>
          {supplier.items_count ?? 0}
        </Badge>
      ),
    },
  ], []);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Suppliers</h1>
          <div className="text-white opacity-90 mb-2">Manage suppliers and their information</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search suppliers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isManager && (
            <ButtonLoader
              loading={false}
              onClick={openAddModal}
              label="+ Add Supplier"
              variant="primary"
              className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Table
            columns={columns}
            data={filteredSuppliers}
            loading={loading}
            emptyMessage="No suppliers found. Create your first supplier to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={(supplier: Supplier) => (
              <div className="flex items-center gap-1 flex-nowrap">
                <button
                  onClick={() => openDetailModal(supplier)}
                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
                  aria-label="View details"
                  title="View Details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                {isManager && (
                  <>
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="p-2 rounded-lg hover:bg-green-100 text-green-700 transition-colors"
                      aria-label="Edit supplier"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(supplier)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                      aria-label="Delete supplier"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          />
        </div>

        {/* Add/Edit Supplier Modal */}
        <Modal
          title={isEdit ? "Edit Supplier" : "Add Supplier"}
          open={showModal}
          onClose={() => setShowModal(false)}
          actions={null}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Supplier Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
                placeholder="e.g., ABC Supplies Inc."
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Contact Person</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={e => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="e.g., John Doe"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="supplier@example.com"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Address</label>
              <textarea
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                rows={2}
                disabled={submitting}
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={e => setForm(prev => ({ ...prev, rating: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="4.5"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                rows={3}
                disabled={submitting}
                placeholder="Additional notes about the supplier..."
              />
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
                label={isEdit ? "Update" : "Create"}
                loadingText={isEdit ? "Updating..." : "Creating..."}
                variant="primary"
                type="submit"
                disabled={submitting}
              />
            </div>
          </form>
        </Modal>

        {/* Supplier Detail Modal */}
        <Modal
          title={`Supplier Details: ${selectedSupplier?.name || ''}`}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSupplier(null);
            setSelectedSupplierDetails(null);
          }}
          actions={null}
        >
          {loadingDetails ? (
            <div className="p-8 text-center">Loading details...</div>
          ) : selectedSupplierDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Contact Person</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSupplierDetails.contact_person || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSupplierDetails.email || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSupplierDetails.phone || "-"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Rating</label>
                  <p className="mt-1">{renderRating(selectedSupplierDetails.rating)}</p>
                </div>
                {selectedSupplierDetails.address && (
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSupplierDetails.address}</p>
                  </div>
                )}
                {selectedSupplierDetails.notes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSupplierDetails.notes}</p>
                  </div>
                )}
              </div>

              {selectedSupplierDetails.items && selectedSupplierDetails.items.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Items from this Supplier ({selectedSupplierDetails.items.length})</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedSupplierDetails.items.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{item.category || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{item.total_quantity ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No details available</div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedSupplier(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={selectedSupplier?.name}
          itemType="supplier"
          loading={deleting}
          description="This will permanently delete the supplier. Make sure there are no items associated with it."
        />
      </div>
    </div>
  );
};

export default SuppliersPage;

