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
  getAllConsumptionLogs,
  getConsumptionLogById,
  createConsumptionLog,
  updateConsumptionLog,
  deleteConsumptionLog,
  getConsumptionReports,
  getInventory,
  getIncubators,
  autoCreateReplenishmentRequests
} from "../services/api";

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

interface ConsumptionLog {
  id: string;
  item_id: string;
  quantity: number;
  consumption_type: string;
  consumption_date: string;
  distributed_to?: string;
  team_id?: string;
  distributed_by?: string;
  event_type?: string;
  notes?: string;
  item?: any;
  team?: any;
  distributor?: any;
}

const ConsumablesPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ConsumptionLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingReplenishment, setGeneratingReplenishment] = useState(false);
  const [search, setSearch] = useState("");
  const [itemFilter, setItemFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  const isManager = user?.role === "manager" || user?.role === "director";

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, inventoryData, teamsData] = await Promise.all([
        withRetry(() => getAllConsumptionLogs(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getIncubators(), { maxRetries: 3, initialDelay: 1000 })
      ]);
      
      const logs = Array.isArray(logsData) ? logsData : [];
      setConsumptionLogs(logs);
      
      const allItems = Array.isArray(inventoryData) ? inventoryData : [];
      // Filter consumables (items marked as Consumables or Refreshments)
      const consumablesList = allItems.filter(item => 
        item.category === "Consumables" || item.category === "Refreshments" || item.item_type === "Consumable"
      );
      setConsumables(consumablesList);
      
      // Find low stock items
      const lowStock = consumablesList.filter(item => {
        const available = item.available_quantity ?? 0;
        const minStock = item.min_stock_level ?? 0;
        return available <= minStock && minStock > 0;
      });
      setLowStockItems(lowStock);
      
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading consumption data');
    } finally {
      setLoading(false);
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

  // Filtered and sorted consumption logs
  const filteredLogs = useMemo(() => {
    let filtered = consumptionLogs;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(log =>
        log.item?.name?.toLowerCase().includes(searchLower) ||
        log.team?.name?.toLowerCase().includes(searchLower) ||
        log.distributed_to?.toLowerCase().includes(searchLower) ||
        log.id?.toLowerCase().includes(searchLower)
      );
    }

    if (itemFilter) {
      filtered = filtered.filter(log => log.item_id === itemFilter);
    }

    if (teamFilter) {
      filtered = filtered.filter(log => log.team_id === teamFilter);
    }

    if (eventFilter) {
      filtered = filtered.filter(log => log.event_type === eventFilter);
    }

    if (dateRange.start) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.consumption_date);
        return logDate >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.consumption_date);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return logDate <= endDate;
      });
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = (a as any)[sortBy];
        let bVal: any = (b as any)[sortBy];

        if (sortBy === "item") {
          aVal = a.item?.name || "";
          bVal = b.item?.name || "";
        } else if (sortBy === "team") {
          aVal = a.team?.name || "";
          bVal = b.team?.name || "";
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
  }, [consumptionLogs, search, itemFilter, teamFilter, eventFilter, dateRange, sortBy, sortOrder]);

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  const [form, setForm] = useState({
    item_id: "",
    quantity: 1,
    consumption_type: "distribution",
    consumption_date: new Date().toISOString().slice(0, 16),
    distributed_to: "",
    team_id: "",
    distributed_by: user?.id?.toString() || "",
    event_type: "",
    notes: ""
  });

  const openAddModal = () => {
    setIsEdit(false);
    setSelectedLog(null);
    setForm({
      item_id: "",
      quantity: 1,
      consumption_type: "distribution",
      consumption_date: new Date().toISOString().slice(0, 16),
      distributed_to: "",
      team_id: "",
      distributed_by: user?.id?.toString() || "",
      event_type: "",
      notes: ""
    });
    setShowModal(true);
  };

  const openEditModal = (log: ConsumptionLog) => {
    setIsEdit(true);
    setSelectedLog(log);
    const logDate = log.consumption_date ? new Date(log.consumption_date).toISOString().slice(0, 16) : "";
    setForm({
      item_id: log.item_id,
      quantity: log.quantity,
      consumption_type: log.consumption_type || "distribution",
      consumption_date: logDate,
      distributed_to: log.distributed_to || "",
      team_id: log.team_id || "",
      distributed_by: log.distributed_by || user?.id?.toString() || "",
      event_type: log.event_type || "",
      notes: log.notes || ""
    });
    setShowModal(true);
  };

  const openDeleteModal = (log: ConsumptionLog) => {
    setSelectedLog(log);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_id || !form.quantity || !form.consumption_date) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const selectedItem = consumables.find(item => item.id === form.item_id);
    if (selectedItem && form.quantity > (selectedItem.available_quantity || 0)) {
      showToast(`Only ${selectedItem.available_quantity} available`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        item_id: form.item_id,
        quantity: form.quantity,
        consumption_type: form.consumption_type,
        consumption_date: form.consumption_date,
        distributed_to: form.distributed_to || undefined,
        team_id: form.team_id || undefined,
        distributed_by: form.distributed_by || undefined,
        event_type: form.event_type || undefined,
        notes: form.notes || undefined
      };

      if (isEdit && selectedLog) {
        await updateConsumptionLog(selectedLog.id, data);
        showToast("Consumption log updated successfully!", "success");
      } else {
        await createConsumptionLog(data);
        showToast("Consumption logged successfully!", "success");
      }

      setShowModal(false);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, isEdit ? 'updating consumption log' : 'creating consumption log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoReplenishment = async () => {
    setGeneratingReplenishment(true);
    try {
      const response = await autoCreateReplenishmentRequests();
      if (response.success) {
        showToast(`Created ${response.data?.count || 0} replenishment requests`, "success");
      } else {
        showToast(response.message || "Failed to create replenishment requests", "error");
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'auto-creating replenishment requests');
    } finally {
      setGeneratingReplenishment(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLog) return;

    setDeleting(true);
    try {
      await deleteConsumptionLog(selectedLog.id);
      showToast("Consumption log deleted successfully!", "success");
      setShowDeleteModal(false);
      setSelectedLog(null);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting consumption log');
    } finally {
      setDeleting(false);
    }
  };

  const consumptionTypes = [
    "distribution",
    "consumption",
    "waste",
    "damaged",
    "other"
  ];

  const eventTypes = [
    "Meeting",
    "Event",
    "Workshop",
    "Daily Use",
    "Other"
  ];

  const columns: TableColumn<ConsumptionLog>[] = useMemo(() => [
    {
      key: "item",
      label: "Item",
      sortable: true,
      render: (log: ConsumptionLog) => (
        <div>
          <div className="font-semibold text-gray-900">{log.item?.name || "-"}</div>
          <div className="text-xs text-gray-500">{log.item?.sku || ""}</div>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      className: "text-center",
      render: (log: ConsumptionLog) => (
        <span className="font-semibold text-gray-900">{log.quantity ?? 0}</span>
      ),
    },
    {
      key: "consumption_date",
      label: "Date",
      sortable: true,
      render: (log: ConsumptionLog) => (
        <span className="text-sm text-gray-600">{formatDate(log.consumption_date)}</span>
      ),
    },
    {
      key: "team",
      label: "Team",
      sortable: true,
      render: (log: ConsumptionLog) => (
        <span className="text-sm text-gray-900">{log.team?.name || log.distributed_to || "-"}</span>
      ),
    },
    {
      key: "event_type",
      label: "Event",
      render: (log: ConsumptionLog) => (
        log.event_type ? (
          <Badge variant="info">{log.event_type}</Badge>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )
      ),
    },
    {
      key: "consumption_type",
      label: "Type",
      render: (log: ConsumptionLog) => (
        <Badge variant="default">{log.consumption_type || "distribution"}</Badge>
      ),
    },
  ], []);

  // Calculate statistics
  const totalConsumed = useMemo(() => 
    filteredLogs.reduce((sum, log) => sum + (log.quantity || 0), 0),
    [filteredLogs]
  );

  const uniqueItems = useMemo(() => 
    new Set(filteredLogs.map(log => log.item_id)).size,
    [filteredLogs]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-orange-600 to-orange-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Consumables Management</h1>
          <div className="text-white opacity-90 mb-2">Track consumption and distribution of consumables</div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Logs</div>
            <div className="text-2xl font-bold text-gray-900">{filteredLogs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Consumed</div>
            <div className="text-2xl font-bold text-orange-600">{totalConsumed}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Unique Items</div>
            <div className="text-2xl font-bold text-blue-600">{uniqueItems}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Low Stock Items</div>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    {lowStockItems.length} Item{lowStockItems.length !== 1 ? 's' : ''} Low on Stock
                  </h3>
                  <p className="text-sm text-red-700">Consider replenishing these items</p>
                </div>
              </div>
              {isManager && (
                <ButtonLoader
                  loading={generatingReplenishment}
                  onClick={handleAutoReplenishment}
                  label="Auto Create Replenishment Requests"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={generatingReplenishment}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
              placeholder="Search consumption logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
              value={itemFilter}
              onChange={e => setItemFilter(e.target.value)}
            >
              <option value="">All Items</option>
              {consumables.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name || team.team_name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
            >
              <option value="">All Events</option>
              {eventTypes.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
            <input
              type="date"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <input
              type="date"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
              placeholder="End Date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          <ButtonLoader
            loading={false}
            onClick={openAddModal}
            label="+ Log Consumption"
            variant="primary"
            className="bg-gradient-to-r from-orange-700 to-orange-500 hover:from-orange-800 hover:to-orange-600"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Table
            columns={columns}
            data={filteredLogs}
            loading={loading}
            emptyMessage="No consumption logs found. Log your first consumption to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={(log: ConsumptionLog) => (
              <div className="flex items-center gap-1 flex-nowrap">
                <button
                  onClick={() => openEditModal(log)}
                  className="p-2 rounded-lg hover:bg-orange-100 text-orange-700 transition-colors"
                  aria-label="Edit consumption log"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => openDeleteModal(log)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                  aria-label="Delete consumption log"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          />
        </div>

        {/* Add/Edit Consumption Modal */}
        <Modal
          title={isEdit ? "Edit Consumption Log" : "Log Consumption"}
          open={showModal}
          onClose={() => setShowModal(false)}
          actions={null}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Item *</label>
              <select
                value={form.item_id}
                onChange={e => {
                  const item = consumables.find(i => i.id === e.target.value);
                  setForm(prev => ({ ...prev, item_id: e.target.value, quantity: 1 }));
                }}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                required
                disabled={submitting || isEdit}
              >
                <option value="">Select Item</option>
                {consumables
                  .filter(item => !isEdit || item.id === form.item_id)
                  .filter(item => (item.available_quantity || 0) > 0 || isEdit)
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.available_quantity || 0} available)
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Quantity *</label>
              <input
                type="number"
                min={1}
                max={consumables.find(item => item.id === form.item_id)?.available_quantity || 999999}
                value={form.quantity}
                onChange={e => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                required
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Consumption Type *</label>
              <select
                value={form.consumption_type}
                onChange={e => setForm(prev => ({ ...prev, consumption_type: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                required
                disabled={submitting}
              >
                {consumptionTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Date & Time *</label>
              <input
                type="datetime-local"
                value={form.consumption_date}
                onChange={e => setForm(prev => ({ ...prev, consumption_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                required
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Team</label>
              <select
                value={form.team_id}
                onChange={e => setForm(prev => ({ ...prev, team_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                disabled={submitting}
              >
                <option value="">Select Team (optional)</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name || team.team_name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Distributed To</label>
              <input
                type="text"
                value={form.distributed_to}
                onChange={e => setForm(prev => ({ ...prev, distributed_to: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                placeholder="Name or description"
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Event Type</label>
              <select
                value={form.event_type}
                onChange={e => setForm(prev => ({ ...prev, event_type: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                disabled={submitting}
              >
                <option value="">Select Event (optional)</option>
                {eventTypes.map(event => (
                  <option key={event} value={event}>{event}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-orange-800">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-900 bg-orange-50"
                rows={3}
                disabled={submitting}
                placeholder="Additional notes..."
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
                label={isEdit ? "Update" : "Log Consumption"}
                loadingText={isEdit ? "Updating..." : "Logging..."}
                variant="primary"
                type="submit"
                disabled={submitting}
              />
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedLog(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={selectedLog ? `${selectedLog.item?.name || 'Consumption log'}` : undefined}
          itemType="consumption log"
          loading={deleting}
          description="This will permanently delete the consumption log. This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default ConsumablesPage;

