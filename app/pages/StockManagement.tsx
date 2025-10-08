import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../services/api";

const StockManagement = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    description: "",
    total_quantity: 1,
    status: "available"
  });

  const isManager = user?.role === "manager";

  // Load inventory on mount
  useEffect(() => {
    if (user) {
      loadInventory();
    }
  }, [user]);

  const loadInventory = async () => {
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered inventory
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setForm({ id: 0, name: "", description: "", total_quantity: 1, status: "available" });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      total_quantity: item.total_quantity,
      status: item.status
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'total_quantity' ? parseInt(value) || 1 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      showToast("Please enter item name.", "error");
      return;
    }

    try {
      if (isEdit) {
        await updateInventoryItem(form.id, {
          name: form.name,
          description: form.description,
          total_quantity: form.total_quantity,
          status: form.status
        });
        setInventory(prev => prev.map(item =>
          item.id === form.id ? { ...item, ...form } : item
        ));
        showToast("Inventory item updated!", "success");
      } else {
        const result = await createInventoryItem({
          name: form.name,
          description: form.description,
          total_quantity: form.total_quantity,
          status: form.status
        });
        if (result.success && result.data?.item) {
          setInventory(prev => [...prev, result.data.item]);
        }
        showToast("Inventory item created!", "success");
      }
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to save inventory item:', error);
      showToast(error.response?.data?.message || 'Failed to save inventory item', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this inventory item?")) {
      try {
        await deleteInventoryItem(id);
        setInventory(prev => prev.filter(item => item.id !== id));
        showToast("Inventory item deleted!", "success");
      } catch (error: any) {
        console.error('Failed to delete inventory item:', error);
        showToast(error.response?.data?.message || 'Failed to delete inventory item', 'error');
      }
    }
  };

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
          </div>
          {isManager && (
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition"
              onClick={openAddModal}
            >
              + Add Inventory Item
            </button>
          )}
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Inventory Items</h2>
          {loading ? (
            <div className="text-center py-8 text-blue-400">Loading inventory...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.length === 0 ? (
                <div className="col-span-full text-center text-blue-400 py-12">No items found.</div>
              ) : (
                filteredInventory.map((item: any) => (
                  <div key={item.id} className="bg-gray-50 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-blue-900">{item.name}</h3>
                      {isManager && (
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-blue-700 mb-1">
                      <span className="font-semibold">Total:</span> {item.total_quantity}
                    </div>
                    <div className="text-blue-700 mb-1">
                      <span className="font-semibold">Available:</span> {item.available_quantity}
                    </div>
                    <div className="text-blue-700">
                      <span className="font-semibold">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Inventory Item Modal */}
        <Modal
          title={isEdit ? "Edit Inventory Item" : "Add Inventory Item"}
          open={showModal && isManager}
          onClose={() => setShowModal(false)}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Item Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                rows={3}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Total Quantity *</label>
              <input
                name="total_quantity"
                type="number"
                min={1}
                value={form.total_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEdit ? "Update Item" : "Create Item"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default StockManagement;