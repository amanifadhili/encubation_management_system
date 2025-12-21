import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
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
import {
  getUsageAnalytics,
  getAssignmentTrends,
  getLowStockAlerts,
  getUtilizationReports,
  getAllSuppliers,
  getAllLocations,
  getInventory,
  autoCreateReplenishmentRequests,
} from "../services/api";
import { ChartBarIcon, CubeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal";
import { formatDate } from "../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

type TableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

const InventoryAnalyticsPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // State for different analytics sections
  const [usageAnalytics, setUsageAnalytics] = useState<any>(null);
  const [assignmentTrends, setAssignmentTrends] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [utilizationReports, setUtilizationReports] = useState<any>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [loadingUtilization, setLoadingUtilization] = useState(false);
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [trendPeriod, setTrendPeriod] = useState<string>("monthly");
  const [trendItemId, setTrendItemId] = useState<string>("");
  const [trendTeamId, setTrendTeamId] = useState<string>("");
  const [lowStockCategory, setLowStockCategory] = useState<string>("");
  const [lowStockSupplier, setLowStockSupplier] = useState<string>("");
  const [includeOutOfStock, setIncludeOutOfStock] = useState<boolean>(true);
  const [utilizationCategory, setUtilizationCategory] = useState<string>("");
  const [utilizationRateMin, setUtilizationRateMin] = useState<string>("");
  const [utilizationRateMax, setUtilizationRateMax] = useState<string>("");
  
  // Dropdown data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  
  // Bulk replenishment modal
  const [showReplenishmentModal, setShowReplenishmentModal] = useState(false);
  const [creatingReplenishment, setCreatingReplenishment] = useState(false);

  useEffect(() => {
    loadAllData();
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [suppliersData, inventoryData] = await Promise.all([
        getAllSuppliers().catch(() => []),
        getInventory().catch(() => []),
      ]);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (error: any) {
      console.error("Error loading dropdowns:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadUsageAnalytics(),
      loadAssignmentTrends(),
      loadLowStockAlerts(),
      loadUtilizationReports(),
    ]);
    setLoading(false);
  };

  const loadUsageAnalytics = async () => {
    setLoadingUsage(true);
    try {
      const params: any = {};
      if (periodFilter) params.period = periodFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await withRetry(() => getUsageAnalytics(params));
      setUsageAnalytics(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading usage analytics");
    } finally {
      setLoadingUsage(false);
    }
  };

  const loadAssignmentTrends = async () => {
    setLoadingTrends(true);
    try {
      const params: any = { period: trendPeriod };
      if (trendItemId) params.item_id = trendItemId;
      if (trendTeamId) params.team_id = trendTeamId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await withRetry(() => getAssignmentTrends(params));
      setAssignmentTrends(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading assignment trends");
    } finally {
      setLoadingTrends(false);
    }
  };

  const loadLowStockAlerts = async () => {
    setLoadingLowStock(true);
    try {
      const params: any = {};
      if (lowStockCategory) params.category = lowStockCategory;
      if (lowStockSupplier) params.supplier_id = lowStockSupplier;
      if (includeOutOfStock !== undefined) params.include_out_of_stock = includeOutOfStock;

      const data = await withRetry(() => getLowStockAlerts(params));
      setLowStockAlerts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading low stock alerts");
    } finally {
      setLoadingLowStock(false);
    }
  };

  const loadUtilizationReports = async () => {
    setLoadingUtilization(true);
    try {
      const params: any = {};
      if (utilizationCategory) params.category = utilizationCategory;
      if (utilizationRateMin) params.utilization_rate_min = parseFloat(utilizationRateMin);
      if (utilizationRateMax) params.utilization_rate_max = parseFloat(utilizationRateMax);
      if (periodFilter) params.period = periodFilter;

      const data = await withRetry(() => getUtilizationReports(params));
      setUtilizationReports(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading utilization reports");
    } finally {
      setLoadingUtilization(false);
    }
  };

  const handleCreateReplenishmentRequests = async () => {
    setCreatingReplenishment(true);
    try {
      const data = await withRetry(() =>
        autoCreateReplenishmentRequests({
          category: lowStockCategory || undefined,
          min_stock_threshold: undefined,
        })
      );
      showToast("Replenishment requests created successfully", "success");
      setShowReplenishmentModal(false);
      if (data?.requests_created) {
        showToast(`${data.requests_created.length} requests created`, "success");
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "creating replenishment requests");
    } finally {
      setCreatingReplenishment(false);
    }
  };

  // Chart data preparation
  const assignmentTrendsChartData = useMemo(() => {
    if (!assignmentTrends?.trends) return null;

    const trends = assignmentTrends.trends;
    return {
      labels: trends.map((t: any) => t.period || t.date),
      datasets: [
        {
          label: "Assignments",
          data: trends.map((t: any) => t.count || 0),
          backgroundColor: "rgba(37, 99, 235, 0.6)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 2,
        },
      ],
    };
  }, [assignmentTrends]);

  const utilizationByCategoryData = useMemo(() => {
    if (!utilizationReports?.by_category) return null;

    const categories = utilizationReports.by_category;
    return {
      labels: categories.map((c: any) => c.category || "Unknown"),
      datasets: [
        {
          data: categories.map((c: any) => c.utilization_rate || 0),
          backgroundColor: [
            "#2563eb",
            "#22d3ee",
            "#f59e42",
            "#f43f5e",
            "#a3e635",
            "#fbbf24",
            "#8b5cf6",
          ],
        },
      ],
    };
  }, [utilizationReports]);

  // Table columns
  const mostUsedItemsColumns: TableColumn<any>[] = [
    { key: "item_name", label: "Item Name", sortable: true },
    { key: "usage_count", label: "Usage Count", sortable: true },
    {
      key: "last_used",
      label: "Last Used",
      render: (row) => (row.last_used ? formatDate(row.last_used) : "Never"),
    },
  ];

  const lowStockColumns: TableColumn<any>[] = [
    { key: "item_name", label: "Item Name", sortable: true },
    { key: "current_quantity", label: "Current Qty", sortable: true },
    { key: "min_stock_level", label: "Min Stock", sortable: true },
    {
      key: "difference",
      label: "Difference",
      render: (row) => {
        const diff = (row.current_quantity || 0) - (row.min_stock_level || 0);
        return <span className={diff < 0 ? "text-red-600 font-semibold" : ""}>{diff}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const current = row.current_quantity || 0;
        const min = row.min_stock_level || 0;
        if (current === 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (current < min) return <Badge variant="danger">Critical</Badge>;
        if (current < min * 1.2) return <Badge variant="warning">Low</Badge>;
        return <Badge variant="success">OK</Badge>;
      },
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (row) => row.supplier_name || "-",
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

  const utilizationColumns: TableColumn<any>[] = [
    { key: "item_name", label: "Item Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    {
      key: "utilization_rate",
      label: "Utilization Rate",
      render: (row) => `${(row.utilization_rate || 0).toFixed(1)}%`,
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const rate = row.utilization_rate || 0;
        if (rate >= 80) return <Badge variant="success">High</Badge>;
        if (rate >= 40) return <Badge variant="info">Medium</Badge>;
        return <Badge variant="warning">Low</Badge>;
      },
    },
  ];

  const criticalItems = useMemo(() => {
    return lowStockAlerts.filter(
      (item) => (item.current_quantity || 0) < (item.min_stock_level || 0)
    );
  }, [lowStockAlerts]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <PageSkeleton count={3} layout="card" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive inventory usage and trends</p>
        </div>
        <ButtonLoader
          loading={loadingUsage || loadingTrends || loadingLowStock || loadingUtilization}
          onClick={loadAllData}
          label="Refresh All"
          variant="primary"
          size="md"
        />
      </div>

      {/* Usage Analytics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Usage Analytics
          </h2>
          <div className="flex gap-2">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              onBlur={loadUsageAnalytics}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            <ButtonLoader
              loading={loadingUsage}
              onClick={loadUsageAnalytics}
              label="Apply"
              variant="secondary"
              size="sm"
            />
          </div>
        </div>

        {loadingUsage ? (
          <PageSkeleton count={1} layout="table" />
        ) : usageAnalytics?.most_used_items ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Most Used Items</h3>
              <Table
                columns={mostUsedItemsColumns}
                data={usageAnalytics.most_used_items || []}
                emptyMessage="No usage data available"
              />
            </div>
            {usageAnalytics.utilization_rates && (
              <div>
                <h3 className="text-lg font-medium mb-3">Utilization Rates</h3>
                <Bar
                  data={{
                    labels: usageAnalytics.utilization_rates.map((r: any) => r.item_name),
                    datasets: [
                      {
                        label: "Utilization Rate (%)",
                        data: usageAnalytics.utilization_rates.map((r: any) => r.rate || 0),
                        backgroundColor: "rgba(37, 99, 235, 0.6)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true, max: 100 },
                    },
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No usage analytics data available</div>
        )}
      </div>

      {/* Assignment Trends Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CubeIcon className="w-5 h-5" />
            Assignment Trends
          </h2>
          <div className="flex gap-2 flex-wrap">
            <select
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ButtonLoader
              loading={loadingTrends}
              onClick={loadAssignmentTrends}
              label="Apply"
              variant="secondary"
              size="sm"
            />
          </div>
        </div>

        {loadingTrends ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : assignmentTrendsChartData ? (
          <Line
            data={assignmentTrendsChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: true },
                title: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        ) : (
          <div className="text-center text-gray-500 py-8">No assignment trends data available</div>
        )}
      </div>

      {/* Low Stock Alerts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            Low Stock Alerts
            {criticalItems.length > 0 && (
              <Badge variant="danger">{criticalItems.length} Critical</Badge>
            )}
          </h2>
          <div className="flex gap-2">
            <ButtonLoader
              loading={loadingLowStock}
              onClick={loadLowStockAlerts}
              label="Refresh"
              variant="secondary"
              size="sm"
            />
            {criticalItems.length > 0 && (
              <ButtonLoader
                loading={false}
                onClick={() => setShowReplenishmentModal(true)}
                label="Create Replenishment Requests"
                variant="primary"
                size="sm"
              />
            )}
          </div>
        </div>

        {loadingLowStock ? (
          <PageSkeleton count={1} layout="table" />
        ) : lowStockAlerts.length > 0 ? (
          <Table
            columns={lowStockColumns}
            data={lowStockAlerts}
            emptyMessage="No low stock items"
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            No low stock items. All items are well stocked!
          </div>
        )}
      </div>

      {/* Utilization Reports Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Utilization Reports
          </h2>
          <ButtonLoader
            loading={loadingUtilization}
            onClick={loadUtilizationReports}
            label="Refresh"
            variant="secondary"
            size="sm"
          />
        </div>

        {loadingUtilization ? (
          <PageSkeleton count={1} layout="table" />
        ) : utilizationReports ? (
          <div className="space-y-6">
            {utilizationReports.items && (
              <div>
                <h3 className="text-lg font-medium mb-3">Item Utilization</h3>
                <Table
                  columns={utilizationColumns}
                  data={utilizationReports.items || []}
                  emptyMessage="No utilization data available"
                />
              </div>
            )}
            {utilizationByCategoryData && (
              <div>
                <h3 className="text-lg font-medium mb-3">Utilization by Category</h3>
                <div className="max-w-md">
                  <Pie
                    data={utilizationByCategoryData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "right" },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No utilization reports data available
          </div>
        )}
      </div>

      {/* Replenishment Modal */}
      <Modal
        isOpen={showReplenishmentModal}
        onClose={() => setShowReplenishmentModal(false)}
        title="Create Replenishment Requests"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will create replenishment requests for {criticalItems.length} items that are below
            their minimum stock levels.
          </p>
          <div className="max-h-64 overflow-y-auto">
            <ul className="list-disc list-inside space-y-1">
              {criticalItems.map((item) => (
                <li key={item.item_id} className="text-sm text-gray-700">
                  {item.item_name} (Current: {item.current_quantity}, Min: {item.min_stock_level})
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setShowReplenishmentModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <ButtonLoader
              loading={creatingReplenishment}
              onClick={handleCreateReplenishmentRequests}
              label="Create Requests"
              variant="primary"
              size="md"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryAnalyticsPage;

