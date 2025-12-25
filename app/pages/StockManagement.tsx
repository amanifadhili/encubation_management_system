import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Table from "../components/Table";
import Badge from "../components/Badge";

// Define column type locally to avoid ES module import issues
type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};
import { 
  getInventory, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  getAllLocations,
  getAllSuppliers,
  searchInventory,
  generateBarcode,
  getInventoryItemById,
  createReservation,
  assignInventoryToTeam,
  createMaintenanceLog,
  getInventoryItemAssignments,
  bulkGenerateBarcodes
} from "../services/api";

const StockManagement = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("");
  
  // Dropdown data
  const [locations, setLocations] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Bulk operations state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  const [form, setForm] = useState({
    id: 0,
    name: "",
    description: "",
    total_quantity: 1,
    status: "available",
    category: "",
    item_type: "",
    location_id: "",
    supplier_id: "",
    condition: "",
    sku: "",
    barcode: "",
    serial_number: "",
    min_stock_level: "",
    reorder_quantity: "",
    warranty_start: "",
    warranty_end: "",
    warranty_provider: "",
    maintenance_interval: "",
    purchase_date: "",
    is_frequently_distributed: false,
    distribution_unit: "",
    typical_consumption_rate: "",
    expiration_date: "",
    batch_number: "",
    tags: [] as string[],
    notes: ""
  });
  
  // Loading states for different operations
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [itemDetails, setItemDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState<'details' | 'assignments' | 'maintenance' | 'consumption'>('details');

  // Action modals state
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const isManager = user?.role === "manager" || user?.role === "director";

  // Load inventory and dropdown data on mount
  useEffect(() => {
    if (user) {
      loadInventory();
      if (isManager) {
        loadDropdowns();
      }
    }
  }, [user]);

  const loadDropdowns = async () => {
    setLoadingDropdowns(true);
    try {
      const [locationsData, suppliersData] = await Promise.all([
        getAllLocations().catch(() => []),
        getAllSuppliers().catch(() => [])
      ]);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error: any) {
      console.error("Error loading dropdowns:", error);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadInventory = async () => {
    try {
      const data = await withRetry(
        () => getInventory(),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            showToast(`Retrying... (${attempt}/3)`, 'info', { duration: 2000 });
          }
        }
      );
      setInventory(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading inventory');
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
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

  // Get status badge variant - supports all InventoryStatus enum values
  const getStatusVariant = (status: string): "success" | "warning" | "danger" | "default" | "info" => {
    switch (status?.toLowerCase()) {
      case "available":
        return "success"; // Green - item is available
      case "reserved":
        return "info"; // Blue - item is reserved
      case "assigned":
        return "info"; // Blue - item is assigned to a team
      case "maintenance":
        return "warning"; // Yellow - item is under maintenance
      case "damaged":
        return "danger"; // Red - item is damaged
      case "retired":
        return "default"; // Gray - item is retired
      case "disposed":
        return "default"; // Gray - item has been disposed
      case "out_of_stock":
        return "danger"; // Red - item is out of stock
      case "low_stock":
        return "warning"; // Yellow - item stock is low
      case "unavailable": // Legacy status, keep for backward compatibility
        return "danger";
      default:
        return "default";
    }
  };

  // Format status display text
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filtered and sorted inventory
  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    // Search filter (name, description, SKU, barcode, serial number)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower) ||
        item.barcode?.toLowerCase().includes(searchLower) ||
        item.serial_number?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(item => item.location_id === locationFilter);
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(item => item.supplier_id === supplierFilter);
    }

    // Item Type filter
    if (itemTypeFilter) {
      filtered = filtered.filter(item => item.item_type === itemTypeFilter);
    }

    // Sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        // Handle nested properties (e.g., location.name, supplier.name)
        if (sortBy === "location" && a.location) {
          aVal = a.location.name;
          bVal = b.location?.name;
        } else if (sortBy === "supplier" && a.supplier) {
          aVal = a.supplier.name;
          bVal = b.supplier?.name;
        }

        // Handle different data types
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
  }, [inventory, search, categoryFilter, statusFilter, locationFilter, supplierFilter, itemTypeFilter, sortBy, sortOrder]);

  // Handle sort
  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortBy(key);
    setSortOrder(order);
  };

  // Helper function to get condition badge color
  const getConditionVariant = (condition: string): "success" | "warning" | "danger" | "default" | "info" => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "success"; // Green
      case "good":
        return "info"; // Blue
      case "fair":
        return "warning"; // Yellow
      case "poor":
        return "warning"; // Orange/Yellow
      case "damaged":
        return "danger"; // Red
      case "retired":
        return "default"; // Gray
      default:
        return "default";
    }
  };

  // Format category display text
  const formatCategory = (category: string) => {
    if (!category) return "-";
    return category
      .split(/(?=[A-Z])/)
      .join(" ");
  };

  // Bulk operations handlers (defined before columns useMemo)
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredInventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    }
  };

  // Table columns definition
  const columns: TableColumn<any>[] = useMemo(() => {
    const baseColumns: TableColumn<any>[] = [
      {
        key: "select",
        label: "Select",
        render: (item: any) => (
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => handleSelectItem(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Select ${item.name}`}
          />
        ),
        className: "w-12",
      },
      {
        key: "name",
        label: "Item Name",
        sortable: true,
        render: (item: any) => (
          <div>
            <div className="font-semibold text-gray-900">{item.name || "-"}</div>
            {item.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                {item.description}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "category",
        label: "Category",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-700">{formatCategory(item.category) || "-"}</span>
        ),
      },
      {
        key: "item_type",
        label: "Type",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-700">{formatCategory(item.item_type) || "-"}</span>
        ),
      },
      {
        key: "location",
        label: "Location",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-700">
            {item.location?.name || "-"}
          </span>
        ),
      },
      {
        key: "supplier",
        label: "Supplier",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-700">
            {item.supplier?.name || "-"}
          </span>
        ),
      },
      {
        key: "condition",
        label: "Condition",
        sortable: true,
        render: (item: any) => (
          item.condition ? (
            <Badge variant={getConditionVariant(item.condition)}>
              {item.condition}
            </Badge>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )
        ),
      },
      {
        key: "sku",
        label: "SKU",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-700 font-mono">{item.sku || "-"}</span>
        ),
      },
      {
        key: "barcode",
        label: "Barcode",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-700 font-mono">{item.barcode || "-"}</span>
        ),
      },
      {
        key: "total_quantity",
        label: "Total",
        sortable: true,
        className: "text-center",
        render: (item: any) => (
          <span className="font-semibold text-gray-900">{item.total_quantity ?? 0}</span>
        ),
      },
      {
        key: "available_quantity",
        label: "Available",
        sortable: true,
        className: "text-center",
        render: (item: any) => {
          const available = item.available_quantity ?? 0;
          const total = item.total_quantity ?? 0;
          const reserved = item.reserved_quantity ?? 0;
          const minStock = item.min_stock_level;
          const isLowStock = minStock ? available < minStock : available > 0 && available < total * 0.2;
          const isOutOfStock = available === 0 && total > 0;

          return (
            <div className="flex flex-col items-center">
              <span className={`font-semibold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-green-600"}`}>
                {available}
              </span>
              {reserved > 0 && (
                <span className="text-xs text-gray-500">({reserved} reserved)</span>
              )}
            </div>
          );
        },
      },
      {
        key: "reserved_quantity",
        label: "Reserved",
        sortable: true,
        className: "text-center",
        render: (item: any) => (
          <span className="text-sm text-gray-700">{item.reserved_quantity ?? 0}</span>
        ),
      },
      {
        key: "min_stock_level",
        label: "Min Stock",
        sortable: true,
        className: "text-center",
        render: (item: any) => {
          const minStock = item.min_stock_level;
          const available = item.available_quantity ?? 0;
          const isBelowMin = minStock && available < minStock;
          
          return (
            <div className="flex flex-col items-center">
              <span className={`text-sm ${isBelowMin ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                {minStock ?? "-"}
              </span>
              {isBelowMin && (
                <span className="text-xs text-red-500">⚠ Low</span>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (item: any) => (
          <Badge variant={getStatusVariant(item.status)}>
            {formatStatus(item.status || "available")}
          </Badge>
        ),
      },
      {
        key: "next_maintenance",
        label: "Next Maintenance",
        sortable: true,
        render: (item: any) => {
          if (!item.next_maintenance) return <span className="text-sm text-gray-400">-</span>;
          
          const nextMaintenance = new Date(item.next_maintenance);
          const today = new Date();
          const daysUntil = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntil < 0;
          const isDueSoon = daysUntil >= 0 && daysUntil <= 7;

          return (
            <div className="flex flex-col">
              <span className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : isDueSoon ? "text-yellow-600" : "text-gray-600"}`}>
                {formatDate(item.next_maintenance)}
              </span>
              {isOverdue && (
                <span className="text-xs text-red-500">Overdue</span>
              )}
              {isDueSoon && !isOverdue && (
                <span className="text-xs text-yellow-500">Due soon</span>
              )}
            </div>
          );
        },
      },
      {
        key: "last_replenished",
        label: "Last Replenished",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-600">{formatDate(item.last_replenished)}</span>
        ),
      },
      {
        key: "created_at",
        label: "Created",
        sortable: true,
        render: (item: any) => (
          <span className="text-sm text-gray-600">{formatDate(item.created_at)}</span>
        ),
      },
    ];

    return baseColumns;
  }, [selectedItems, filteredInventory.length]);

  const openAddModal = () => {
    setForm({
      id: 0,
      name: "",
      description: "",
      total_quantity: 1,
      status: "available",
      category: "",
      item_type: "",
      location_id: "",
      supplier_id: "",
      condition: "Good",
      sku: "",
      barcode: "",
      serial_number: "",
      min_stock_level: "",
      reorder_quantity: "",
      warranty_start: "",
      warranty_end: "",
      warranty_provider: "",
      maintenance_interval: "",
      purchase_date: "",
      is_frequently_distributed: false,
      distribution_unit: "",
      typical_consumption_rate: "",
      expiration_date: "",
      batch_number: "",
      tags: [],
      notes: ""
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setForm({
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      total_quantity: item.total_quantity || 1,
      status: item.status || "available",
      category: item.category || "",
      item_type: item.item_type || "",
      location_id: item.location_id || "",
      supplier_id: item.supplier_id || "",
      condition: item.condition || "Good",
      sku: item.sku || "",
      barcode: item.barcode || "",
      serial_number: item.serial_number || "",
      min_stock_level: item.min_stock_level?.toString() || "",
      reorder_quantity: item.reorder_quantity?.toString() || "",
      warranty_start: item.warranty_start ? new Date(item.warranty_start).toISOString().split('T')[0] : "",
      warranty_end: item.warranty_end ? new Date(item.warranty_end).toISOString().split('T')[0] : "",
      warranty_provider: item.warranty_provider || "",
      maintenance_interval: item.maintenance_interval?.toString() || "",
      purchase_date: item.purchase_date ? new Date(item.purchase_date).toISOString().split('T')[0] : "",
      is_frequently_distributed: item.is_frequently_distributed || false,
      distribution_unit: item.distribution_unit || "",
      typical_consumption_rate: item.typical_consumption_rate?.toString() || "",
      expiration_date: item.expiration_date ? new Date(item.expiration_date).toISOString().split('T')[0] : "",
      batch_number: item.batch_number || "",
      tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : []),
      notes: item.notes || ""
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               (name === 'total_quantity' || name === 'min_stock_level' || name === 'reorder_quantity' || 
                name === 'maintenance_interval' || name === 'typical_consumption_rate') 
                ? (value ? parseInt(value) || "" : "") : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      showToast("Please enter item name.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData: any = {
        name: form.name,
        description: form.description || undefined,
        total_quantity: form.total_quantity,
        status: form.status,
        category: form.category || undefined,
        item_type: form.item_type || undefined,
        location_id: form.location_id || undefined,
        supplier_id: form.supplier_id || undefined,
        condition: form.condition || undefined,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        serial_number: form.serial_number || undefined,
        min_stock_level: form.min_stock_level ? parseInt(form.min_stock_level as any) : undefined,
        reorder_quantity: form.reorder_quantity ? parseInt(form.reorder_quantity as any) : undefined,
        warranty_start: form.warranty_start || undefined,
        warranty_end: form.warranty_end || undefined,
        warranty_provider: form.warranty_provider || undefined,
        maintenance_interval: form.maintenance_interval ? parseInt(form.maintenance_interval as any) : undefined,
        purchase_date: form.purchase_date || undefined,
        is_frequently_distributed: form.is_frequently_distributed,
        distribution_unit: form.distribution_unit || undefined,
        typical_consumption_rate: form.typical_consumption_rate ? parseInt(form.typical_consumption_rate as any) : undefined,
        expiration_date: form.expiration_date || undefined,
        batch_number: form.batch_number || undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        notes: form.notes || undefined
      };

      // Remove undefined fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === undefined || formData[key] === "") {
          delete formData[key];
        }
      });

      if (isEdit) {
        await updateInventoryItem(form.id, formData);
        showToast("Inventory item updated!", "success");
        await loadInventory();
      } else {
        await createInventoryItem(formData);
        showToast("Inventory item created!", "success");
        await loadInventory();
      }
      setShowModal(false);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'saving inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await deleteInventoryItem(itemToDelete.id);
      showToast("Inventory item deleted!", "success");
      await loadInventory();
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'deleting inventory item');
    } finally {
      setDeleting(false);
    }
  };

  // Action handlers
  const handleViewDetails = async (item: any) => {
    setSelectedItem(item);
    setLoadingDetails(true);
    setDetailModalOpen(true);
    try {
      const details = await getInventoryItemById(item.id);
      setItemDetails(details);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading item details');
      setDetailModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleGenerateBarcode = async (item: any) => {
    try {
      await generateBarcode(item.id);
      showToast("Barcode generated successfully!", "success");
      await loadInventory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'generating barcode');
    }
  };

  const handleReserveItem = (item: any) => {
    setSelectedItem(item);
    setReservationModalOpen(true);
    // TODO: Implement reservation modal/form
    showToast("Reservation feature coming soon", "info");
  };

  const handleAssignItem = (item: any) => {
    setSelectedItem(item);
    setAssignmentModalOpen(true);
    // TODO: Implement assignment modal/form
    showToast("Assignment feature coming soon", "info");
  };

  const handleLogMaintenance = (item: any) => {
    setSelectedItem(item);
    setMaintenanceModalOpen(true);
    // TODO: Implement maintenance log modal/form
    showToast("Maintenance logging feature coming soon", "info");
  };

  // Bulk operations handlers
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      showToast("Please select items to delete", "error");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      const deletePromises = Array.from(selectedItems).map(id => deleteInventoryItem(id));
      await Promise.all(deletePromises);
      showToast(`Successfully deleted ${selectedItems.size} item(s)`, "success");
      setSelectedItems(new Set());
      await loadInventory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'bulk deleting items');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkGenerateBarcodes = async () => {
    const itemsWithoutBarcodes = filteredInventory.filter(
      item => selectedItems.has(item.id) && !item.barcode
    );

    if (itemsWithoutBarcodes.length === 0) {
      showToast("Selected items already have barcodes", "info");
      return;
    }

    setBulkOperationLoading(true);
    try {
      const itemIds = itemsWithoutBarcodes.map(item => item.id);
      await bulkGenerateBarcodes({ item_ids: itemIds });
      showToast(`Successfully generated ${itemIds.length} barcode(s)`, "success");
      setSelectedItems(new Set());
      await loadInventory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'bulk generating barcodes');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedItems.size === 0) {
      showToast("Please select items to update", "error");
      return;
    }

    setBulkOperationLoading(true);
    try {
      const updatePromises = Array.from(selectedItems).map(id =>
        updateInventoryItem(id, { status: newStatus })
      );
      await Promise.all(updatePromises);
      showToast(`Successfully updated ${selectedItems.size} item(s) status to ${newStatus}`, "success");
      setSelectedItems(new Set());
      await loadInventory();
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'bulk updating status');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Calculate low stock and out of stock items
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => {
      const available = item.available_quantity ?? 0;
      const minStock = item.min_stock_level;
      return minStock && available < minStock && available > 0;
    });
  }, [inventory]);

  const outOfStockItems = useMemo(() => {
    return inventory.filter(item => {
      const available = item.available_quantity ?? 0;
      const total = item.total_quantity ?? 0;
      return available === 0 && total > 0;
    });
  }, [inventory]);

  const maintenanceDueItems = useMemo(() => {
    return inventory.filter(item => {
      if (!item.next_maintenance) return false;
      const nextMaintenance = new Date(item.next_maintenance);
      const today = new Date();
      return nextMaintenance <= today;
    });
  }, [inventory]);

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Inventory / Stock Management</h1>
              <div className="text-white opacity-90 mb-2">Manage tools, facilities, and assignments to teams.</div>
            </div>
            <a
              href="/inventory/management"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Management Hub
            </a>
          </div>
        </div>

        {/* Alert Banners */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0 || maintenanceDueItems.length > 0) && (
          <div className="mb-6 space-y-3">
            {outOfStockItems.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-red-800">
                        {outOfStockItems.length} Item{outOfStockItems.length !== 1 ? 's' : ''} Out of Stock
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {outOfStockItems.slice(0, 3).map(item => item.name).join(', ')}
                        {outOfStockItems.length > 3 && ` and ${outOfStockItems.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStatusFilter('out_of_stock')}
                    className="text-sm font-medium text-red-700 hover:text-red-900 underline"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-800">
                        {lowStockItems.length} Item{lowStockItems.length !== 1 ? 's' : ''} Below Minimum Stock Level
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {lowStockItems.slice(0, 3).map(item => item.name).join(', ')}
                        {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      // Filter for low stock items
                      const lowStockIds = lowStockItems.map(item => item.id);
                      // We'll filter by checking items in filteredInventory
                    }}
                    className="text-sm font-medium text-yellow-700 hover:text-yellow-900 underline"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
            {maintenanceDueItems.length > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-orange-800">
                        {maintenanceDueItems.length} Item{maintenanceDueItems.length !== 1 ? 's' : ''} Due for Maintenance
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        {maintenanceDueItems.slice(0, 3).map(item => item.name).join(', ')}
                        {maintenanceDueItems.length > 3 && ` and ${maintenanceDueItems.length - 3} more`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStatusFilter('maintenance')}
                    className="text-sm font-medium text-orange-700 hover:text-orange-900 underline"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              placeholder="Search by name, SKU, barcode, serial number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Equipment">Equipment</option>
              <option value="Tools">Tools</option>
              <option value="Furniture">Furniture</option>
              <option value="Electronics">Electronics</option>
              <option value="Consumables">Consumables</option>
              <option value="Refreshments">Refreshments</option>
              <option value="OfficeSupplies">Office Supplies</option>
              <option value="Software">Software</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Other">Other</option>
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="damaged">Damaged</option>
              <option value="retired">Retired</option>
              <option value="disposed">Disposed</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={itemTypeFilter}
              onChange={e => setItemTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Perishable">Perishable</option>
              <option value="NonPerishable">Non Perishable</option>
              <option value="Returnable">Returnable</option>
              <option value="Consumable">Consumable</option>
              <option value="Refreshment">Refreshment</option>
              <option value="FixedAsset">Fixed Asset</option>
            </select>
          </div>
          
          {/* Additional Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              disabled={loadingDropdowns}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
              disabled={loadingDropdowns}
            >
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
            {(categoryFilter || statusFilter || locationFilter || supplierFilter || itemTypeFilter) && (
              <button
                onClick={() => {
                  setCategoryFilter("");
                  setStatusFilter("");
                  setLocationFilter("");
                  setSupplierFilter("");
                  setItemTypeFilter("");
                }}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
          <div className="flex gap-2 items-center">
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-gray-700 font-medium">
                  {selectedItems.size} selected
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  disabled={bulkOperationLoading}
                >
                  <option value="">Bulk Actions...</option>
                  <option value="available">Set Status: Available</option>
                  <option value="maintenance">Set Status: Maintenance</option>
                  <option value="retired">Set Status: Retired</option>
                  <option value="disposed">Set Status: Disposed</option>
                </select>
                <button
                  onClick={handleBulkGenerateBarcodes}
                  disabled={bulkOperationLoading}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Generate Barcodes
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkOperationLoading}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            )}
            {isManager && (
              <ButtonLoader
                loading={false}
                onClick={openAddModal}
                label="+ Add Inventory Item"
                variant="primary"
                className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600"
              />
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Inventory Items</h2>
              {!loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredInventory.length} of {inventory.length} items
                  {lowStockItems.length > 0 && (
                    <span className="ml-2 text-yellow-600 font-semibold">
                      ({lowStockItems.length} low stock)
                    </span>
                  )}
                  {outOfStockItems.length > 0 && (
                    <span className="ml-2 text-red-600 font-semibold">
                      ({outOfStockItems.length} out of stock)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredInventory}
            loading={loading}
            emptyMessage="No inventory items found. Create your first item to get started."
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            actions={isManager ? (item: any) => (
              <div className="flex items-center gap-1 flex-nowrap">
                {/* View Details */}
                <button
                  onClick={() => handleViewDetails(item)}
                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
                  aria-label="View details"
                  title="View Details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Generate Barcode */}
                {!item.barcode && (
                  <button
                    onClick={() => handleGenerateBarcode(item)}
                    className="p-2 rounded-lg hover:bg-green-100 text-green-700 transition-colors"
                    aria-label="Generate barcode"
                    title="Generate Barcode"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {/* Reserve */}
                {item.available_quantity > 0 && (
                  <button
                    onClick={() => handleReserveItem(item)}
                    className="p-2 rounded-lg hover:bg-purple-100 text-purple-700 transition-colors"
                    aria-label="Reserve item"
                    title="Reserve"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {/* Assign to Team */}
                {item.available_quantity > 0 && (
                  <button
                    onClick={() => handleAssignItem(item)}
                    className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors"
                    aria-label="Assign to team"
                    title="Assign to Team"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                    </svg>
                  </button>
                )}
                {/* Log Maintenance */}
                <button
                  onClick={() => handleLogMaintenance(item)}
                  className="p-2 rounded-lg hover:bg-orange-100 text-orange-700 transition-colors"
                  aria-label="Log maintenance"
                  title="Log Maintenance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Edit */}
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
                  aria-label="Edit item"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M15.232 5.232a2.5 2.5 0 0 1 0 3.536l-7.5 7.5A2 2 0 0 1 6 17H3a1 1 0 0 1-1-1v-3c0-.53.21-1.04.586-1.414l7.5-7.5a2.5 2.5 0 0 1 3.536 0zm-2.828 2.828L5 15v2h2l7.404-7.404-2.828-2.828z" />
                  </svg>
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-700 transition-colors"
                  aria-label="Delete item"
                  title="Delete"
                  disabled={deleting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : undefined}
          />
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
          <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Basic Information</h3>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Item Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  >
                    <option value="">Select Category</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Tools">Tools</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Refreshments">Refreshments</option>
                    <option value="OfficeSupplies">Office Supplies</option>
                    <option value="Software">Software</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Item Type</label>
                  <select
                    name="item_type"
                    value={form.item_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  >
                    <option value="">Select Type</option>
                    <option value="Perishable">Perishable</option>
                    <option value="NonPerishable">Non Perishable</option>
                    <option value="Returnable">Returnable</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Refreshment">Refreshment</option>
                    <option value="FixedAsset">Fixed Asset</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Identification</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">SKU</label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50 font-mono"
                    disabled={submitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Barcode</label>
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50 font-mono"
                    disabled={submitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Serial Number</label>
                  <input
                    name="serial_number"
                    value={form.serial_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50 font-mono"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Quantities & Stock */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Quantities & Stock</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Total Quantity *</label>
                  <input
                    name="total_quantity"
                    type="number"
                    min={0}
                    value={form.total_quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Min Stock Level</label>
                  <input
                    name="min_stock_level"
                    type="number"
                    min={0}
                    value={form.min_stock_level}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Reorder Quantity</label>
                  <input
                    name="reorder_quantity"
                    type="number"
                    min={0}
                    value={form.reorder_quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged</option>
                    <option value="retired">Retired</option>
                    <option value="disposed">Disposed</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="low_stock">Low Stock</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Supplier */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Location & Supplier</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Location</label>
                  <select
                    name="location_id"
                    value={form.location_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting || loadingDropdowns}
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Supplier</label>
                  <select
                    name="supplier_id"
                    value={form.supplier_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting || loadingDropdowns}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Condition</label>
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  disabled={submitting}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            {/* Warranty & Maintenance */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Warranty & Maintenance</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Warranty Start</label>
                  <input
                    name="warranty_start"
                    type="date"
                    value={form.warranty_start}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Warranty End</label>
                  <input
                    name="warranty_end"
                    type="date"
                    value={form.warranty_end}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Warranty Provider</label>
                <input
                  name="warranty_provider"
                  value={form.warranty_provider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Maintenance Interval (days)</label>
                  <input
                    name="maintenance_interval"
                    type="number"
                    min={0}
                    value={form.maintenance_interval}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-blue-800">Purchase Date</label>
                  <input
                    name="purchase_date"
                    type="date"
                    value={form.purchase_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Consumables/Refreshments (conditional) */}
            {(form.category === "Consumables" || form.category === "Refreshments" || form.item_type === "Consumable" || form.item_type === "Refreshment") && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Consumables/Refreshments</h3>
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      name="is_frequently_distributed"
                      type="checkbox"
                      checked={form.is_frequently_distributed}
                      onChange={handleChange}
                      className="w-4 h-4"
                      disabled={submitting}
                    />
                    <span className="font-semibold text-blue-800">Frequently Distributed</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 font-semibold text-blue-800">Distribution Unit</label>
                    <input
                      name="distribution_unit"
                      value={form.distribution_unit}
                      onChange={handleChange}
                      placeholder="cup, bottle, packet, kg, liter"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-blue-800">Typical Consumption Rate</label>
                    <input
                      name="typical_consumption_rate"
                      type="number"
                      min={0}
                      value={form.typical_consumption_rate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-blue-800">Expiration Date</label>
                    <input
                      name="expiration_date"
                      type="date"
                      value={form.expiration_date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-semibold text-blue-800">Batch Number</label>
                  <input
                    name="batch_number"
                    value={form.batch_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 pb-2 border-b">Notes</h3>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-blue-800">Internal Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                  rows={3}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <ButtonLoader
                loading={false}
                onClick={() => setShowModal(false)}
                label="Cancel"
                variant="secondary"
                type="button"
              />
              <ButtonLoader
                loading={submitting}
                label={isEdit ? "Update Item" : "Create Item"}
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
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          itemName={itemToDelete?.name}
          itemType="inventory item"
          loading={deleting}
          description="This will permanently delete the inventory item and remove all team assignments. This action cannot be undone."
        />

        {/* Item Detail Modal */}
        <Modal
          title={`Item Details: ${selectedItem?.name || ''}`}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedItem(null);
            setItemDetails(null);
            setDetailTab('details');
          }}
          actions={null}
        >
          {loadingDetails ? (
            <div className="p-8 text-center">Loading details...</div>
          ) : itemDetails ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4" aria-label="Tabs">
                  <button
                    onClick={() => setDetailTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      detailTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setDetailTab('assignments')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      detailTab === 'assignments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Assignments ({itemDetails.inventory_assignments?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailTab('maintenance')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      detailTab === 'maintenance'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Maintenance ({itemDetails.maintenance_logs?.length || 0})
                  </button>
                  {(itemDetails.category === 'Consumables' || itemDetails.category === 'Refreshments') && (
                    <button
                      onClick={() => setDetailTab('consumption')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        detailTab === 'consumption'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Consumption ({itemDetails.consumption_logs?.length || 0})
                    </button>
                  )}
                </nav>
              </div>

              {/* Details Tab */}
              {detailTab === 'details' && (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Category</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCategory(itemDetails.category) || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Item Type</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCategory(itemDetails.item_type) || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">SKU</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{itemDetails.sku || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Barcode</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{itemDetails.barcode || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Serial Number</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{itemDetails.serial_number || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Status</label>
                      <p className="mt-1">
                        <Badge variant={getStatusVariant(itemDetails.status)}>
                          {formatStatus(itemDetails.status || "available")}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Condition</label>
                      <p className="mt-1">
                        {itemDetails.condition ? (
                          <Badge variant={getConditionVariant(itemDetails.condition)}>
                            {itemDetails.condition}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Total Quantity</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.total_quantity ?? 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Available Quantity</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.available_quantity ?? 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Reserved Quantity</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.reserved_quantity ?? 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Min Stock Level</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.min_stock_level ?? '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Location</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.location?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Supplier</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.supplier?.name || '-'}</p>
                    </div>
                    {itemDetails.warranty_start && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Warranty Start</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(itemDetails.warranty_start)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">Warranty End</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(itemDetails.warranty_end)}</p>
                        </div>
                      </>
                    )}
                    {itemDetails.warranty_provider && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Warranty Provider</label>
                        <p className="mt-1 text-sm text-gray-900">{itemDetails.warranty_provider}</p>
                      </div>
                    )}
                    {itemDetails.next_maintenance && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Next Maintenance</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(itemDetails.next_maintenance)}</p>
                      </div>
                    )}
                  </div>
                  {itemDetails.description && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.description}</p>
                    </div>
                  )}
                  {itemDetails.notes && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{itemDetails.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assignments Tab */}
              {detailTab === 'assignments' && (
                <div className="pt-4">
                  {itemDetails.inventory_assignments && itemDetails.inventory_assignments.length > 0 ? (
                    <div className="space-y-3">
                      {itemDetails.inventory_assignments.map((assignment: any) => (
                        <div key={assignment.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{assignment.team?.name || 'Unknown Team'}</p>
                              <p className="text-sm text-gray-600">Quantity: {assignment.quantity}</p>
                              <p className="text-sm text-gray-600">Assigned: {formatDate(assignment.assigned_at)}</p>
                              {assignment.expected_return && (
                                <p className="text-sm text-gray-600">Expected Return: {formatDate(assignment.expected_return)}</p>
                              )}
                              {assignment.returned_at && (
                                <p className="text-sm text-green-600">Returned: {formatDate(assignment.returned_at)}</p>
                              )}
                            </div>
                            <Badge variant={assignment.status === 'active' ? 'success' : 'default'}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No assignments found</p>
                  )}
                </div>
              )}

              {/* Maintenance Tab */}
              {detailTab === 'maintenance' && (
                <div className="pt-4">
                  {itemDetails.maintenance_logs && itemDetails.maintenance_logs.length > 0 ? (
                    <div className="space-y-3">
                      {itemDetails.maintenance_logs.map((log: any) => (
                        <div key={log.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{log.maintenance_type}</p>
                              <p className="text-sm text-gray-600">Date: {formatDate(log.performed_at)}</p>
                              {log.technician && (
                                <p className="text-sm text-gray-600">Performed by: {log.technician.name || 'Unknown'}</p>
                              )}
                              {log.notes && (
                                <p className="text-sm text-gray-700 mt-1">{log.notes}</p>
                              )}
                              {log.next_maintenance && (
                                <p className="text-sm text-blue-600 mt-1">Next: {formatDate(log.next_maintenance)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No maintenance logs found</p>
                  )}
                </div>
              )}

              {/* Consumption Tab */}
              {detailTab === 'consumption' && itemDetails && (
                <div className="pt-4">
                  {itemDetails.consumption_logs && itemDetails.consumption_logs.length > 0 ? (
                    <div className="space-y-3">
                      {itemDetails.consumption_logs.slice(0, 20).map((log: any) => (
                        <div key={log.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">Quantity: {log.quantity}</p>
                              <p className="text-sm text-gray-600">Date: {formatDate(log.consumption_date)}</p>
                              {log.distributed_to && (
                                <p className="text-sm text-gray-600">Distributed to: {log.distributed_to}</p>
                              )}
                              {log.team && (
                                <p className="text-sm text-gray-600">Team: {log.team.name || 'Unknown'}</p>
                              )}
                              {log.notes && (
                                <p className="text-sm text-gray-700 mt-1">{log.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {itemDetails.consumption_logs && itemDetails.consumption_logs.length > 20 && (
                        <p className="text-center text-gray-500 text-sm">
                          Showing first 20 of {itemDetails.consumption_logs.length} logs
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No consumption logs found</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <ButtonLoader
                  loading={false}
                  onClick={() => {
                    setDetailModalOpen(false);
                    setSelectedItem(null);
                    setItemDetails(null);
                    setDetailTab('details');
                  }}
                  label="Close"
                  variant="secondary"
                  type="button"
                />
                {isManager && (
                  <ButtonLoader
                    loading={false}
                    onClick={() => {
                      setDetailModalOpen(false);
                      openEditModal(itemDetails);
                    }}
                    label="Edit"
                    variant="primary"
                    type="button"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No details available</div>
          )}
        </Modal>
      </div>
  );
};

export default StockManagement;