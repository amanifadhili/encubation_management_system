import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  title?: string;
  includeCharts?: boolean;
  sections?: string[];
  template?: 'executive' | 'detailed' | 'compliance';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ReportData {
  summary?: any;
  details?: any[];
  metrics?: any;
  charts?: any[];
  generated_at?: string;
}

export class ExportManager {
  /**
   * Main export function that handles different formats
   */
  static async exportReport(data: ReportData, options: ExportOptions): Promise<void> {
    const { format } = options;
    const title = options.title || 'Incubation Management Report';

    try {
      switch (format) {
        case 'pdf':
          await this.exportToPDF(data, options);
          break;
        case 'excel':
          await this.exportToExcel(data, options);
          break;
        case 'csv':
          await this.exportToCSV(data, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export to professional PDF with multiple sections
   */
  private static async exportToPDF(data: ReportData, options: ExportOptions): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const title = options.title || 'Incubation Management Report';

    // Cover page
    this.addCoverPage(pdf, title, data.generated_at);
    pdf.addPage();

    // Executive summary
    yPosition = this.addExecutiveSummary(pdf, data, yPosition);

    // Key metrics dashboard
    if (data.metrics) {
      pdf.addPage();
      yPosition = this.addKeyMetrics(pdf, data.metrics, 20);
    }

    // Detailed sections based on template
    if (options.template === 'detailed' && data.details) {
      pdf.addPage();
      yPosition = this.addDetailedTables(pdf, data.details, 20);
    }

    // Charts section (if charts are provided)
    if (options.includeCharts && data.charts) {
      pdf.addPage();
      yPosition = this.addChartsSection(pdf, data.charts, 20);
    }

    // Save the PDF
    const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  /**
   * Add professional cover page
   */
  private static addCoverPage(pdf: jsPDF, title: string, generatedAt?: string): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INCUBATION MANAGEMENT SYSTEM', pageWidth / 2, 50, { align: 'center' });

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text(title.toUpperCase(), pageWidth / 2, 80, { align: 'center' });

    // Subtitle
    pdf.setFontSize(12);
    pdf.text('Comprehensive Analytics & Insights Report', pageWidth / 2, 100, { align: 'center' });

    // Generation info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const generationDate = generatedAt ? new Date(generatedAt).toLocaleDateString() : new Date().toLocaleDateString();
    pdf.text(`Generated on: ${generationDate}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

    // Footer
    pdf.setFontSize(8);
    pdf.text('Confidential - For Internal Use Only', pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  /**
   * Add executive summary section
   */
  private static addExecutiveSummary(pdf: jsPDF, data: ReportData, yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EXECUTIVE SUMMARY', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    if (data.summary) {
      const summary = data.summary;

      // Key highlights
      const highlights = [
        `Total Teams: ${summary.total_teams || 0}`,
        `Active Teams: ${summary.active_teams || 0}`,
        `Total Projects: ${summary.total_projects || 0}`,
        `Project Completion Rate: ${summary.project_completion_rate ? summary.project_completion_rate.toFixed(1) + '%' : 'N/A'}`,
        `Total Users: ${summary.total_users || 0}`,
        `System Health: Excellent`
      ];

      highlights.forEach(highlight => {
        pdf.text(`• ${highlight}`, 25, yPosition);
        yPosition += 8;
      });
    }

    return yPosition + 10;
  }

  /**
   * Add key metrics dashboard
   */
  private static addKeyMetrics(pdf: jsPDF, metrics: any, yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KEY METRICS DASHBOARD', 20, yPosition);
    yPosition += 15;

    // Create metrics table
    const tableData = [
      ['Metric', 'Value', 'Status'],
      ['Total Users', metrics.total_users || 0, this.getStatusIndicator(metrics.total_users, 10)],
      ['Active Users', metrics.active_users || 0, this.getStatusIndicator(metrics.active_users, 5)],
      ['Total Teams', metrics.total_teams || 0, this.getStatusIndicator(metrics.total_teams, 5)],
      ['Active Teams', metrics.active_teams || 0, this.getStatusIndicator(metrics.active_teams, 3)],
      ['Total Projects', metrics.total_projects || 0, this.getStatusIndicator(metrics.total_projects, 10)],
      ['Project Completion Rate', `${metrics.project_completion_rate || 0}%`, this.getStatusIndicator(metrics.project_completion_rate, 50)],
      ['Total Inventory Items', metrics.total_inventory_items || 0, this.getStatusIndicator(metrics.total_inventory_items, 20)],
      ['Inventory Utilization', `${metrics.inventory_utilization || 0}%`, this.getStatusIndicator(metrics.inventory_utilization, 60)],
      ['Total Requests', metrics.total_requests || 0, this.getStatusIndicator(metrics.total_requests, 15)],
      ['Request Approval Rate', `${metrics.request_approval_rate || 0}%`, this.getStatusIndicator(metrics.request_approval_rate, 70)]
    ];

    (pdf as any).autoTable({
      startY: yPosition,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });

    return (pdf as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add detailed data tables
   */
  private static addDetailedTables(pdf: jsPDF, details: any[], yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILED ANALYSIS', 20, yPosition);
    yPosition += 15;

    if (details.length > 0) {
      // Prepare table data
      const tableData = details.map((item, index) => [
        index + 1,
        item.name || item.team_name || item.title || 'N/A',
        item.status || 'N/A',
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
        item.metrics ? JSON.stringify(item.metrics) : 'N/A'
      ]);

      (pdf as any).autoTable({
        startY: yPosition,
        head: [['#', 'Name', 'Status', 'Created', 'Metrics']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' }
        }
      });

      return (pdf as any).lastAutoTable.finalY + 15;
    }

    return yPosition;
  }

  /**
   * Add charts section (placeholder for future chart integration)
   */
  private static addChartsSection(pdf: jsPDF, charts: any[], yPosition: number): number {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VISUAL ANALYTICS', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Charts and visualizations would be included here in an enhanced version.', 20, yPosition);

    return yPosition + 20;
  }

  /**
   * Export to Excel format
   */
  private static async exportToExcel(data: ReportData, options: ExportOptions): Promise<void> {
    const workbook = XLSX.utils.book_new();
    const title = options.title || 'Incubation Management Report';

    // Summary sheet
    if (data.summary) {
      const summarySheet = XLSX.utils.json_to_sheet([data.summary]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Metrics sheet
    if (data.metrics) {
      const metricsSheet = XLSX.utils.json_to_sheet([data.metrics]);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');
    }

    // Details sheet
    if (data.details && data.details.length > 0) {
      const detailsSheet = XLSX.utils.json_to_sheet(data.details);
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Details');
    }

    // Save file
    const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Export to CSV format
   */
  private static async exportToCSV(data: ReportData, options: ExportOptions): Promise<void> {
    let csvContent = '';
    const title = options.title || 'Incubation Management Report';

    // Summary data
    if (data.summary) {
      csvContent += 'Summary\n';
      csvContent += Object.entries(data.summary).map(([key, value]) => `${key},${value}`).join('\n');
      csvContent += '\n\n';
    }

    // Metrics data
    if (data.metrics) {
      csvContent += 'Metrics\n';
      csvContent += Object.entries(data.metrics).map(([key, value]) => `${key},${value}`).join('\n');
      csvContent += '\n\n';
    }

    // Details data
    if (data.details && data.details.length > 0) {
      csvContent += 'Details\n';
      const headers = Object.keys(data.details[0]).join(',');
      csvContent += headers + '\n';
      data.details.forEach(item => {
        const values = Object.values(item).join(',');
        csvContent += values + '\n';
      });
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get status indicator for metrics
   */
  private static getStatusIndicator(value: number, threshold: number): string {
    if (value >= threshold) return '✓ Good';
    if (value >= threshold * 0.7) return '! Warning';
    return '✗ Critical';
  }

  /**
   * Export chart as image (for future use)
   */
  static async exportChartAsImage(chartElement: HTMLElement): Promise<string> {
    const canvas = await html2canvas(chartElement);
    return canvas.toDataURL('image/png');
  }
}

// Export types are already exported as interfaces above