import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Badge from "../components/Badge";
import Table from "../components/Table";
import Modal from "../components/Modal";
import {
  getReplenishmentForecasting,
  autoCreateReplenishmentRequests,
  getInventory,
  getAllLocations,
} from "../services/api";
import { CubeIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { formatDate } from "../utils/formatters";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

const ReplenishmentForecastingPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // State for forecasting data
  const [forecastingData, setForecastingData] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [itemFilter, setItemFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [lookbackDays, setLookbackDays] = useState<string>("30");
  const [forecastDays, setForecastDays] = useState<string>("30");
  
  // Auto-create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dryRunMode, setDryRunMode] = useState(true);
  const [creatingRequests, setCreatingRequests] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Dropdown data
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    loadDropdowns();
    loadForecasting();
  }, []);

  const loadDropdowns = async () => {
    try {
      const data = await withRetry(() => getInventory(), { maxRetries: 2 });
      const items = data?.items || data?.data?.items || data || [];
      setInventoryItems(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error("Error loading dropdowns:", error);
    }
  };

  const loadForecasting = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (itemFilter) params.item_id = itemFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (lookbackDays) params.lookback_days = parseInt(lookbackDays);
      if (forecastDays) params.forecast_days = parseInt(forecastDays);

      const data = await withRetry(() => getReplenishmentForecasting(params));
      const items = Array.isArray(data) ? data : data?.items || data?.data?.items || [];
      setForecastingData(items);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading replenishment forecasting");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCreate = async () => {
    setCreatingRequests(true);
    try {
      const data = await withRetry(() =>
        autoCreateReplenishmentRequests({
          dry_run: true,
          category: categoryFilter || undefined,
        })
      );
      const preview = data?.preview || data?.requests || [];
      setPreviewData(Array.isArray(preview) ? preview : []);
      setShowCreateModal(true);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "previewing replenishment requests");
    } finally {
      setCreatingRequests(false);
    }
  };

  const handleCreateRequests = async () => {
    setCreatingRequests(true);
    try {
      const data = await withRetry(() =>
        autoCreateReplenishmentRequests({
          dry_run: false,
          category: categoryFilter || undefined,
        })
      );
      showToast("Replenishment requests created successfully", "success");
      setShowCreateModal(false);
      if (data?.requests_created) {
        showToast(`${data.requests_created.length} requests created`, "success");
      }
      loadForecasting(); // Reload to show updated data
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "creating replenishment requests");
    } finally {
      setCreatingRequests(false);
    }
  };

  // Chart data
  const stockComparisonChartData = useMemo(() => {
    if (forecastingData.length === 0) return null;

    const topItems = forecastingData.slice(0, 10); // Show top 10 items
    return {
      labels: topItems.map((item: any) => item.item_name || "Unknown"),
      datasets: [
        {
          label: "Current Stock",
          data: topItems.map((item: any) => item.current_quantity || 0),
          backgroundColor: "rgba(37, 99, 235, 0.6)",
        },
        {
          label: "Min Stock Level",
          data: topItems.map((item: any) => item.min_stock_level || 0),
          backgroundColor: "rgba(239, 68, 68, 0.6)",
        },
      ],
    };
  }, [forecastingData]);

  // Table columns
  const forecastingColumns: TableColumn<any>[] = [
    { key: "item_name", label: "Item Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    {
      key: "current_quantity",
      label: "Current Stock",
      sortable: true,
    },
    {
      key: "min_stock_level",
      label: "Min Stock",
      sortable: true,
    },
    {
      key: "days_until_reorder",
      label: "Days Until Reorder",
      render: (row) => {
        const days = row.days_until_reorder;
        if (days === null || days === undefined) return "-";
        if (days <= 0) return <Badge variant="danger">Urgent</Badge>;
        if (days <= 7) return <Badge variant="warning">{days} days</Badge>;
        return `${days} days`;
      },
      sortable: true,
    },
    {
      key: "suggested_reorder_quantity",
      label: "Suggested Quantity",
      sortable: true,
    },
    {
      key: "consumption_rate",
      label: "Consumption Rate",
      render: (row) => `${(row.consumption_rate || 0).toFixed(2)} units/day`,
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const current = row.current_quantity || 0;
        const min = row.min_stock_level || 0;
        const days = row.days_until_reorder;
        if (current === 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (current < min) return <Badge variant="danger">Critical</Badge>;
        if (days !== null && days <= 7) return <Badge variant="warning">Soon</Badge>;
        return <Badge variant="success">OK</Badge>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => navigate(`/inventory?itemId=${row.item_id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          View Item
        </button>
      ),
    },
  ];

  const criticalItems = useMemo(() => {
    return forecastingData.filter((item) => {
      const current = item.current_quantity || 0;
      const min = item.min_stock_level || 0;
      return current < min;
    });
  }, [forecastingData]);

  const urgentItems = useMemo(() => {
    return forecastingData.filter((item) => {
      const days = item.days_until_reorder;
      return days !== null && days !== undefined && days <= 7;
    });
  }, [forecastingData]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <PageSkeleton count={2} layout="card" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Replenishment Forecasting
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Predict when to reorder based on consumption patterns
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLoader
            loading={creatingRequests}
            onClick={handlePreviewCreate}
            label="Preview Requests"
            variant="secondary"
            size="md"
          />
          <ButtonLoader
            loading={loading}
            onClick={loadForecasting}
            label="Refresh"
            variant="primary"
            size="md"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-gray-600">Critical Items</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{criticalItems.length}</p>
          <p className="text-xs text-gray-500 mt-1">Below minimum stock</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowPathIcon className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-medium text-gray-600">Urgent Reorders</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{urgentItems.length}</p>
          <p className="text-xs text-gray-500 mt-1">Needed within 7 days</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CubeIcon className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Total Items</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{forecastingData.length}</p>
          <p className="text-xs text-gray-500 mt-1">Being monitored</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item</label>
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Items</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Filter by category"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Lookback Days
            </label>
            <input
              type="number"
              value={lookbackDays}
              onChange={(e) => setLookbackDays(e.target.value)}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Forecast Days
            </label>
            <input
              type="number"
              value={forecastDays}
              onChange={(e) => setForecastDays(e.target.value)}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-end">
            <ButtonLoader
              loading={loading}
              onClick={loadForecasting}
              label="Apply Filters"
              variant="primary"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Stock Comparison Chart */}
      {stockComparisonChartData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Current Stock vs Minimum Stock Level
          </h2>
          <Bar
            data={stockComparisonChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: true },
              },
            }}
          />
        </div>
      )}

      {/* Forecasting Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Items Needing Replenishment</h2>
          {criticalItems.length > 0 && (
            <ButtonLoader
              loading={creatingRequests}
              onClick={handlePreviewCreate}
              label="Auto-Create Requests"
              variant="primary"
              size="sm"
            />
          )}
        </div>
        {forecastingData.length > 0 ? (
          <Table
            columns={forecastingColumns}
            data={forecastingData}
            emptyMessage="No items need replenishment"
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            No items need replenishment based on current forecasts.
          </div>
        )}
      </div>

      {/* Preview/Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={dryRunMode ? "Preview Replenishment Requests" : "Create Replenishment Requests"}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={dryRunMode}
              onChange={(e) => setDryRunMode(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-700">Dry-run mode (preview only)</label>
          </div>

          {previewData.length > 0 ? (
            <>
              <p className="text-gray-600">
                {dryRunMode
                  ? `This will create ${previewData.length} replenishment requests:`
                  : `Creating ${previewData.length} replenishment requests:`}
              </p>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Item
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.item_name || "Unknown"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.quantity || item.suggested_reorder_quantity || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-600">No requests to create.</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {!dryRunMode && (
              <ButtonLoader
                loading={creatingRequests}
                onClick={handleCreateRequests}
                label="Create Requests"
                variant="primary"
                size="md"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReplenishmentForecastingPage;

