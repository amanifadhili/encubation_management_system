import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { incubators, tools as mockTools } from "../mock/sampleData";
import Modal from "../components/Modal";
import Button from "../components/Button";

const StockManagement = () => {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const isIncubator = user?.role === "incubator";
  // Local state for tools
  const [tools, setTools] = useState(mockTools);
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", total: 1, status: "available" });
  const [assignIdx, setAssignIdx] = useState<number | null>(null);
  const [assignTeam, setAssignTeam] = useState("");
  const [assignQty, setAssignQty] = useState(1);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  // Search and filter logic
  const filteredTools = tools.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Open add/edit modal
  const openModal = (idx: number | null = null) => {
    setEditIdx(idx);
    if (idx !== null) {
      setForm({ name: tools[idx].name, total: tools[idx].total, status: tools[idx].status });
    } else {
      setForm({ name: "", total: 1, status: "available" });
    }
    setShowModal(true);
  };

  // Save add/edit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.total < 1) return;
    if (editIdx !== null) {
      setTools(prev => prev.map((t, i) => i === editIdx ? { ...t, name: form.name, total: form.total, status: form.status } : t));
    } else {
      setTools(prev => [
        ...prev,
        {
          id: Math.max(0, ...prev.map(t => t.id)) + 1,
          name: form.name,
          total: form.total,
          assigned: [],
          status: form.status,
        },
      ]);
    }
    setShowModal(false);
    setEditIdx(null);
    setForm({ name: "", total: 1, status: "available" });
  };

  // Delete tool (with confirmation)
  const handleDelete = (idx: number) => {
    setDeleteIdx(idx);
  };
  const confirmDelete = () => {
    if (deleteIdx === null) return;
    setTools(prev => prev.filter((_, i) => i !== deleteIdx));
    setDeleteIdx(null);
  };
  const cancelDelete = () => setDeleteIdx(null);

  // Assign tool to team
  const handleAssign = (idx: number) => {
    setAssignIdx(idx);
    setAssignTeam("");
    setAssignQty(1);
  };
  const handleAssignSave = () => {
    if (!assignTeam || assignQty < 1) return;
    setTools(prev => prev.map((t, i) => {
      if (i !== assignIdx) return t;
      // Check if already assigned to this team
      const existing = t.assigned.find((a: any) => a.teamId === Number(assignTeam));
      let newAssigned;
      if (existing) {
        newAssigned = t.assigned.map((a: any) => a.teamId === Number(assignTeam) ? { ...a, quantity: a.quantity + assignQty } : a);
      } else {
        newAssigned = [...t.assigned, { teamId: Number(assignTeam), quantity: assignQty }];
      }
      return { ...t, assigned: newAssigned };
    }));
    setAssignIdx(null);
    setAssignTeam("");
    setAssignQty(1);
  };
  // View More modal
  const handleViewMore = (idx: number) => {
    setViewIdx(idx);
  };
  // Unassign tool from team
  const handleUnassign = (toolIdx: number, teamId: number) => {
    setTools(prev => prev.map((t, i) => {
      if (i !== toolIdx) return t;
      return { ...t, assigned: t.assigned.filter((a: any) => a.teamId !== teamId) };
    }));
  };

  // Table columns: Item Name, Total Items, Assigned Items, Available Items, View More, Actions
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
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          {isManager && (
            <button
              className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
              onClick={() => openModal(null)}
            >
              + Add Item
            </button>
          )}
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Inventory Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-blue-900">Item Name</th>
                  <th className="px-4 py-2 text-left text-blue-900">Total Items</th>
                  <th className="px-4 py-2 text-left text-blue-900">Assigned Items</th>
                  <th className="px-4 py-2 text-left text-blue-900">Available Items</th>
                  <th className="px-4 py-2 text-left text-blue-900">View More</th>
                  {isManager && <th className="px-4 py-2 text-left text-blue-900">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 6 : 5} className="text-center py-8 text-blue-400">No items found. Try adjusting your search or filters.</td>
                  </tr>
                ) : (
                  filteredTools.map((t, idx) => {
                    const assignedCount = t.assigned.reduce((sum: number, a: any) => sum + a.quantity, 0);
                    const availableCount = t.total - assignedCount;
                    return (
                      <tr key={t.id} className="border-b hover:bg-blue-50 transition">
                        <td className="px-4 py-2 text-blue-900 font-semibold">{t.name}</td>
                        <td className="px-4 py-2 text-blue-900">{t.total}</td>
                        <td className="px-4 py-2 text-blue-900">{assignedCount}</td>
                        <td className="px-4 py-2 text-blue-900">{availableCount}</td>
                        <td className="px-4 py-2">
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            onClick={() => handleViewMore(tools.indexOf(t))}
                          >View More</button>
                        </td>
                        {isManager && (
                          <td className="px-4 py-2 flex gap-2 flex-wrap">
                            <button
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => openModal(tools.indexOf(t))}
                            >Edit</button>
                            <button
                              className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              onClick={() => handleAssign(tools.indexOf(t))}
                            >Assign</button>
                            <button
                              className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              onClick={() => handleDelete(tools.indexOf(t))}
                            >Delete</button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Add/Edit Modal */}
        <Modal
          title={editIdx !== null ? "Edit Item" : "Add New Item"}
          open={showModal}
          onClose={() => { setShowModal(false); setEditIdx(null); }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Name</label>
              <input
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Number in Stock</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.total}
                onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Availability Status</label>
              <select
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditIdx(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </form>
        </Modal>
        {/* Assign Modal */}
        <Modal
          title="Assign Item to Team"
          open={assignIdx !== null}
          onClose={() => setAssignIdx(null)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Select Team</label>
            <select
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={assignTeam}
              onChange={e => setAssignTeam(e.target.value)}
            >
              <option value="">Select...</option>
              {incubators.map(t => (
                <option key={t.id} value={t.id}>{t.teamName}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Quantity to Assign</label>
            <input
              type="number"
              min={1}
              max={assignIdx !== null ? tools[assignIdx].total - tools[assignIdx].assigned.reduce((sum: number, a: any) => sum + a.quantity, 0) : 1}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={assignQty}
              onChange={e => setAssignQty(Number(e.target.value))}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setAssignIdx(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignSave}
              disabled={!assignTeam || assignQty < 1 || (assignIdx !== null && assignQty > tools[assignIdx].total - tools[assignIdx].assigned.reduce((sum: number, a: any) => sum + a.quantity, 0))}
            >
              Assign
            </Button>
          </div>
        </Modal>
        {/* View More Modal */}
        <Modal
          title={viewIdx !== null ? `Teams Assigned: ${tools[viewIdx].name}` : "Teams Assigned"}
          open={viewIdx !== null}
          onClose={() => setViewIdx(null)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {viewIdx !== null && (
            <>
              {tools[viewIdx].assigned.length === 0 ? (
                <div className="text-blue-400">No teams have this item assigned.</div>
              ) : (
                <ul className="space-y-2">
                  {tools[viewIdx].assigned.map((a: any) => {
                    const team = incubators.find(t => t.id === a.teamId);
                    return (
                      <li key={a.teamId} className="flex justify-between items-center border-b pb-1">
                        <span className="font-semibold text-blue-900">{team ? team.teamName : `Team #${a.teamId}`}</span>
                        <span className="text-blue-700">Qty: {a.quantity}</span>
                        {isManager && (
                          <Button
                            variant="secondary"
                            className="ml-2 text-xs"
                            type="button"
                            onClick={() => handleUnassign(viewIdx, a.teamId)}
                          >Unassign</Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" type="button" onClick={() => setViewIdx(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal>
        {/* Delete Confirmation Modal */}
        <Modal
          title="Delete Item"
          open={deleteIdx !== null}
          onClose={cancelDelete}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          {deleteIdx !== null && (
            <>
              <div className="mb-6 text-blue-900">Are you sure you want to delete <span className="font-semibold">{tools[deleteIdx].name}</span>? This action cannot be undone.</div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" type="button" onClick={cancelDelete}>
                  Cancel
                </Button>
                <Button variant="danger" type="button" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default StockManagement; 