import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import { getTeamsReport, getInventoryReport, getProjectsReport, exportReport } from "../services/api";
import jsPDF from "jspdf";
import { ButtonLoader, PageSkeleton } from "../components/loading";

const Reports = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [teamsReport, setTeamsReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [projectsReport, setProjectsReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load reports on mount
  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadReports(true);
  };

  // Export as PDF
  const handleExport = async () => {
    setExporting(true);
    try {
      console.log('Starting report export...');
      console.log('Sending request with:', { report_type: 'teams' });

      const result = await exportReport({ report_type: 'teams' });
      console.log('Export result received:', result);

      if (result && result.success && result.data) {
        console.log('Export successful, generating PDF with data:', result.data);

        // Generate PDF using the data
        const pdf = new jsPDF();

        // Add title
        pdf.setFontSize(20);
        pdf.text('Teams Report', 20, 30);

        // Add generation date
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);

        // Add summary
        pdf.setFontSize(16);
        pdf.text('Summary', 20, 65);

        const summary = result.data.summary;
        pdf.setFontSize(12);
        let yPos = 80;
        pdf.text(`Total Teams: ${summary.total_teams || 0}`, 20, yPos);
        yPos += 10;
        pdf.text(`Active Teams: ${summary.active_teams || 0}`, 20, yPos);
        yPos += 10;
        pdf.text(`Pending Teams: ${summary.pending_teams || 0}`, 20, yPos);
        yPos += 10;
        pdf.text(`Total Projects: ${summary.total_projects || 0}`, 20, yPos);
        yPos += 10;
        pdf.text(`Total Members: ${summary.total_members || 0}`, 20, yPos);
        yPos += 10;
        pdf.text(`Total Mentors: ${summary.total_mentors || 0}`, 20, yPos);

        // Add teams table
        yPos += 20;
        pdf.setFontSize(16);
        pdf.text('Teams Details', 20, yPos);
        yPos += 10;

        const teams = result.data.teams || [];
        if (teams.length > 0) {
          // Simple table implementation without autoTable
          pdf.setFontSize(10);
          const colWidth = 35;
          const rowHeight = 8;

          // Table headers
          pdf.setFont('helvetica', 'bold');
          pdf.text('Team Name', 20, yPos);
          pdf.text('Company', 20 + colWidth, yPos);
          pdf.text('Status', 20 + colWidth * 2, yPos);
          pdf.text('Members', 20 + colWidth * 3, yPos);
          pdf.text('Projects', 20 + colWidth * 4, yPos);
          pdf.text('Mentors', 20 + colWidth * 5, yPos);

          yPos += rowHeight;
          pdf.setFont('helvetica', 'normal');

          // Draw header line
          pdf.line(20, yPos - 2, 20 + colWidth * 6, yPos - 2);

          // Table data
          teams.forEach((team: any) => {
            if (yPos > 250) { // New page if needed
              pdf.addPage();
              yPos = 30;
            }

            pdf.text(team.team_name || 'N/A', 20, yPos);
            pdf.text((team.company_name || 'N/A').substring(0, 8), 20 + colWidth, yPos);
            pdf.text(team.status || 'N/A', 20 + colWidth * 2, yPos);
            pdf.text(String(team.member_count || 0), 20 + colWidth * 3, yPos);
            pdf.text(String(team.project_count || 0), 20 + colWidth * 4, yPos);
            pdf.text(String(team.mentor_count || 0), 20 + colWidth * 5, yPos);

            yPos += rowHeight;
          });
        }

        // Save the PDF
        const fileName = `teams_report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        console.log('PDF generated and downloaded:', fileName);
        showToast("Report exported and downloaded successfully!", "success");
      } else {
        console.error('Export failed with result:', result);
        showToast("Report export failed. Check console for details.", "error");
      }
    } catch (error: any) {
      console.error('Export error details:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);

      // Show more specific error message
      if (error.response?.data?.message) {
        showToast(`Export failed: ${error.response.data.message}`, "error");
      } else if (error.response?.data?.details) {
        showToast(`Export failed: ${error.response.data.details}`, "error");
      } else {
        ErrorHandler.handleError(error, showToast, 'exporting report');
      }
    } finally {
      setExporting(false);
    }
  };

  // Test function to check if backend is responding
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const result = await getTeamsReport();
      console.log('Backend test result:', result);
      showToast("Backend connection successful!", "success");
    } catch (error: any) {
      console.error('Backend test failed:', error);
      showToast("Backend connection failed!", "error");
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
          <div className="flex gap-2">
            <ButtonLoader
              onClick={handleRefresh}
              loading={refreshing}
              label="Refresh"
              loadingText="Refreshing..."
              variant="secondary"
              size="md"
            />
            <ButtonLoader
              onClick={testBackendConnection}
              loading={false}
              label="Test Backend"
              variant="outline"
              size="md"
            />
            <ButtonLoader
              onClick={handleExport}
              loading={exporting}
              label="Export Report"
              loadingText="Exporting..."
              variant="success"
              size="md"
            />
          </div>
        </div>

        {loading ? (
          <PageSkeleton count={3} layout="card" />
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