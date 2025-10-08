import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { getInventory } from "../services/api";

const StockManagement = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
                    <h3 className="text-lg font-bold text-blue-900 mb-2">{item.name}</h3>
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
      </div>
    </div>
  );
};

export default StockManagement; 