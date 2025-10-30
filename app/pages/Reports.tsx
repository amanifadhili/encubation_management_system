import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { getTeamsReport, getInventoryReport, getProjectsReport, exportReport } from "../services/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Reports = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [teamsReport, setTeamsReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [projectsReport, setProjectsReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load reports on mount
  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    try {
      const [teams, inventory, projects] = await Promise.all([
        getTeamsReport(),
        getInventoryReport(),
        getProjectsReport()
      ]);
      setTeamsReport(teams);
      setInventoryReport(inventory);
      setProjectsReport(projects);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading reports');
    } finally {
      setLoading(false);
    }
  };

  // Export as PDF (simplified)
  const handleExport = async () => {
    try {
      await exportReport({ type: 'teams' });
      showToast("Report exported!", "success");
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'exporting report');
    }
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
            <div className="text-white opacity-90 mb-2">View comprehensive reports and export data.</div>
          </div>
          <button
            className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
            onClick={handleExport}
          >
            Export Report
          </button>
        </div>

        {loading ? (
          <div className="text-center text-blue-400 py-12">Loading reports...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Teams Report</h3>
              {teamsReport?.summary ? (
                <div className="text-blue-700">
                  <div>Total Teams: {teamsReport.summary.total_teams || 0}</div>
                  <div>Active Teams: {teamsReport.summary.active_teams || 0}</div>
                  <div>Completed Projects: {teamsReport.summary.total_projects || 0}</div>
                </div>
              ) : (
                <div className="text-blue-400">No team data available</div>
              )}
            </div>

            <div className="bg-white rounded shadow p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Inventory Report</h3>
              {inventoryReport?.summary ? (
                <div className="text-blue-700">
                  <div>Total Items: {inventoryReport.summary.total_items || 0}</div>
                  <div>Assigned Items: {inventoryReport.summary.assigned_quantity || 0}</div>
                  <div>Available Items: {inventoryReport.summary.available_quantity || 0}</div>
                </div>
              ) : (
                <div className="text-blue-400">No inventory data available</div>
              )}
            </div>

            <div className="bg-white rounded shadow p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Projects Report</h3>
              {projectsReport?.summary ? (
                <div className="text-blue-700">
                  <div>Total Projects: {projectsReport.summary.total_projects || 0}</div>
                  <div>Active Projects: {projectsReport.summary.active_projects || 0}</div>
                  <div>Completed Projects: {projectsReport.summary.completed_projects || 0}</div>
                </div>
              ) : (
                <div className="text-blue-400">No project data available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 