import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Tooltip from "../components/Tooltip";
import { Spinner } from "../components/loading/Spinner";
import {
  getRequests,
  updateRequestStatus,
  createRequest,
  getInventory,
  createInventoryItem,
} from "../services/api";

const MaterialPage = () => {
  const { user } = useAuth();
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
  const [requests, setRequests] = useState<any[]>([]); // { id, materialId, name, description, status, date, note, quantity, teamId }
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    materialId: "",
    note: "",
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [addMaterialForm, setAddMaterialForm] = useState({
    name: "",
    description: "",
  });

  // Loading states for different operations
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [approving, setApproving] = useState<string | number | null>(null);
  const [declining, setDeclining] = useState<string | number | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);

  // Team context
  const teamId = user.role === "incubator" ? (user as any).teamId : undefined;
  const isManagerOrDirector =
    user.role === "manager" || user.role === "director";

  // Load materials and requests on mount
  useEffect(() => {
    if (user) {
      loadMaterials();
      loadRequests();
    }
  }, [user]);

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

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await withRetry(() => getRequests(), {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt) => {
          showToast(`Retrying... (${attempt}/3)`, "info", { duration: 2000 });
        },
      });

      // Handle different response formats
      const requestsData = data?.requests || data?.data?.requests || data || [];
      setRequests(requestsData);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading material requests");
    } finally {
      setLoading(false);
    }
  };

  // Filtered requests for team
  const teamRequests =
    user.role === "incubator"
      ? requests.filter((r) => r.team?.id === teamId || r.team_id === teamId)
      : requests;

  // Table columns - different for managers/directors vs incubators
  const columns = isManagerOrDirector
    ? [
        {
          key: "team",
          label: "Team",
          className: "font-semibold text-blue-800",
        },
        {
          key: "name",
          label: "Material",
          className: "font-semibold text-blue-800",
        },
        {
          key: "description",
          label: "Description",
          className: "text-blue-700",
        },
        { key: "status", label: "Status", className: "text-blue-700" },
        { key: "date", label: "Date", className: "text-blue-700" },
        { key: "quantity", label: "Qty", className: "text-blue-700" },
        { key: "note", label: "Note", className: "text-blue-700" },
        { key: "actions", label: "Actions", className: "text-blue-700" },
      ]
    : [
        {
          key: "name",
          label: "Material",
          className: "font-semibold text-blue-800",
        },
        {
          key: "description",
          label: "Description",
          className: "text-blue-700",
        },
        { key: "status", label: "Status", className: "text-blue-700" },
        { key: "date", label: "Date", className: "text-blue-700" },
        { key: "quantity", label: "Qty", className: "text-blue-700" },
        { key: "note", label: "Note", className: "text-blue-700" },
        { key: "actions", label: "Actions", className: "text-blue-700" },
      ];

  // Request new material (Incubator only)
  const handleRequestMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.materialId) {
      showToast("Please select a material.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const material = materials.find(
        (m) => String(m.id) === String(modalForm.materialId)
      );
      if (!material) {
        showToast("Material not found.", "error");
        setIsSubmitting(false);
        return;
      }
      await withRetry(
        () =>
          createRequest({
            item_name: material.name,
            description: material.description || '',
            notes: modalForm.note || undefined,
            quantity: modalForm.quantity || undefined,
          }),
        {
          maxRetries: 3,
          initialDelay: 1000,
        }
      );

      setShowModal(false);
      setModalForm({ materialId: "", note: "", quantity: 1 });
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
              <ButtonLoader
                loading={false}
                onClick={() => setShowModal(true)}
                label="+ Request Material"
                variant="primary"
                className="bg-blue-700 hover:bg-blue-800"
              />
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
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
                ) : teamRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-8 text-blue-400"
                    >
                      {isManagerOrDirector
                        ? "No pending material requests to review."
                        : "No material requests yet."}
                    </td>
                  </tr>
                ) : (
                  teamRequests.map((r, idx) => {
                    const requestId = r.id;
                    const itemName = r.item_name || r.name || "N/A";
                    const itemDescription = r.description || "N/A";
                    const requestStatus = r.status || "pending";
                    const requestDate = r.requested_at
                      ? new Date(r.requested_at).toLocaleDateString()
                      : r.date || "N/A";
                    const requestQuantity = r.quantity || 1;
                    const requestNote = r.notes || r.note || "";
                    const teamName = r.team?.team_name || r.team_name || "N/A";
                    const isPending =
                      requestStatus === "pending" ||
                      requestStatus === "Pending";
                    const isApproving = approving === requestId;
                    const isDeclining = declining === requestId;

                    return (
                      <tr
                        key={requestId}
                        className="border-b hover:bg-blue-50 transition"
                      >
                        {isManagerOrDirector && (
                          <td className="px-4 py-2 text-blue-900 font-medium">
                            {teamName}
                          </td>
                        )}
                        <td className="px-4 py-2 text-blue-900">{itemName}</td>
                        <td className="px-4 py-2 text-blue-900">
                          {itemDescription}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              requestStatus === "approved" ||
                              requestStatus === "Approved"
                                ? "bg-green-100 text-green-700"
                                : requestStatus === "declined" ||
                                  requestStatus === "Declined"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {requestStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-blue-900">
                          {requestDate}
                        </td>
                        <td className="px-4 py-2 text-blue-900">
                          {requestQuantity}
                        </td>
                        <td className="px-4 py-2 text-blue-900">
                          {requestNote}
                        </td>
                        <td className="px-4 py-2">
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
          <form onSubmit={handleRequestMaterial}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Material
              </label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.materialId}
                onChange={(e) =>
                  setModalForm((f) => ({ ...f, materialId: e.target.value }))
                }
                disabled={isSubmitting || loadingMaterials}
                required
              >
                <option value="">
                  {loadingMaterials
                    ? "Loading materials..."
                    : "Select material..."}
                </option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.quantity}
                onChange={(e) =>
                  setModalForm((f) => ({
                    ...f,
                    quantity: Number(e.target.value),
                  }))
                }
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">
                Note (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.note}
                onChange={(e) =>
                  setModalForm((f) => ({ ...f, note: e.target.value }))
                }
                disabled={isSubmitting}
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
