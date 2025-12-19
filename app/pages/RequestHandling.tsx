import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Tooltip from "../components/Tooltip";
import { Spinner } from "../components/loading/Spinner";
import Badge from "../components/Badge";
import {
  getRequests,
  updateRequestStatus,
  createRequest,
  getInventory,
  createInventoryItem,
  getIncubators,
  approveRequest,
} from "../services/api";

const MaterialPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  if (
    !user ||
    (user.role !== "incubator" &&
      user.role !== "manager" &&
      user.role !== "director")
  )
    return <div className="text-red-600 font-semibold">Access denied.</div>;

  // State
  const [materials, setMaterials] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    urgency_reason: "",
    required_by: "",
    is_consumable_request: false,
    requires_quick_approval: false,
    delivery_address: "",
    delivery_notes: "",
    expected_delivery: "",
    notes: "",
    items: [{
      inventory_item_id: "",
      item_name: "",
      quantity: 1,
      unit: "",
      is_consumable: false,
      notes: "",
      isManualEntry: false, // Client-side flag for manual vs inventory item
    }] as Array<{
      inventory_item_id: string;
      item_name: string;
      quantity: number;
      unit: string;
      is_consumable: boolean;
      notes: string;
      isManualEntry: boolean;
    }>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [addMaterialForm, setAddMaterialForm] = useState({
    name: "",
    description: "",
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Loading states for different operations
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [approving, setApproving] = useState<string | number | null>(null);
  const [declining, setDeclining] = useState<string | number | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);

  // Team context
  const teamId = user.role === "incubator" ? (user as any).teamId : undefined;
  const isManagerOrDirector =
    user.role === "manager" || user.role === "director";

  // Load materials, teams, and requests on mount
  useEffect(() => {
    if (user) {
      loadMaterials();
      loadRequests();
      if (isManagerOrDirector) {
        loadTeams();
      }
    }
  }, [user]);

  // Reload requests when filters change
  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [statusFilter, priorityFilter, teamFilter, deliveryStatusFilter, startDateFilter, endDateFilter, searchQuery]);

  // Load materials from backend
  const loadMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const data = await withRetry(() => getInventory(), {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          showToast(`Retrying... (${attempt}/3)`, "info", { duration: 2000 });
        },
      });

      // Handle different response formats
      const materialsData = data?.items || data?.data?.items || data || [];
      setMaterials(materialsData);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading materials");
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadTeams = async () => {
    setLoadingTeams(true);
    try {
      const data = await withRetry(() => getIncubators(), {
        maxRetries: 3,
        initialDelay: 1000,
      });
      const teamsData = data?.teams || data?.data?.teams || data || [];
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error: any) {
      console.error("Error loading teams:", error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (teamFilter) params.team_id = teamFilter;
      if (deliveryStatusFilter) params.delivery_status = deliveryStatusFilter;
      if (startDateFilter) params.start_date = startDateFilter;
      if (endDateFilter) params.end_date = endDateFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await withRetry(() => getRequests(params), {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          showToast(`Retrying... (${attempt}/3)`, "info", { duration: 2000 });
        },
      });

      // Handle different response formats
      const requestsData = data?.requests || data?.data?.requests || data || [];
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading material requests");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get priority badge variant
  const getPriorityVariant = (priority: string): "default" | "info" | "warning" | "danger" => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "default";
      case "medium":
        return "info";
      case "high":
        return "warning";
      case "urgent":
        return "danger";
      default:
        return "default";
    }
  };

  // Helper function to get status badge variant
  const getStatusVariant = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "default";
      case "submitted":
        return "info";
      case "pending_review":
      case "pending":
        return "warning";
      case "approved":
      case "delivered":
      case "completed":
        return "success";
      case "partially_approved":
        return "info";
      case "declined":
        return "danger";
      case "cancelled":
        return "default";
      case "ordered":
      case "in_transit":
        return "info";
      case "returned":
        return "warning";
      default:
        return "default";
    }
  };

  // Helper function to format status text
  const formatStatus = (status: string): string => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || status;
  };

  // Helper function to get delivery status badge variant
  const getDeliveryStatusVariant = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
    switch (status?.toLowerCase()) {
      case "not_ordered":
        return "default";
      case "ordered":
      case "in_transit":
        return "info";
      case "delivered":
        return "success";
      case "delayed":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  // Filtered requests for team (already filtered by API, but apply client-side if needed)
  const filteredRequests = useMemo(() => {
    let filtered = requests;
    
    // Apply client-side filtering for incubators (team filter)
    if (user.role === "incubator") {
      filtered = filtered.filter((r) => r.team?.id === teamId || r.team_id === teamId);
    }

    return filtered;
  }, [requests, user.role, teamId]);

  // Table columns - different for managers/directors vs incubators
  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: "request_number",
        label: "Request #",
        className: "font-semibold text-blue-800",
      },
      {
        key: "title",
        label: "Title",
        className: "font-semibold text-blue-800",
      },
      {
        key: "priority",
        label: "Priority",
        className: "text-blue-700",
      },
      {
        key: "status",
        label: "Status",
        className: "text-blue-700",
      },
    ];

    if (isManagerOrDirector) {
      baseColumns.push(
        {
          key: "team",
          label: "Team",
          className: "text-blue-700",
        },
        {
          key: "requester",
          label: "Requester",
          className: "text-blue-700",
        }
      );
    }

    baseColumns.push(
      {
        key: "required_by",
        label: "Required By",
        className: "text-blue-700",
      },
      {
        key: "delivery_status",
        label: "Delivery",
        className: "text-blue-700",
      },
      {
        key: "items_count",
        label: "Items",
        className: "text-blue-700",
      },
      {
        key: "requested_at",
        label: "Requested",
        className: "text-blue-700",
      },
      {
        key: "actions",
        label: "Actions",
        className: "text-blue-700",
      }
    );

    return baseColumns;
  }, [isManagerOrDirector]);

  // Request new material (Incubator only)
  const handleRequestMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!modalForm.title.trim()) {
      showToast("Please enter a request title.", "error");
      return;
    }
    
    if (modalForm.items.length === 0 || !modalForm.items[0].quantity) {
      showToast("Please add at least one item with quantity.", "error");
      return;
    }

    // Validate urgency reason if priority is High or Urgent
    if ((modalForm.priority === "High" || modalForm.priority === "Urgent") && !modalForm.urgency_reason.trim()) {
      showToast("Please provide a reason for high/urgent priority.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare items array
      const items = modalForm.items
        .filter(item => item.quantity > 0)
        .map(item => {
          const itemData: any = {
            quantity: item.quantity,
          };
          
          if (item.isManualEntry) {
            // Manual entry
            itemData.item_name = item.item_name;
            if (item.unit) itemData.unit = item.unit;
          } else {
            // Inventory item
            if (item.inventory_item_id) {
              itemData.inventory_item_id = item.inventory_item_id;
            } else {
              // Fallback: find material by name
              const material = materials.find(m => String(m.id) === item.inventory_item_id);
              if (material) {
                itemData.inventory_item_id = material.id;
              } else {
                itemData.item_name = item.item_name || "Unknown Item";
              }
            }
          }
          
          if (item.is_consumable) itemData.is_consumable = true;
          if (item.notes) itemData.notes = item.notes;
          
          return itemData;
        });

      const requestData: any = {
        title: modalForm.title,
        description: modalForm.description || undefined,
        priority: modalForm.priority,
        urgency_reason: (modalForm.priority === "High" || modalForm.priority === "Urgent") 
          ? modalForm.urgency_reason 
          : undefined,
        required_by: modalForm.required_by || undefined,
        is_consumable_request: modalForm.is_consumable_request,
        requires_quick_approval: modalForm.requires_quick_approval,
        delivery_address: modalForm.delivery_address || undefined,
        delivery_notes: modalForm.delivery_notes || undefined,
        expected_delivery: modalForm.expected_delivery || undefined,
        notes: modalForm.notes || undefined,
        items: items,
      };

      // Add team_id for incubators
      if (user.role === "incubator" && teamId) {
        requestData.team_id = teamId;
      }

      await withRetry(
        () => createRequest(requestData),
        {
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      // Reset form
      setShowModal(false);
      setModalForm({
        title: "",
        description: "",
        priority: "Medium",
        urgency_reason: "",
        required_by: "",
        is_consumable_request: false,
        requires_quick_approval: false,
        delivery_address: "",
        delivery_notes: "",
        expected_delivery: "",
        notes: "",
        items: [{
          inventory_item_id: "",
          item_name: "",
          quantity: 1,
          unit: "",
          is_consumable: false,
          notes: "",
          isManualEntry: false,
        }],
      });
      showToast("Material request submitted!", "success");
      // Reload requests to show the new one
      await loadRequests();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "submitting material request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manager/Director: approve/decline
  const handleAction = async (
    id: string | number,
    action: "approved" | "declined"
  ) => {
    if (action === "approved") {
      setApproving(id);
    } else {
      setDeclining(id);
    }

    try {
      // Keep ID as string (Prisma uses CUID strings, not numbers)
      const requestId = String(id);
      await withRetry(
        () => updateRequestStatus(requestId, { status: action }),
        {
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      // Reload requests to get updated data
      await loadRequests();
      showToast(
        `Request ${action === "approved" ? "approved" : "declined"}!`,
        action === "approved" ? "success" : "info"
      );
    } catch (error: any) {
      ErrorHandler.handleError(
        error,
        showToast,
        `${action === "approved" ? "approving" : "declining"} request`
      );
    } finally {
      setApproving(null);
      setDeclining(null);
    }
  };

  // Manager/Director: add new material
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMaterialForm.name) {
      showToast("Please enter a material name.", "error");
      return;
    }

    setAddingMaterial(true);
    try {
      await withRetry(
        () =>
          createInventoryItem({
            name: addMaterialForm.name,
            description: addMaterialForm.description,
            total_quantity: 1,
            status: "available",
          }),
        {
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      // Reload materials to get updated data
      await loadMaterials();
      setAddMaterialForm({ name: "", description: "" });
      setShowAddMaterial(false);
      showToast("Material added!", "success");
    } catch (error) {
      showToast("Failed to add material", "error");
    } finally {
      setAddingMaterial(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Material Requests
          </h1>
          <div className="text-white opacity-90 mb-2">
            {isManagerOrDirector
              ? "Review and approve material requests from teams."
              : "Request materials for your team and track their status."}
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-900">
              {user.role === "manager" || user.role === "director"
                ? "All Material Requests"
                : "My Material Requests"}
            </h2>
            {user.role === "incubator" && (
              <div className="flex gap-2">
                <ButtonLoader
                  loading={false}
                  onClick={() => navigate("/requests/create")}
                  label="+ Create Request"
                  variant="primary"
                  className="bg-blue-700 hover:bg-blue-800"
                />
                <ButtonLoader
                  loading={false}
                  onClick={() => setShowModal(true)}
                  label="Quick Request"
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                />
              </div>
            )}
            {isManagerOrDirector && (
              <ButtonLoader
                loading={false}
                onClick={() => navigate("/requests/create")}
                label="+ Create Request"
                variant="primary"
                className="bg-blue-700 hover:bg-blue-800"
              />
            )}
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Request # or title..."
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="partially_approved">Partially Approved</option>
                  <option value="declined">Declined</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="ordered">Ordered</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Delivery Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={deliveryStatusFilter}
                  onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="not_ordered">Not Ordered</option>
                  <option value="ordered">Ordered</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Second row of filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Team Filter (Managers/Directors only) */}
              {isManagerOrDirector && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    disabled={loadingTeams}
                  >
                    <option value="">All Teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.team_name || team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                />
              </div>
            </div>

          {/* Clear Filters Button */}
          {(statusFilter || priorityFilter || teamFilter || deliveryStatusFilter || startDateFilter || endDateFilter || searchQuery) && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setTeamFilter("");
                  setDeliveryStatusFilter("");
                  setStartDateFilter("");
                  setEndDateFilter("");
                  setSearchQuery("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Batch Actions */}
        {isManagerOrDirector && selectedRequests.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4 flex items-center justify-between">
            <span className="text-blue-900 font-medium">
              {selectedRequests.size} request(s) selected
            </span>
            <div className="flex gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => setShowBatchApproveModal(true)}
                label={`Approve Selected (${selectedRequests.size})`}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
              />
              <button
                onClick={() => setSelectedRequests(new Set())}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
                  {isManagerOrDirector && (
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={
                          filteredRequests.filter(
                            (r) => r.status === "pending_review" || r.status === "pending"
                          ).length > 0 &&
                          filteredRequests
                            .filter((r) => r.status === "pending_review" || r.status === "pending")
                            .every((r) => selectedRequests.has(String(r.id)))
                        }
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={col.className + " px-4 py-2 text-left"}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="p-4">
                      <PageSkeleton count={3} layout="table" />
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-8 text-blue-400"
                    >
                      {isManagerOrDirector
                        ? "No material requests found."
                        : "No material requests yet."}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const requestId = r.id;
                    const requestNumber = r.request_number || `REQ-${r.id?.slice(0, 8)}`;
                    const title = r.title || r.item_name || "Untitled Request";
                    const priority = r.priority || "Medium";
                    const requestStatus = r.status || "draft";
                    const deliveryStatus = r.delivery_status || "not_ordered";
                    const teamName = r.team?.team_name || r.team?.name || "N/A";
                    const requesterName = r.requester?.name || r.requested_by?.name || "N/A";
                    const requiredBy = r.required_by 
                      ? new Date(r.required_by).toLocaleDateString()
                      : "N/A";
                    const requestedAt = r.requested_at
                      ? new Date(r.requested_at).toLocaleDateString()
                      : "N/A";
                    const itemsCount = r.items?.length || r._count?.items || 0;
                    const isPending = requestStatus === "pending_review" || requestStatus === "pending";
                    const isApproving = approving === requestId;
                    const isDeclining = declining === requestId;

                    return (
                      <tr
                        key={requestId}
                        className="border-b hover:bg-blue-50 transition cursor-pointer"
                        onClick={() => {
                          navigate(`/requests/${requestId}`);
                        }}
                      >
                        <td className="px-4 py-2 text-blue-900 font-mono text-sm">
                          {requestNumber}
                        </td>
                        <td
                          className="px-4 py-2 text-blue-900 font-medium cursor-pointer"
                          onClick={() => navigate(`/requests/${requestId}`)}
                        >
                          {title}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={getPriorityVariant(priority)}>
                            {priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={getStatusVariant(requestStatus)}>
                            {formatStatus(requestStatus)}
                          </Badge>
                        </td>
                        {isManagerOrDirector && (
                          <>
                            <td className="px-4 py-2 text-blue-900">
                              {teamName}
                            </td>
                            <td className="px-4 py-2 text-blue-900">
                              {requesterName}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-blue-900 text-sm">
                          {requiredBy}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={getDeliveryStatusVariant(deliveryStatus)}>
                            {formatStatus(deliveryStatus)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-blue-900 text-center">
                          {itemsCount}
                        </td>
                        <td className="px-4 py-2 text-blue-900 text-sm">
                          {requestedAt}
                        </td>
                        <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                          {isManagerOrDirector && isPending && (
                            <div className="flex items-center gap-2">
                              <Tooltip label={isApproving ? "Approving..." : "Approve"}>
                                <button
                                  onClick={() => handleAction(requestId, "approved")}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isApproving || isDeclining
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "hover:bg-green-100 text-green-700"
                                  }`}
                                  aria-label={isApproving ? "Approving request" : "Approve request"}
                                  disabled={isApproving || isDeclining}
                                >
                                  {isApproving ? (
                                    <Spinner size="sm" color="green" />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip label={isDeclining ? "Declining..." : "Decline"}>
                                <button
                                  onClick={() => handleAction(requestId, "declined")}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isApproving || isDeclining
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "hover:bg-red-100 text-red-700"
                                  }`}
                                  aria-label={isDeclining ? "Declining request" : "Decline request"}
                                  disabled={isApproving || isDeclining}
                                >
                                  {isDeclining ? (
                                    <Spinner size="sm" color="red" />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                  )}
                                </button>
                              </Tooltip>
                            </div>
                          )}
                          {!isPending && (
                            <button
                              onClick={() => {
                                // TODO: Open detail view
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Request Material Modal */}
        <Modal
          title="Request New Material"
          open={showModal}
          onClose={() => setShowModal(false)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleRequestMaterial} className="max-h-[80vh] overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Request Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.title}
                onChange={(e) =>
                  setModalForm((f) => ({ ...f, title: e.target.value }))
                }
                disabled={isSubmitting}
                required
                placeholder="e.g., Request for Laptops"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.description}
                onChange={(e) =>
                  setModalForm((f) => ({ ...f, description: e.target.value }))
                }
                disabled={isSubmitting}
                rows={3}
                placeholder="Optional description of the request"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-semibold text-blue-800">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  value={modalForm.priority}
                  onChange={(e) =>
                    setModalForm((f) => ({ ...f, priority: e.target.value, urgency_reason: (e.target.value === "High" || e.target.value === "Urgent") ? f.urgency_reason : "" }))
                  }
                  disabled={isSubmitting}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold text-blue-800">
                  Required By
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  value={modalForm.required_by}
                  onChange={(e) =>
                    setModalForm((f) => ({ ...f, required_by: e.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Urgency Reason (if High/Urgent) */}
            {(modalForm.priority === "High" || modalForm.priority === "Urgent") && (
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">
                  Urgency Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  value={modalForm.urgency_reason}
                  onChange={(e) =>
                    setModalForm((f) => ({ ...f, urgency_reason: e.target.value }))
                  }
                  disabled={isSubmitting}
                  required
                  rows={2}
                  placeholder="Please explain why this request is urgent"
                />
              </div>
            )}

            {/* Items Section */}
            <div className="mb-4 border-t pt-4">
              <label className="block mb-2 font-semibold text-blue-800">
                Item(s) <span className="text-red-500">*</span>
              </label>
              {modalForm.items.map((item, index) => (
                <div key={index} className="mb-4 p-3 bg-gray-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-800">Item {index + 1}</span>
                    {modalForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalForm((f) => ({
                            ...f,
                            items: f.items.filter((_, i) => i !== index),
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Toggle between inventory item and manual entry */}
                  <div className="mb-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.isManualEntry}
                        onChange={(e) => {
                          const newItems = [...modalForm.items];
                          newItems[index].isManualEntry = e.target.checked;
                          if (!e.target.checked) {
                            newItems[index].item_name = "";
                          }
                          setModalForm((f) => ({ ...f, items: newItems }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-blue-700">Manual Entry</span>
                    </label>
                  </div>

                  {item.isManualEntry ? (
                    <>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-blue-700">Item Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                          value={item.item_name}
                          onChange={(e) => {
                            const newItems = [...modalForm.items];
                            newItems[index].item_name = e.target.value;
                            setModalForm((f) => ({ ...f, items: newItems }));
                          }}
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-blue-700">Material</label>
                      <select
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                        value={item.inventory_item_id}
                        onChange={(e) => {
                          const newItems = [...modalForm.items];
                          newItems[index].inventory_item_id = e.target.value;
                          const material = materials.find(m => String(m.id) === e.target.value);
                          if (material) {
                            newItems[index].item_name = material.name;
                          }
                          setModalForm((f) => ({ ...f, items: newItems }));
                        }}
                        disabled={isSubmitting || loadingMaterials}
                        required
                      >
                        <option value="">Select material...</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Quantity</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...modalForm.items];
                          newItems[index].quantity = Number(e.target.value) || 1;
                          setModalForm((f) => ({ ...f, items: newItems }));
                        }}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Unit</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                        value={item.unit}
                        onChange={(e) => {
                          const newItems = [...modalForm.items];
                          newItems[index].unit = e.target.value;
                          setModalForm((f) => ({ ...f, items: newItems }));
                        }}
                        disabled={isSubmitting}
                        placeholder="e.g., pcs, boxes"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.is_consumable}
                        onChange={(e) => {
                          const newItems = [...modalForm.items];
                          newItems[index].is_consumable = e.target.checked;
                          setModalForm((f) => ({ ...f, items: newItems }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-blue-700">Is Consumable</span>
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setModalForm((f) => ({
                    ...f,
                    items: [...f.items, {
                      inventory_item_id: "",
                      item_name: "",
                      quantity: 1,
                      unit: "",
                      is_consumable: false,
                      notes: "",
                      isManualEntry: false,
                    }],
                  }));
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                + Add Another Item
              </button>
            </div>

            {/* Request Options */}
            <div className="mb-4 border-t pt-4">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={modalForm.is_consumable_request}
                    onChange={(e) =>
                      setModalForm((f) => ({ ...f, is_consumable_request: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-blue-800">Is Consumable Request</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={modalForm.requires_quick_approval}
                    onChange={(e) =>
                      setModalForm((f) => ({ ...f, requires_quick_approval: e.target.checked }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-blue-800">Requires Quick Approval</span>
                </label>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="mb-4 border-t pt-4">
              <h3 className="font-semibold text-blue-800 mb-2">Delivery Information</h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-blue-700">Delivery Address</label>
                <textarea
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={modalForm.delivery_address}
                  onChange={(e) =>
                    setModalForm((f) => ({ ...f, delivery_address: e.target.value }))
                  }
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-blue-700">Delivery Notes</label>
                <textarea
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={modalForm.delivery_notes}
                  onChange={(e) =>
                    setModalForm((f) => ({ ...f, delivery_notes: e.target.value }))
                  }
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700">Expected Delivery Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                  value={modalForm.expected_delivery}
                  onChange={(e) =>
                    setModalForm((f) => ({ ...f, expected_delivery: e.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Additional Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.notes}
                onChange={(e) =>
                  setModalForm((f) => ({ ...f, notes: e.target.value }))
                }
                disabled={isSubmitting}
                rows={3}
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
                loading={isSubmitting}
                label="Submit Request"
                loadingText="Submitting..."
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              />
            </div>
          </form>
        </Modal>
        {/* Add Material Modal (Manager) */}
        <Modal
          title="Add New Material"
          open={showAddMaterial}
          onClose={() => setShowAddMaterial(false)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleAddMaterial}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Material Name
              </label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addMaterialForm.name}
                onChange={(e) =>
                  setAddMaterialForm((f) => ({ ...f, name: e.target.value }))
                }
                disabled={addingMaterial}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addMaterialForm.description}
                onChange={(e) =>
                  setAddMaterialForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                disabled={addingMaterial}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                loading={false}
                onClick={() => setShowAddMaterial(false)}
                label="Cancel"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={addingMaterial}
                label="Add Material"
                loadingText="Adding..."
                variant="primary"
                type="submit"
                disabled={addingMaterial}
              />
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default MaterialPage;
