import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { withRetry } from "../utils/networkRetry";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import Table from "../components/Table";
import {
  getConsumptionReports,
  getDistributionReports,
  getUsagePatternAnalysis,
  getInventory,
  getIncubators,
} from "../services/api";
import { ChartBarIcon, CubeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { formatDate } from "../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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

const ConsumptionReportsPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // State for reports data
  const [consumptionData, setConsumptionData] = useState<any>(null);
  const [distributionData, setDistributionData] = useState<any>(null);
  const [usagePatterns, setUsagePatterns] = useState<any>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingConsumption, setLoadingConsumption] = useState(false);
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [itemFilter, setItemFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [distributedByFilter, setDistributedByFilter] = useState<string>("");
  
  // Dropdown data
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    loadDropdowns();
    loadAllData();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [inventoryData, teamsData] = await Promise.all([
        getInventory().catch(() => []),
        getIncubators().catch(() => []),
      ]);
      const items = inventoryData?.items || inventoryData?.data?.items || inventoryData || [];
      const teamsList = teamsData?.teams || teamsData?.data?.teams || teamsData || [];
      setInventoryItems(Array.isArray(items) ? items : []);
      setTeams(Array.isArray(teamsList) ? teamsList : []);
    } catch (error: any) {
      console.error("Error loading dropdowns:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadConsumptionReports(),
      loadDistributionReports(),
      loadUsagePatterns(),
    ]);
    setLoading(false);
  };

  const loadConsumptionReports = async () => {
    setLoadingConsumption(true);
    try {
      const params: any = {};
      if (periodFilter) params.period = periodFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (itemFilter) params.item_id = itemFilter;
      if (teamFilter) params.team_id = teamFilter;
      if (eventTypeFilter) params.event_type = eventTypeFilter;

      const data = await withRetry(() => getConsumptionReports(params));
      setConsumptionData(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading consumption reports");
    } finally {
      setLoadingConsumption(false);
    }
  };

  const loadDistributionReports = async () => {
    setLoadingDistribution(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (itemFilter) params.item_id = itemFilter;
      if (teamFilter) params.team_id = teamFilter;
      if (distributedByFilter) params.distributed_by = distributedByFilter;
      if (eventTypeFilter) params.event_type = eventTypeFilter;

      const data = await withRetry(() => getDistributionReports(params));
      setDistributionData(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading distribution reports");
    } finally {
      setLoadingDistribution(false);
    }
  };

  const loadUsagePatterns = async () => {
    setLoadingPatterns(true);
    try {
      const params: any = {};
      if (periodFilter) params.period = periodFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (itemFilter) params.item_id = itemFilter;
      if (teamFilter) params.team_id = teamFilter;

      const data = await withRetry(() => getUsagePatternAnalysis(params));
      setUsagePatterns(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading usage patterns");
    } finally {
      setLoadingPatterns(false);
    }
  };

  // Chart data
  const consumptionByItemChartData = useMemo(() => {
    if (!consumptionData?.by_item) return null;

    const items = consumptionData.by_item;
    return {
      labels: items.map((item: any) => item.item_name || "Unknown"),
      datasets: [
        {
          label: "Quantity Consumed",
          data: items.map((item: any) => item.total_quantity || 0),
          backgroundColor: "rgba(37, 99, 235, 0.6)",
        },
      ],
    };
  }, [consumptionData]);

  const consumptionByTeamChartData = useMemo(() => {
    if (!consumptionData?.by_team) return null;

    const teams = consumptionData.by_team;
    return {
      labels: teams.map((team: any) => team.team_name || "Unknown"),
      datasets: [
        {
          label: "Quantity Consumed",
          data: teams.map((team: any) => team.total_quantity || 0),
          backgroundColor: "rgba(16, 185, 129, 0.6)",
        },
      ],
    };
  }, [consumptionData]);

  const usagePatternChartData = useMemo(() => {
    if (!usagePatterns?.patterns) return null;

    const patterns = usagePatterns.patterns;
    return {
      labels: patterns.map((p: any) => p.period || p.date),
      datasets: [
        {
          label: "Consumption",
          data: patterns.map((p: any) => p.quantity || 0),
          backgroundColor: "rgba(245, 158, 11, 0.6)",
          borderColor: "rgba(245, 158, 11, 1)",
          borderWidth: 2,
        },
      ],
    };
  }, [usagePatterns]);

  // Table columns
  const consumptionByItemColumns: TableColumn<any>[] = [
    { key: "item_name", label: "Item Name", sortable: true },
    {
      key: "total_quantity",
      label: "Total Quantity Consumed",
      sortable: true,
    },
    { key: "consumption_count", label: "Consumption Events", sortable: true },
    {
      key: "consumption_frequency",
      label: "Frequency",
      render: (row) => `${(row.consumption_frequency || 0).toFixed(2)} per week`,
      sortable: true,
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

  const consumptionByTeamColumns: TableColumn<any>[] = [
    { key: "team_name", label: "Team", sortable: true },
    {
      key: "total_quantity",
      label: "Total Quantity Consumed",
      sortable: true,
    },
    { key: "consumption_count", label: "Consumption Events", sortable: true },
  ];

  const distributionColumns: TableColumn<any>[] = [
    { key: "recipient", label: "Recipient", sortable: true },
    { key: "item_name", label: "Item", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    {
      key: "distributed_at",
      label: "Date",
      render: (row) => (row.distributed_at ? formatDate(row.distributed_at) : "-"),
      sortable: true,
    },
    { key: "distributed_by", label: "Distributed By", sortable: true },
    { key: "event_type", label: "Event Type", sortable: true },
  ];

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Consumption Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Track consumption and distribution patterns</p>
        </div>
        <ButtonLoader
          loading={loadingConsumption || loadingDistribution || loadingPatterns}
          onClick={loadAllData}
          label="Refresh All"
          variant="primary"
          size="md"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Period</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item</label>
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Team</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.team_name || team.teamName || "Unnamed Team"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <ButtonLoader
              loading={loadingConsumption || loadingDistribution || loadingPatterns}
              onClick={loadAllData}
              label="Apply Filters"
              variant="primary"
              size="sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Event Type</label>
            <input
              type="text"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              placeholder="Filter by event type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Consumption Overview */}
      {consumptionData?.overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Consumption Logs</p>
            <p className="text-2xl font-bold text-gray-900">
              {consumptionData.overview.total_logs || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Quantity Consumed</p>
            <p className="text-2xl font-bold text-gray-900">
              {consumptionData.overview.total_quantity || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Average per Day</p>
            <p className="text-2xl font-bold text-gray-900">
              {(consumptionData.overview.average_per_day || 0).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Consumption by Item */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CubeIcon className="w-5 h-5" />
            Consumption by Item
          </h2>
          <ButtonLoader
            loading={loadingConsumption}
            onClick={loadConsumptionReports}
            label="Refresh"
            variant="secondary"
            size="sm"
          />
        </div>
        {loadingConsumption ? (
          <PageSkeleton count={1} layout="table" />
        ) : consumptionData?.by_item && consumptionData.by_item.length > 0 ? (
          <div className="space-y-4">
            {consumptionByItemChartData && (
              <div className="max-h-64">
                <Bar
                  data={consumptionByItemChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            )}
            <Table
              columns={consumptionByItemColumns}
              data={consumptionData.by_item}
              emptyMessage="No consumption data by item"
            />
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">No consumption data by item available</div>
        )}
      </div>

      {/* Consumption by Team */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Consumption by Team
          </h2>
          <ButtonLoader
            loading={loadingConsumption}
            onClick={loadConsumptionReports}
            label="Refresh"
            variant="secondary"
            size="sm"
          />
        </div>
        {loadingConsumption ? (
          <PageSkeleton count={1} layout="table" />
        ) : consumptionData?.by_team && consumptionData.by_team.length > 0 ? (
          <div className="space-y-4">
            {consumptionByTeamChartData && (
              <div className="max-h-64">
                <Bar
                  data={consumptionByTeamChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            )}
            <Table
              columns={consumptionByTeamColumns}
              data={consumptionData.by_team}
              emptyMessage="No consumption data by team"
            />
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">No consumption data by team available</div>
        )}
      </div>

      {/* Distribution Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Distribution Reports</h2>
          <ButtonLoader
            loading={loadingDistribution}
            onClick={loadDistributionReports}
            label="Refresh"
            variant="secondary"
            size="sm"
          />
        </div>
        {loadingDistribution ? (
          <PageSkeleton count={1} layout="table" />
        ) : distributionData?.distributions && distributionData.distributions.length > 0 ? (
          <Table
            columns={distributionColumns}
            data={distributionData.distributions}
            emptyMessage="No distribution data available"
          />
        ) : (
          <div className="text-center text-gray-600 py-8">No distribution data available</div>
        )}
      </div>

      {/* Usage Pattern Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Usage Pattern Analysis
          </h2>
          <ButtonLoader
            loading={loadingPatterns}
            onClick={loadUsagePatterns}
            label="Refresh"
            variant="secondary"
            size="sm"
          />
        </div>
        {loadingPatterns ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : usagePatternChartData ? (
          <div className="space-y-4">
            <Line
              data={usagePatternChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
            {usagePatterns?.trends && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Trend</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {usagePatterns.trends.direction || "Stable"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Rate of Change</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(usagePatterns.trends.rate_of_change || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Peak Period</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {usagePatterns.trends.peak_period || "N/A"}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">No usage pattern data available</div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionReportsPage;

