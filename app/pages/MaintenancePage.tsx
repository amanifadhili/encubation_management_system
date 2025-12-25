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
  getAllMaintenanceLogs,
  getUpcomingMaintenance,
  getItemsDueForMaintenance,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  autoScheduleMaintenance,
  getInventory,
  getUsers
} from "../services/api";

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

interface MaintenanceLog {
  id: string;
  item_id: string;
  maintenance_type: string;
  performed_by?: string;
  performed_at: string;
  notes?: string;
  next_maintenance?: string;
  item?: any;
  technician?: any;
}

const MaintenancePage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [dueItems, setDueItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDueItems, setLoadingDueItems] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDueItemsModal, setShowDueItemsModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [itemFilter, setItemFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "due">("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const isManager = user?.role === "manager" || user?.role === "director";

  useEffect(() => {
    if (user) {
      loadData();
      loadDueItems();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, inventoryData, usersData] = await Promise.all([
        withRetry(() => getAllMaintenanceLogs(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getUsers(), { maxRetries: 3, initialDelay: 1000 })
      ]);
      
      setMaintenanceLogs(Array.isArray(logsData) ? logsData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      // Filter users to only those who can perform maintenance (managers, directors, or specific technicians)
      setTechnicians(Array.isArray(usersData) ? usersData.filter((u: any) => 
        u.role === "manager" || u.role === "director" || u.name?.toLowerCase().includes("technician")
      ) : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  const loadDueItems = async () => {
    setLoadingDueItems(true);
    try {
      const data = await withRetry(() => getItemsDueForMaintenance({ overdue_only: false, days_ahead: 30 }), { maxRetries: 3 });
      setDueItems(Array.isArray(data) ? data : (data?.items || []));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading due items');
      setDueItems([]);
    } finally {
      setLoadingDueItems(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const isDueSoon = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0;
    } catch {
      return false;
    }
  };

  const isOverdue = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  // Filtered and sorted maintenance logs
  const filteredMaintenanceLogs = useMemo(() => {
    let filtered = maintenanceLogs;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(log =>
        log.item?.name?.toLowerCase().includes(searchLower) ||
        log.maintenance_type?.toLowerCase().includes(searchLower) ||
        log.technician?.name?.toLowerCase().includes(searchLower) ||
        log.id?.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(log => log.maintenance_type === typeFilter);
    }

    if (itemFilter) {
      filtered = filtered.filter(log => log.item_id === itemFilter);
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = (a as any)[sortBy];
        let bVal: any = (b as any)[sortBy];

        if (sortBy === "item") {
          aVal = a.item?.name || "";
          bVal = b.item?.name || "";
        } else if (sortBy === "technician") {
          aVal = a.technician?.name || "";
          bVal = b.technician?.name || "";
        }

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
  }, [maintenanceLogs, search, typeFilter, itemFilter, sortBy, sortOrder]);

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  const [form, setForm] = useState({
    item_id: "",
    maintenance_type: "",
    performed_by: "",
    performed_at: "",
    notes: "",
    next_maintenance: ""
  });

  const openAddModal = () => {
    setIsEdit(false);
    setSelectedMaintenance(null);
    setForm({
      item_id: "",
      maintenance_type: "",
      performed_by: user?.id?.toString() || "",
      performed_at: new Date().toISOString().split('T')[0] + "T" + new Date().toTimeString().slice(0, 5),
      notes: "",
      next_maintenance: ""
    });
    setShowModal(true);
  };

  const openEditModal = (maintenance: MaintenanceLog) => {
    setIsEdit(true);
    setSelectedMaintenance(maintenance);
    const performedDate = maintenance.performed_at ? new Date(maintenance.performed_at).toISOString().slice(0, 16) : "";
    const nextDate = maintenance.next_maintenance ? new Date(maintenance.next_maintenance).toISOString().slice(0, 16) : "";
    setForm({
      item_id: maintenance.item_id,
      maintenance_type: maintenance.maintenance_type,
      performed_by: maintenance.performed_by || "",
      performed_at: performedDate,
      notes: maintenance.notes || "",
      next_maintenance: nextDate
    });
    setShowModal(true);
  };

  const openDeleteModal = (maintenance: MaintenanceLog) => {
    setSelectedMaintenance(maintenance);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_id || !form.maintenance_type || !form.performed_at) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        item_id: form.item_id,
        maintenance_type: form.maintenance_type,
        performed_by: form.performed_by || undefined,
        performed_at: form.performed_at,
        notes: form.notes || undefined,
        next_maintenance: form.next_maintenance || undefined
      };

      if (isEdit && selectedMaintenance) {
        await updateMaintenanceLog(selectedMaintenance.id, data);
        showToast("Maintenance log updated successfully!", "success");
      } else {
        await createMaintenanceLog(data);
        showToast("Maintenance log created successfully!", "success");
      }

      setShowModal(false);
      await loadData();
      await loadDueItems();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, isEdit ? 'updating maintenance log' : 'creating maintenance log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSchedule = async () => {
    setScheduling(true);
    try {
      await autoScheduleMaintenance();
      showToast("Maintenance scheduling completed!", "success");
      await loadData();
      await loadDueItems();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'auto-scheduling maintenance');
    } finally {
      setScheduling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMaintenance) return;

    setDeleting(true);
    try {
      await deleteMaintenanceLog(selectedMaintenance.id);
      showToast("Maintenance log deleted successfully!", "success");
      setShowDeleteModal(false);
      setSelectedMaintenance(null);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting maintenance log');
    } finally {
      setDeleting(false);
    }
  };

  const maintenanceTypes = [
    "Routine Inspection",
    "Cleaning",
    "Calibration",
    "Repair",
    "Software Update",
    "Battery Replacement",
    "Filter Replacement",
    "Other"
  ];

  const columns: TableColumn<MaintenanceLog>[] = useMemo(() => [
    {
      key: "item",
      label: "Item",
      sortable: true,
      render: (log: MaintenanceLog) => (
        <div>
          <div className="font-semibold text-gray-900">{log.item?.name || "-"}</div>
          <div className="text-xs text-gray-500">{log.item?.sku || ""}</div>
        </div>
      ),
    },
    {
      key: "maintenance_type",
      label: "Type",
      sortable: true,
      render: (log: MaintenanceLog) => (
        <Badge variant="info">{log.maintenance_type}</Badge>
      ),
    },
    {
      key: "performed_at",
      label: "Performed At",
      sortable: true,
      render: (log: MaintenanceLog) => (
        <span className="text-sm text-gray-600">{formatDate(log.performed_at)}</span>
      ),
    },
    {
      key: "technician",
      label: "Performed By",
      sortable: true,
      render: (log: MaintenanceLog) => (
        <span className="text-sm text-gray-900">{log.technician?.name || log.performed_by || "-"}</span>
      ),
    },
    {
      key: "next_maintenance",
      label: "Next Maintenance",
      sortable: true,
      render: (log: MaintenanceLog) => {
        const isOverdue_ = log.next_maintenance ? isOverdue(log.next_maintenance) : false;
        const isDueSoon_ = log.next_maintenance ? isDueSoon(log.next_maintenance) : false;
        return (
          <div>
            <span className={`text-sm ${isOverdue_ ? "text-red-600 font-semibold" : isDueSoon_ ? "text-yellow-600 font-semibold" : "text-gray-600"}`}>
              {formatDate(log.next_maintenance)}
            </span>
            {isOverdue_ && <div className="text-xs text-red-500">Overdue</div>}
            {isDueSoon_ && !isOverdue_ && <div className="text-xs text-yellow-500">Due Soon</div>}
          </div>
        );
      },
    },
  ], []);

  const dueItemsColumns: TableColumn<any>[] = useMemo(() => [
    {
      key: "name",
      label: "Item",
      render: (item: any) => (
        <div>
          <div className="font-semibold text-gray-900">{item.name || "-"}</div>
          <div className="text-xs text-gray-500">{item.sku || ""}</div>
        </div>
      ),
    },
    {
      key: "next_maintenance",
      label: "Next Maintenance",
      render: (item: any) => {
        const isOverdue_ = item.next_maintenance ? isOverdue(item.next_maintenance) : false;
        const isDueSoon_ = item.next_maintenance ? isDueSoon(item.next_maintenance) : false;
        return (
          <div>
            <span className={`text-sm ${isOverdue_ ? "text-red-600 font-semibold" : isDueSoon_ ? "text-yellow-600 font-semibold" : "text-gray-600"}`}>
              {formatDate(item.next_maintenance)}
            </span>
            {isOverdue_ && <div className="text-xs text-red-500">Overdue</div>}
            {isDueSoon_ && !isOverdue_ && <div className="text-xs text-yellow-500">Due Soon</div>}
          </div>
        );
      },
    },
    {
      key: "category",
      label: "Category",
      render: (item: any) => (
        <span className="text-sm text-gray-600">{item.category || "-"}</span>
      ),
    },
  ], []);

  // Calculate statistics
  const overdueItems = useMemo(() => 
    dueItems.filter(item => item.next_maintenance && isOverdue(item.next_maintenance)).length,
    [dueItems]
  );
  const dueSoonItems = useMemo(() => 
    dueItems.filter(item => item.next_maintenance && isDueSoon(item.next_maintenance) && !isOverdue(item.next_maintenance)).length,
    [dueItems]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-purple-600 to-purple-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Maintenance Management</h1>
          <div className="text-white opacity-90 mb-2">Track and manage equipment maintenance</div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Logs</div>
            <div className="text-2xl font-bold text-gray-900">{filteredMaintenanceLogs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Items Due</div>
            <div className="text-2xl font-bold text-blue-600">{dueItems.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Due Soon</div>
            <div className="text-2xl font-bold text-yellow-600">{dueSoonItems}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{overdueItems}</div>
          </div>
        </div>

        {/* Alerts */}
        {(overdueItems > 0 || dueSoonItems > 0) && (
          <div className="mb-6 space-y-2">
            {overdueItems > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-red-800">
                        {overdueItems} Item{overdueItems !== 1 ? 's' : ''} Overdue for Maintenance
                      </h3>
                      <p className="text-sm text-red-700">Please schedule maintenance for these items</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDueItemsModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    View Items
                  </button>
                </div>
              </div>
            )}
            {dueSoonItems > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800">
                      {dueSoonItems} Item{dueSoonItems !== 1 ? 's' : ''} Due for Maintenance Soon
                    </h3>
                    <p className="text-sm text-yellow-700">Maintenance due within 7 days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
              placeholder="Search maintenance logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {maintenanceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
              value={itemFilter}
              onChange={e => setItemFilter(e.target.value)}
            >
              <option value="">All Items</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {isManager && (
              <>
                <ButtonLoader
                  loading={scheduling}
                  onClick={handleAutoSchedule}
                  label="Auto Schedule"
                  variant="secondary"
                  disabled={scheduling}
                />
                <ButtonLoader
                  loading={false}
                  onClick={openAddModal}
                  label="+ Log Maintenance"
                  variant="primary"
                  className="bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600"
                />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Table
            columns={columns}
            data={filteredMaintenanceLogs}
            loading={loading}
            emptyMessage="No maintenance logs found. Create your first maintenance log to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={(log: MaintenanceLog) => (
              <div className="flex items-center gap-1 flex-nowrap">
                {isManager && (
                  <>
                    <button
                      onClick={() => openEditModal(log)}
                      className="p-2 rounded-lg hover:bg-purple-100 text-purple-700 transition-colors"
                      aria-label="Edit maintenance log"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(log)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                      aria-label="Delete maintenance log"
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

        {/* Add/Edit Maintenance Modal */}
        <Modal
          title={isEdit ? "Edit Maintenance Log" : "Log Maintenance"}
          open={showModal}
          onClose={() => setShowModal(false)}
          actions={null}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-purple-800">Item *</label>
              <select
                value={form.item_id}
                onChange={e => setForm(prev => ({ ...prev, item_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
                required
                disabled={submitting || isEdit}
              >
                <option value="">Select Item</option>
                {inventory
                  .filter(item => !isEdit || item.id === form.item_id)
                  .map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-purple-800">Maintenance Type *</label>
              <select
                value={form.maintenance_type}
                onChange={e => setForm(prev => ({ ...prev, maintenance_type: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
                required
                disabled={submitting}
              >
                <option value="">Select Type</option>
                {maintenanceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-purple-800">Performed By</label>
              <select
                value={form.performed_by}
                onChange={e => setForm(prev => ({ ...prev, performed_by: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
                disabled={submitting}
              >
                <option value="">Select Technician</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name || tech.email}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-purple-800">Performed At *</label>
              <input
                type="datetime-local"
                value={form.performed_at}
                onChange={e => setForm(prev => ({ ...prev, performed_at: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
                required
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-purple-800">Next Maintenance</label>
              <input
                type="datetime-local"
                value={form.next_maintenance}
                onChange={e => setForm(prev => ({ ...prev, next_maintenance: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-purple-800">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-200 text-purple-900 bg-purple-50"
                rows={3}
                disabled={submitting}
                placeholder="Maintenance details, issues found, actions taken..."
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

        {/* Due Items Modal */}
        <Modal
          title="Items Due for Maintenance"
          open={showDueItemsModal}
          onClose={() => setShowDueItemsModal(false)}
          actions={null}
        >
          <div className="mb-4">
            <Table
              columns={dueItemsColumns}
              data={dueItems}
              loading={loadingDueItems}
              emptyMessage="No items due for maintenance"
            />
          </div>
          <div className="flex justify-end">
            <ButtonLoader
              loading={false}
              onClick={() => setShowDueItemsModal(false)}
              label="Close"
              variant="secondary"
              type="button"
            />
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMaintenance(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={selectedMaintenance ? `${selectedMaintenance.item?.name || 'Maintenance log'}` : undefined}
          itemType="maintenance log"
          loading={deleting}
          description="This will permanently delete the maintenance log. This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default MaintenancePage;

