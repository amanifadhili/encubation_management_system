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
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  confirmReservation,
  deleteReservation,
  getInventory,
  getIncubators
} from "../services/api";

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

interface Reservation {
  id: string;
  item_id: string;
  team_id: string;
  quantity: number;
  reserved_until: string;
  reserved_at: string;
  status: string;
  notes?: string;
  item?: any;
  team?: any;
}

const ReservationsPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [itemFilter, setItemFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(""); // upcoming, expired, all
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
      const [reservationsData, inventoryData, teamsData] = await Promise.all([
        withRetry(() => getAllReservations(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getIncubators(), { maxRetries: 3, initialDelay: 1000 })
      ]);
      
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading reservations');
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

  const isExpiringSoon = (dateString: string) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && daysUntil >= 0;
    } catch {
      return false;
    }
  };

  const isExpired = (dateString: string) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  // Filtered and sorted reservations
  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(reservation =>
        reservation.item?.name?.toLowerCase().includes(searchLower) ||
        reservation.team?.name?.toLowerCase().includes(searchLower) ||
        reservation.id?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    if (itemFilter) {
      filtered = filtered.filter(reservation => reservation.item_id === itemFilter);
    }

    if (teamFilter) {
      filtered = filtered.filter(reservation => reservation.team_id === teamFilter);
    }

    if (dateFilter === "upcoming") {
      filtered = filtered.filter(reservation => 
        reservation.reserved_until && !isExpired(reservation.reserved_until) && !isExpiringSoon(reservation.reserved_until)
      );
    } else if (dateFilter === "expiring") {
      filtered = filtered.filter(reservation => 
        reservation.reserved_until && isExpiringSoon(reservation.reserved_until)
      );
    } else if (dateFilter === "expired") {
      filtered = filtered.filter(reservation => 
        reservation.reserved_until && isExpired(reservation.reserved_until)
      );
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
  }, [reservations, search, statusFilter, itemFilter, teamFilter, dateFilter, sortBy, sortOrder]);

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  const [form, setForm] = useState({
    item_id: "",
    team_id: "",
    quantity: 1,
    reserved_until: "",
    notes: ""
  });

  const openAddModal = () => {
    setIsEdit(false);
    setSelectedReservation(null);
    setForm({
      item_id: "",
      team_id: "",
      quantity: 1,
      reserved_until: "",
      notes: ""
    });
    setShowModal(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setIsEdit(true);
    setSelectedReservation(reservation);
    setForm({
      item_id: reservation.item_id,
      team_id: reservation.team_id,
      quantity: reservation.quantity,
      reserved_until: reservation.reserved_until ? new Date(reservation.reserved_until).toISOString().split('T')[0] : "",
      notes: reservation.notes || ""
    });
    setShowModal(true);
  };

  const openDeleteModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item_id || !form.team_id || !form.reserved_until) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const selectedItem = inventory.find(item => item.id === form.item_id);
    if (selectedItem && form.quantity > (selectedItem.available_quantity || 0)) {
      showToast(`Only ${selectedItem.available_quantity} available`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        item_id: form.item_id,
        team_id: form.team_id,
        quantity: form.quantity,
        reserved_until: form.reserved_until,
        notes: form.notes || undefined
      };

      if (isEdit && selectedReservation) {
        await updateReservation(selectedReservation.id, data);
        showToast("Reservation updated successfully!", "success");
      } else {
        await createReservation(data);
        showToast("Reservation created successfully!", "success");
      }

      setShowModal(false);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, isEdit ? 'updating reservation' : 'creating reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      await confirmReservation(id);
      showToast("Reservation confirmed successfully!", "success");
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'confirming reservation');
    } finally {
      setConfirming(null);
    }
  };

  const handleCancel = async (id: string, reason?: string) => {
    setCancelling(id);
    try {
      await cancelReservation(id, reason);
      showToast("Reservation cancelled successfully!", "success");
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'cancelling reservation');
    } finally {
      setCancelling(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReservation) return;

    setDeleting(true);
    try {
      await deleteReservation(selectedReservation.id);
      showToast("Reservation deleted successfully!", "success");
      setShowDeleteModal(false);
      setSelectedReservation(null);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting reservation');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<Reservation>[] = useMemo(() => [
    {
      key: "item",
      label: "Item",
      sortable: true,
      render: (reservation: Reservation) => (
        <div>
          <div className="font-semibold text-gray-900">{reservation.item?.name || "-"}</div>
          <div className="text-xs text-gray-500">{reservation.item?.sku || ""}</div>
        </div>
      ),
    },
    {
      key: "team",
      label: "Team",
      sortable: true,
      render: (reservation: Reservation) => (
        <span className="text-sm text-gray-900">{reservation.team?.name || "-"}</span>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      className: "text-center",
      render: (reservation: Reservation) => (
        <span className="font-semibold text-gray-900">{reservation.quantity ?? 0}</span>
      ),
    },
    {
      key: "reserved_at",
      label: "Reserved Date",
      sortable: true,
      render: (reservation: Reservation) => (
        <span className="text-sm text-gray-600">{formatDate(reservation.reserved_at)}</span>
      ),
    },
    {
      key: "reserved_until",
      label: "Reserved Until",
      sortable: true,
      render: (reservation: Reservation) => {
        const isExpired_ = reservation.reserved_until ? isExpired(reservation.reserved_until) : false;
        const isExpiringSoon_ = reservation.reserved_until ? isExpiringSoon(reservation.reserved_until) : false;
        return (
          <div>
            <span className={`text-sm ${isExpired_ ? "text-red-600 font-semibold" : isExpiringSoon_ ? "text-yellow-600 font-semibold" : "text-gray-600"}`}>
              {formatDate(reservation.reserved_until)}
            </span>
            {isExpired_ && <div className="text-xs text-red-500">Expired</div>}
            {isExpiringSoon_ && !isExpired_ && <div className="text-xs text-yellow-500">Expiring Soon</div>}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (reservation: Reservation) => {
        const variant = reservation.status === "confirmed" ? "success" : 
                       reservation.status === "pending" ? "warning" :
                       reservation.status === "cancelled" ? "default" : "info";
        return (
          <Badge variant={variant}>
            {reservation.status || "pending"}
          </Badge>
        );
      },
    },
  ], []);

  // Calculate statistics
  const upcomingReservations = useMemo(() => 
    filteredReservations.filter(r => r.reserved_until && !isExpired(r.reserved_until) && !isExpiringSoon(r.reserved_until)).length,
    [filteredReservations]
  );
  const expiringReservations = useMemo(() => 
    filteredReservations.filter(r => r.reserved_until && isExpiringSoon(r.reserved_until)).length,
    [filteredReservations]
  );
  const expiredReservations = useMemo(() => 
    filteredReservations.filter(r => r.reserved_until && isExpired(r.reserved_until)).length,
    [filteredReservations]
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reservations</h1>
          <div className="text-white opacity-90 mb-2">Manage item reservations for teams</div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Reservations</div>
            <div className="text-2xl font-bold text-gray-900">{filteredReservations.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Upcoming</div>
            <div className="text-2xl font-bold text-blue-600">{upcomingReservations}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Expiring Soon</div>
            <div className="text-2xl font-bold text-yellow-600">{expiringReservations}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Expired</div>
            <div className="text-2xl font-bold text-red-600">{expiredReservations}</div>
          </div>
        </div>

        {/* Alerts */}
        {(expiringReservations > 0 || expiredReservations > 0) && (
          <div className="mb-6 space-y-2">
            {expiringReservations > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800">
                      {expiringReservations} Reservation{expiringReservations !== 1 ? 's' : ''} Expiring Soon
                    </h3>
                    <p className="text-sm text-yellow-700">Some reservations will expire within 3 days</p>
                  </div>
                </div>
              </div>
            )}
            {expiredReservations > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">
                      {expiredReservations} Expired Reservation{expiredReservations !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-red-700">Please review and cancel expired reservations</p>
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
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search reservations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={itemFilter}
              onChange={e => setItemFilter(e.target.value)}
            >
              <option value="">All Items</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          {isManager && (
            <ButtonLoader
              loading={false}
              onClick={openAddModal}
              label="+ Create Reservation"
              variant="primary"
              className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Table
            columns={columns}
            data={filteredReservations}
            loading={loading}
            emptyMessage="No reservations found. Create your first reservation to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={(reservation: Reservation) => (
              <div className="flex items-center gap-2">
                {reservation.status === "pending" && isManager && (
                  <button
                    onClick={() => handleConfirm(reservation.id)}
                    disabled={confirming === reservation.id}
                    className="p-2 rounded-lg hover:bg-green-100 text-green-700 transition-colors disabled:opacity-50"
                    aria-label="Confirm reservation"
                    title="Confirm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                {reservation.status !== "cancelled" && (
                  <button
                    onClick={() => handleCancel(reservation.id)}
                    disabled={cancelling === reservation.id}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors disabled:opacity-50"
                    aria-label="Cancel reservation"
                    title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {isManager && (
                  <>
                    <button
                      onClick={() => openEditModal(reservation)}
                      className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
                      aria-label="Edit reservation"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(reservation)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                      aria-label="Delete reservation"
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

        {/* Add/Edit Reservation Modal */}
        <Modal
          title={isEdit ? "Edit Reservation" : "Create Reservation"}
          open={showModal}
          onClose={() => setShowModal(false)}
          actions={null}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Item *</label>
              <select
                value={form.item_id}
                onChange={e => {
                  const item = inventory.find(i => i.id === e.target.value);
                  setForm(prev => ({ ...prev, item_id: e.target.value, quantity: 1 }));
                }}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting || isEdit}
              >
                <option value="">Select Item</option>
                {inventory
                  .filter(item => !isEdit || item.id === form.item_id)
                  .filter(item => (item.available_quantity || 0) > 0)
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.available_quantity} available)
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Team *</label>
              <select
                value={form.team_id}
                onChange={e => setForm(prev => ({ ...prev, team_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Quantity *</label>
              <input
                type="number"
                min={1}
                max={inventory.find(item => item.id === form.item_id)?.available_quantity || 1}
                value={form.quantity}
                onChange={e => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Reserved Until *</label>
              <input
                type="datetime-local"
                value={form.reserved_until}
                onChange={e => setForm(prev => ({ ...prev, reserved_until: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
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
                placeholder="Additional notes about the reservation..."
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

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedReservation(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={selectedReservation ? `${selectedReservation.item?.name || 'Reservation'}` : undefined}
          itemType="reservation"
          loading={deleting}
          description="This will permanently delete the reservation. This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default ReservationsPage;

