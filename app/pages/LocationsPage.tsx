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
  getAllLocations,
  getLocationHierarchy,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getInventory
} from "../services/api";

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

interface LocationNode {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  shelf?: string;
  bin?: string;
  parent_location_id?: string;
  parent?: LocationNode;
  children?: LocationNode[];
  items_count?: number;
}

const LocationsPage = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [hierarchy, setHierarchy] = useState<LocationNode[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedParent, setSelectedParent] = useState<string>("");

  const isManager = user?.role === "manager" || user?.role === "director";

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationsData, hierarchyData, inventoryData] = await Promise.all([
        withRetry(() => getAllLocations(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getLocationHierarchy(), { maxRetries: 3, initialDelay: 1000 }),
        withRetry(() => getInventory(), { maxRetries: 3, initialDelay: 1000 })
      ]);
      
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setHierarchy(Array.isArray(hierarchyData) ? hierarchyData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading locations');
    } finally {
      setLoading(false);
    }
  };

  // Calculate items count per location
  const locationsWithCounts = useMemo(() => {
    const countMap = new Map<string, number>();
    inventory.forEach(item => {
      if (item.location_id) {
        countMap.set(item.location_id, (countMap.get(item.location_id) || 0) + 1);
      }
    });

    return locations.map(loc => ({
      ...loc,
      items_count: countMap.get(loc.id) || 0
    }));
  }, [locations, inventory]);

  // Get unique buildings for filter
  const buildings = useMemo(() => {
    const buildingSet = new Set<string>();
    locations.forEach(loc => {
      if (loc.building) buildingSet.add(loc.building);
    });
    return Array.from(buildingSet).sort();
  }, [locations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    let filtered = locationsWithCounts;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(searchLower) ||
        loc.building?.toLowerCase().includes(searchLower) ||
        loc.floor?.toLowerCase().includes(searchLower) ||
        loc.room?.toLowerCase().includes(searchLower)
      );
    }

    if (buildingFilter) {
      filtered = filtered.filter(loc => loc.building === buildingFilter);
    }

    return filtered;
  }, [locationsWithCounts, search, buildingFilter]);

  // Recursive function to render tree nodes
  const renderTreeNode = (node: LocationNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 24;

    const toggleExpand = () => {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (isExpanded) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
    };

    const fullPath = [
      node.building,
      node.floor,
      node.room,
      node.shelf,
      node.bin
    ].filter(Boolean).join(" > ");

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 p-2 hover:bg-gray-50 border-b ${level === 0 ? 'bg-gray-50' : ''}`}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          {hasChildren ? (
            <button
              onClick={toggleExpand}
              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{node.name}</div>
            {fullPath && (
              <div className="text-xs text-gray-500">{fullPath}</div>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {node.items_count !== undefined && (
              <Badge variant={node.items_count > 0 ? "info" : "default"}>
                {node.items_count} item{node.items_count !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {isManager && (
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(node)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Edit location"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => openDeleteModal(node)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete location"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Expand all by default when hierarchy loads
  useEffect(() => {
    if (hierarchy.length > 0 && expandedNodes.size === 0) {
      const allIds = new Set<string>();
      const collectIds = (nodes: LocationNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(hierarchy);
      setExpandedNodes(allIds);
    }
  }, [hierarchy]);

  // Flatten hierarchy for tree view
  const renderTreeView = () => {
    if (hierarchy.length === 0) {
      return <div className="p-8 text-center text-gray-500">No locations found</div>;
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {hierarchy.map(root => renderTreeNode(root, 0))}
      </div>
    );
  };

  const [form, setForm] = useState({
    name: "",
    building: "",
    floor: "",
    room: "",
    shelf: "",
    bin: "",
    parent_location_id: ""
  });

  const openAddModal = () => {
    setIsEdit(false);
    setSelectedLocation(null);
    setForm({
      name: "",
      building: "",
      floor: "",
      room: "",
      shelf: "",
      bin: "",
      parent_location_id: ""
    });
    setShowModal(true);
  };

  const openEditModal = (location: LocationNode) => {
    setIsEdit(true);
    setSelectedLocation(location);
    setForm({
      name: location.name || "",
      building: location.building || "",
      floor: location.floor || "",
      room: location.room || "",
      shelf: location.shelf || "",
      bin: location.bin || "",
      parent_location_id: location.parent_location_id || ""
    });
    setShowModal(true);
  };

  const openDeleteModal = (location: LocationNode) => {
    setSelectedLocation(location);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Location name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: form.name.trim(),
        building: form.building.trim() || undefined,
        floor: form.floor.trim() || undefined,
        room: form.room.trim() || undefined,
        shelf: form.shelf.trim() || undefined,
        bin: form.bin.trim() || undefined,
        parent_location_id: form.parent_location_id || undefined
      };

      if (isEdit && selectedLocation) {
        await updateLocation(selectedLocation.id, data);
        showToast("Location updated successfully!", "success");
      } else {
        await createLocation(data);
        showToast("Location created successfully!", "success");
      }

      setShowModal(false);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, isEdit ? 'updating location' : 'creating location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocation) return;

    // Check if location has items
    const itemsInLocation = inventory.filter(item => item.location_id === selectedLocation.id);
    if (itemsInLocation.length > 0) {
      showToast(`Cannot delete location with ${itemsInLocation.length} item(s). Please move items first.`, "error");
      setShowDeleteModal(false);
      return;
    }

    // Check if location has children
    const hasChildren = locations.some(loc => loc.parent_location_id === selectedLocation.id);
    if (hasChildren) {
      showToast("Cannot delete location with child locations. Please delete or move children first.", "error");
      setShowDeleteModal(false);
      return;
    }

    setDeleting(true);
    try {
      await deleteLocation(selectedLocation.id);
      showToast("Location deleted successfully!", "success");
      setShowDeleteModal(false);
      setSelectedLocation(null);
      await loadData();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting location');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<LocationNode>[] = useMemo(() => [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (location: LocationNode) => (
        <div>
          <div className="font-semibold text-gray-900">{location.name}</div>
          {location.building && (
            <div className="text-xs text-gray-500">
              {[location.building, location.floor, location.room, location.shelf, location.bin]
                .filter(Boolean).join(" > ")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "building",
      label: "Building",
      sortable: true,
      render: (location: LocationNode) => (
        <span className="text-sm text-gray-600">{location.building || "-"}</span>
      ),
    },
    {
      key: "floor",
      label: "Floor",
      sortable: true,
      render: (location: LocationNode) => (
        <span className="text-sm text-gray-600">{location.floor || "-"}</span>
      ),
    },
    {
      key: "room",
      label: "Room",
      sortable: true,
      render: (location: LocationNode) => (
        <span className="text-sm text-gray-600">{location.room || "-"}</span>
      ),
    },
    {
      key: "items_count",
      label: "Items",
      sortable: true,
      className: "text-center",
      render: (location: LocationNode) => (
        <Badge variant={location.items_count && location.items_count > 0 ? "info" : "default"}>
          {location.items_count ?? 0}
        </Badge>
      ),
    },
  ], []);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Storage Locations</h1>
          <div className="text-white opacity-90 mb-2">Manage storage locations and their hierarchy</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={buildingFilter}
              onChange={e => setBuildingFilter(e.target.value)}
            >
              <option value="">All Buildings</option>
              {buildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
            <div className="flex gap-2 border rounded overflow-hidden">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === "tree"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Table View
              </button>
            </div>
          </div>
          {isManager && (
            <ButtonLoader
              loading={false}
              onClick={openAddModal}
              label="+ Add Location"
              variant="primary"
              className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {viewMode === "tree" ? (
            renderTreeView()
          ) : (
            <Table
              columns={columns}
              data={filteredLocations}
              loading={loading}
              emptyMessage="No locations found. Create your first location to get started."
            />
          )}
        </div>

        {/* Add/Edit Location Modal */}
        <Modal
          title={isEdit ? "Edit Location" : "Add Location"}
          open={showModal}
          onClose={() => setShowModal(false)}
          actions={null}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Location Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                required
                disabled={submitting}
                placeholder="e.g., Main Storage Room"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Building</label>
              <input
                type="text"
                value={form.building}
                onChange={e => setForm(prev => ({ ...prev, building: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="e.g., Building A"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Floor</label>
              <input
                type="text"
                value={form.floor}
                onChange={e => setForm(prev => ({ ...prev, floor: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="e.g., 1st Floor"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Room</label>
              <input
                type="text"
                value={form.room}
                onChange={e => setForm(prev => ({ ...prev, room: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="e.g., Room 101"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Shelf</label>
              <input
                type="text"
                value={form.shelf}
                onChange={e => setForm(prev => ({ ...prev, shelf: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="e.g., Shelf 1"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Bin</label>
              <input
                type="text"
                value={form.bin}
                onChange={e => setForm(prev => ({ ...prev, bin: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
                placeholder="e.g., Bin A1"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-blue-800">Parent Location</label>
              <select
                value={form.parent_location_id}
                onChange={e => setForm(prev => ({ ...prev, parent_location_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                disabled={submitting}
              >
                <option value="">None (Root Level)</option>
                {locations
                  .filter(loc => !isEdit || loc.id !== selectedLocation?.id)
                  .map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.building ? `(${loc.building})` : ''}
                    </option>
                  ))}
              </select>
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
            setSelectedLocation(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={selectedLocation?.name}
          itemType="location"
          loading={deleting}
          description="This will permanently delete the location. Make sure there are no items or child locations associated with it."
        />
      </div>
    </div>
  );
};

export default LocationsPage;

