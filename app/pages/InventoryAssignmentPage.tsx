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
  getInventory,
  assignInventoryToTeam,
  unassignInventoryFromTeam,
  getInventoryItemAssignments,
  getIncubators
} from "../services/api";

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

const InventoryAssignmentPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [itemFilter, setItemFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
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
      const [inventoryData, teamsData] = await Promise.all([
        withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getIncubators(), { maxRetries: 3, initialDelay: 1000 })
      ]);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);

      // Fetch assignments for all items
      const allAssignments: any[] = [];
      for (const item of inventoryData) {
        try {
          const itemAssignments = await getInventoryItemAssignments(item.id);
          if (Array.isArray(itemAssignments)) {
            allAssignments.push(...itemAssignments.map((a: any) => ({ ...a, item })));
          } else if (itemAssignments.assignments && Array.isArray(itemAssignments.assignments)) {
            allAssignments.push(...itemAssignments.assignments.map((a: any) => ({ ...a, item })));
          }
        } catch (error) {
          console.error(`Error loading assignments for item ${item.id}:`, error);
        }
      }
      setAssignments(allAssignments);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading assignments');
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
      });
    } catch {
      return "-";
    }
  };

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (assignment: any) =>
          assignment.item?.name?.toLowerCase().includes(searchLower) ||
          assignment.team?.name?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((assignment: any) => assignment.status === statusFilter);
    }

    if (itemFilter) {
      filtered = filtered.filter((assignment: any) => assignment.item_id === itemFilter);
    }

    if (teamFilter) {
      filtered = filtered.filter((assignment: any) => assignment.team_id === teamFilter);
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

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
  }, [assignments, search, statusFilter, itemFilter, teamFilter, sortBy, sortOrder]);

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  const columns: TableColumn<any>[] = useMemo(() => [
    {
      key: "item",
      label: "Item",
      sortable: true,
      render: (assignment: any) => (
        <div>
          <div className="font-semibold text-gray-900">{assignment.item?.name || "-"}</div>
          <div className="text-xs text-gray-500">{assignment.item?.sku || ""}</div>
        </div>
      ),
    },
    {
      key: "team",
      label: "Team",
      sortable: true,
      render: (assignment: any) => (
        <span className="text-sm text-gray-900">{assignment.team?.name || "-"}</span>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      sortable: true,
      className: "text-center",
      render: (assignment: any) => (
        <span className="font-semibold text-gray-900">{assignment.quantity ?? 0}</span>
      ),
    },
    {
      key: "assigned_at",
      label: "Assigned Date",
      sortable: true,
      render: (assignment: any) => (
        <span className="text-sm text-gray-600">{formatDate(assignment.assigned_at)}</span>
      ),
    },
    {
      key: "expected_return",
      label: "Expected Return",
      sortable: true,
      render: (assignment: any) => (
        <span className="text-sm text-gray-600">{formatDate(assignment.expected_return)}</span>
      ),
    },
    {
      key: "returned_at",
      label: "Returned Date",
      sortable: true,
      render: (assignment: any) => (
        assignment.returned_at ? (
          <span className="text-sm text-green-600">{formatDate(assignment.returned_at)}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (assignment: any) => {
        const variant = assignment.status === "active" ? "success" : 
                       assignment.status === "returned" ? "default" : "warning";
        return (
          <Badge variant={variant}>
            {assignment.status || "active"}
          </Badge>
        );
      },
    },
  ], []);

  const [assignForm, setAssignForm] = useState({
    item_id: "",
    team_id: "",
    quantity: 1,
    expected_return: "",
    notes: ""
  });

  const [returnForm, setReturnForm] = useState({
    return_notes: "",
    return_condition: "Good"
  });

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.item_id || !assignForm.team_id) {
      showToast("Please select item and team", "error");
      return;
    }

    const selectedItemData = inventory.find(item => item.id === assignForm.item_id);
    if (selectedItemData && assignForm.quantity > (selectedItemData.available_quantity || 0)) {
      showToast(`Only ${selectedItemData.available_quantity} available`, "error");
      return;
    }

    setSubmitting(true);
    try {
      await assignInventoryToTeam(assignForm.item_id, {
        team_id: assignForm.team_id,
        quantity: assignForm.quantity,
        expected_return: assignForm.expected_return || undefined,
        notes: assignForm.notes || undefined
      });
      showToast("Item assigned successfully!", "success");
      setShowAssignModal(false);
      setAssignForm({ item_id: "", team_id: "", quantity: 1, expected_return: "", notes: "" });
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'assigning item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      await unassignInventoryFromTeam(selectedAssignment.item_id, selectedAssignment.team_id);
      showToast("Item returned successfully!", "success");
      setShowReturnModal(false);
      setSelectedAssignment(null);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'returning item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAssign = () => {
    setAssignForm({ item_id: "", team_id: "", quantity: 1, expected_return: "", notes: "" });
    setShowAssignModal(true);
  };

  const handleOpenReturn = (assignment: any) => {
    setSelectedAssignment(assignment);
    setReturnForm({ return_notes: "", return_condition: "Good" });
    setShowReturnModal(true);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Inventory Assignments</h1>
          <div className="text-white opacity-90 mb-2">Manage item assignments to teams</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search by item name or team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="lost">Lost</option>
              <option value="damaged">Damaged</option>
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
          </div>
          {isManager && (
            <ButtonLoader
              loading={false}
              onClick={handleOpenAssign}
              label="+ Assign Item"
              variant="primary"
              className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </p>
          </div>

          <Table
            columns={columns}
            data={filteredAssignments}
            loading={loading}
            emptyMessage="No assignments found. Assign items to teams to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={isManager ? (assignment: any) => (
              <div className="flex items-center gap-1 flex-nowrap">
                {assignment.status === "active" && (
                  <button
                    onClick={() => handleOpenReturn(assignment)}
                    className="p-2 rounded-lg hover:bg-green-100 text-green-700 transition-colors"
                    aria-label="Return item"
                    title="Return Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ) : undefined}
          />
        </div>

        {/* Assign Item Modal */}
        <Modal
          title="Assign Item to Team"
          open={showAssignModal && isManager}
          onClose={() => setShowAssignModal(false)}
          actions={null}
        >
          <form onSubmit={handleAssignSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Item *</label>
              <select
                value={assignForm.item_id}
                onChange={e => {
                  const item = inventory.find(i => i.id === e.target.value);
                  setAssignForm(prev => ({ ...prev, item_id: e.target.value, quantity: 1 }));
                }}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
              >
                <option value="">Select Item</option>
                {inventory
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
                value={assignForm.team_id}
                onChange={e => setAssignForm(prev => ({ ...prev, team_id: e.target.value }))}
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
                max={inventory.find(item => item.id === assignForm.item_id)?.available_quantity || 1}
                value={assignForm.quantity}
                onChange={e => setAssignForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Expected Return Date</label>
              <input
                type="date"
                value={assignForm.expected_return}
                onChange={e => setAssignForm(prev => ({ ...prev, expected_return: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Notes</label>
              <textarea
                value={assignForm.notes}
                onChange={e => setAssignForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                rows={3}
                disabled={submitting}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                loading={false}
                onClick={() => setShowAssignModal(false)}
                label="Cancel"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={submitting}
                label="Assign"
                loadingText="Assigning..."
                variant="primary"
                type="submit"
                disabled={submitting}
              />
            </div>
          </form>
        </Modal>

        {/* Return Item Modal */}
        <Modal
          title="Return Item"
          open={showReturnModal && isManager}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedAssignment(null);
          }}
          actions={null}
        >
          {selectedAssignment && (
            <form onSubmit={handleReturnSubmit}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Returning <strong>{selectedAssignment.item?.name}</strong> from <strong>{selectedAssignment.team?.name}</strong>
                </p>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Return Condition</label>
                <select
                  value={returnForm.return_condition}
                  onChange={e => setReturnForm(prev => ({ ...prev, return_condition: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  disabled={submitting}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Return Notes</label>
                <textarea
                  value={returnForm.return_notes}
                  onChange={e => setReturnForm(prev => ({ ...prev, return_notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  rows={3}
                  disabled={submitting}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <ButtonLoader
                  loading={false}
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedAssignment(null);
                  }}
                  label="Cancel"
                  variant="secondary"
                  type="button"
                />
                <ButtonLoader
                  loading={submitting}
                  label="Return Item"
                  loadingText="Returning..."
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                />
              </div>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default InventoryAssignmentPage;

