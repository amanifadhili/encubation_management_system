import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";

// Mocked available materials (would be managed by manager in real app)
const initialMaterials = [
  { id: 1, name: "Coffee Maker", description: "Automatic drip coffee machine." },
  { id: 2, name: "Office Chair", description: "Ergonomic adjustable chair." },
  { id: 3, name: "Computer", description: "Desktop PC with monitor." },
  { id: 4, name: "Table", description: "Large office table." },
  { id: 5, name: "Coffee Cups", description: "Set of 6 ceramic cups." },
];

const MaterialPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  if (!user || (user.role !== "incubator" && user.role !== "manager" && user.role !== "director")) return <div className="text-red-600 font-semibold">Access denied.</div>;

  // State
  const [materials, setMaterials] = useState(initialMaterials);
  const [requests, setRequests] = useState<any[]>([]); // { id, materialId, name, description, status, date, note, quantity, teamId }
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({ materialId: "", note: "", quantity: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [addMaterialForm, setAddMaterialForm] = useState({ name: "", description: "" });
  
  // Loading states for different operations
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);

  // Team context
  const teamId = user.role === "incubator" ? (user as any).teamId : undefined;

  // Filtered requests for team
  const teamRequests = user.role === "incubator"
    ? requests.filter(r => r.teamId === teamId)
    : requests;

  // Table columns
  const columns = [
    { key: "name", label: "Material", className: "font-semibold text-blue-800" },
    { key: "description", label: "Description", className: "text-blue-700" },
    { key: "status", label: "Status", className: "text-blue-700" },
    { key: "date", label: "Date", className: "text-blue-700" },
    { key: "quantity", label: "Qty", className: "text-blue-700" },
    { key: "note", label: "Note", className: "text-blue-700" },
    { key: "actions", label: "Actions", className: "text-blue-700" },
  ];

  // Request new material
  const handleRequestMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.materialId) {
      showToast("Please select a material.", "error");
      return;
    }
    setIsSubmitting(true);
    const material = materials.find(m => m.id === Number(modalForm.materialId));
    setTimeout(() => {
      setRequests(prev => [
        ...prev,
        {
          id: Math.max(0, ...prev.map(r => r.id)) + 1,
          materialId: material.id,
          name: material.name,
          description: material.description,
          status: "Requested",
          date: new Date().toISOString().slice(0, 10),
          note: modalForm.note,
          quantity: modalForm.quantity,
          teamId,
        },
      ]);
      setShowModal(false);
      setIsSubmitting(false);
      setModalForm({ materialId: "", note: "", quantity: 1 });
      showToast("Material request submitted!", "success");
    }, 700);
  };

  // Manager: approve/decline
  const handleAction = async (id: number, action: "Given" | "Declined") => {
    if (action === "Given") {
      setApproving(true);
    } else {
      setDeclining(true);
    }
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      showToast(`Request ${action === "Given" ? "approved" : "declined"}!`, action === "Given" ? "success" : "error");
    } catch (error) {
      showToast(`Failed to ${action === "Given" ? "approve" : "decline"} request`, "error");
    } finally {
      setApproving(false);
      setDeclining(false);
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
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setMaterials(prev => [
        ...prev,
        {
          id: Math.max(0, ...prev.map(m => m.id)) + 1,
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Material Requests</h1>
          <div className="text-white opacity-90 mb-2">Request materials for your team and track their status.</div>
        </div>
        {/* Manager/Director: Add new material */}
        {(user.role === "manager" || user.role === "director") && (
          <div className="mb-6 flex justify-end">
            <ButtonLoader
              loading={false}
              onClick={() => setShowAddMaterial(true)}
              label="+ Add Material"
              variant="primary"
              className="bg-blue-700 hover:bg-blue-800"
            />
          </div>
        )}
        {/* Table */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-900">{(user.role === "manager" || user.role === "director") ? "All Material Requests" : "My Material Requests"}</h2>
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
                  {columns.map(col => (
                    <th key={col.key} className={col.className + " px-4 py-2 text-left"}>{col.label}</th>
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
                    <td colSpan={columns.length} className="text-center py-8 text-blue-400">No material requests yet.</td>
                  </tr>
                ) : (
                  teamRequests.map((r, idx) => (
                    <tr key={r.id} className="border-b hover:bg-blue-50 transition">
                      <td className="px-4 py-2 text-blue-900">{r.name}</td>
                      <td className="px-4 py-2 text-blue-900">{r.description}</td>
                      <td className="px-4 py-2 text-blue-900">{r.status}</td>
                      <td className="px-4 py-2 text-blue-900">{r.date}</td>
                      <td className="px-4 py-2 text-blue-900">{r.quantity}</td>
                      <td className="px-4 py-2 text-blue-900">{r.note}</td>
                      <td className="px-4 py-2">
                        {(user.role === "manager" || user.role === "director") && r.status === "Requested" && (
                          <div className="flex gap-2">
                            <ButtonLoader
                              loading={approving}
                              onClick={() => handleAction(r.id, "Given")}
                              label="Approve"
                              loadingText="Approving..."
                              variant="success"
                              size="sm"
                              className="bg-green-100 text-green-700 hover:bg-green-200"
                              disabled={approving || declining}
                            />
                            <ButtonLoader
                              loading={declining}
                              onClick={() => handleAction(r.id, "Declined")}
                              label="Decline"
                              loadingText="Declining..."
                              variant="danger"
                              size="sm"
                              className="bg-red-100 text-red-700 hover:bg-red-200"
                              disabled={approving || declining}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
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
              <label className="block mb-1 font-semibold text-blue-800">Material</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.materialId}
                onChange={e => setModalForm(f => ({ ...f, materialId: e.target.value }))}
                disabled={isSubmitting}
                required
              >
                <option value="">Select material...</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Quantity</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.quantity}
                onChange={e => setModalForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Note (optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={modalForm.note}
                onChange={e => setModalForm(f => ({ ...f, note: e.target.value }))}
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
              <label className="block mb-1 font-semibold text-blue-800">Material Name</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addMaterialForm.name}
                onChange={e => setAddMaterialForm(f => ({ ...f, name: e.target.value }))}
                disabled={addingMaterial}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={addMaterialForm.description}
                onChange={e => setAddMaterialForm(f => ({ ...f, description: e.target.value }))}
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