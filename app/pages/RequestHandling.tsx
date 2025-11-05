import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  getRequests,
  updateRequestStatus,
  createRequest,
} from "../services/api";

// Mocked available materials (would be managed by manager in real app)
const initialMaterials = [
  {
    id: 1,
    name: "Coffee Maker",
    description: "Automatic drip coffee machine.",
  },
  { id: 2, name: "Office Chair", description: "Ergonomic adjustable chair." },
  { id: 3, name: "Computer", description: "Desktop PC with monitor." },
  { id: 4, name: "Table", description: "Large office table." },
  { id: 5, name: "Coffee Cups", description: "Set of 6 ceramic cups." },
];

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
  const [materials, setMaterials] = useState(initialMaterials);
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
  const [approving, setApproving] = useState<number | null>(null);
  const [declining, setDeclining] = useState<number | null>(null);
  const [addingMaterial, setAddingMaterial] = useState(false);

  // Team context
  const teamId = user.role === "incubator" ? (user as any).teamId : undefined;
  const isManagerOrDirector =
    user.role === "manager" || user.role === "director";

  // Load requests on mount
  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

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
        (m) => m.id === Number(modalForm.materialId)
      );
      await withRetry(
        () =>
          createRequest({
            item_name: material.name,
            description: material.description,
            notes: modalForm.note,
            quantity: modalForm.quantity,
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
      await withRetry(() => updateRequestStatus(id, { status: action }), {
        maxRetries: 3,
        initialDelay: 1000,
      });

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

  // Manager: add new material
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMaterialForm.name) {
      showToast("Please enter a material name.", "error");
      return;
    }

    setAddingMaterial(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      setMaterials((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((m) => m.id)) + 1,
          name: addMaterialForm.name,
          description: addMaterialForm.description,
        },
      ]);
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
                            <div className="flex gap-2">
                              <ButtonLoader
                                loading={isApproving}
                                onClick={() =>
                                  handleAction(requestId, "approved")
                                }
                                label="Approve"
                                loadingText="Approving..."
                                variant="success"
                                size="sm"
                                className="bg-green-100 text-green-700 hover:bg-green-200"
                                disabled={isApproving || isDeclining}
                              />
                              <ButtonLoader
                                loading={isDeclining}
                                onClick={() =>
                                  handleAction(requestId, "declined")
                                }
                                label="Decline"
                                loadingText="Declining..."
                                variant="danger"
                                size="sm"
                                className="bg-red-100 text-red-700 hover:bg-red-200"
                                disabled={isApproving || isDeclining}
                              />
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
                disabled={isSubmitting}
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
