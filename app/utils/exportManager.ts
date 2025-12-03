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
  filters?: any;
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
    const title = options.title || 'Incubation Management Report';

    // Track page numbers for headers/footers
    let currentPage = 1;
    const totalPages: number[] = []; // We'll calculate this after adding all content

    // Cover page
    this.addCoverPage(pdf, title, data.generated_at);
    currentPage++;
    pdf.addPage();

    // Add header and footer to all subsequent pages
    const addHeaderFooter = (pageNum: number) => {
      this.addPageHeader(pdf, title, pageNum);
      this.addPageFooter(pdf, pageNum);
    };

    // Executive summary
    let yPosition = 30; // Start below header
    addHeaderFooter(currentPage);
    yPosition = this.addExecutiveSummary(pdf, data, yPosition);

    // Key metrics dashboard
    if (data.metrics) {
      // Check if we need a new page
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        currentPage++;
        addHeaderFooter(currentPage);
        yPosition = 30;
      } else {
        yPosition += 20;
      }
      yPosition = this.addKeyMetrics(pdf, data.metrics, yPosition);
    }

    // Detailed sections based on template
    if (options.template === 'detailed' && data.details) {
      // Check if we need a new page
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        currentPage++;
        addHeaderFooter(currentPage);
        yPosition = 30;
      } else {
        yPosition += 20;
      }
      yPosition = this.addDetailedTables(pdf, data.details, yPosition, addHeaderFooter);
    }

    // Charts section (if charts are provided)
    if (options.includeCharts && data.charts) {
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        currentPage++;
        addHeaderFooter(currentPage);
        yPosition = 30;
      } else {
        yPosition += 20;
      }
      yPosition = this.addChartsSection(pdf, data.charts, yPosition);
    }

    // Add header/footer to last page if not already added
    const finalPageNum = pdf.internal.pages.length;
    if (finalPageNum !== currentPage) {
      addHeaderFooter(finalPageNum);
    }

    // Save the PDF
    const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  /**
   * Add professional cover page with enhanced design
   */
  private static addCoverPage(pdf: jsPDF, title: string, generatedAt?: string): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Draw colored header bar
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(0, 0, pageWidth, 60, 'F');

    // Draw decorative line at bottom of header
    pdf.setDrawColor(59, 130, 246); // Blue-500
    pdf.setLineWidth(0.5);
    pdf.line(0, 60, pageWidth, 60);

    // System name in header (white text)
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INCUBATION MANAGEMENT SYSTEM', pageWidth / 2, 35, { align: 'center' });

    // Subtitle in header
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Comprehensive Analytics & Insights Platform', pageWidth / 2, 50, { align: 'center' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Main title box
    const titleBoxY = 90;
    const titleBoxHeight = 50;
    
    // Draw title background box
    pdf.setFillColor(243, 244, 246); // Gray-100
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.setLineWidth(1);
    pdf.roundedRect(20, titleBoxY, pageWidth - 40, titleBoxHeight, 3, 3, 'FD');

    // Title text
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138); // Blue-900
    pdf.text(title.toUpperCase(), pageWidth / 2, titleBoxY + 30, { align: 'center', maxWidth: pageWidth - 60 });

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Decorative line under title box
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2);
    pdf.line(30, titleBoxY + titleBoxHeight + 10, pageWidth - 30, titleBoxY + titleBoxHeight + 10);

    // Generation info box
    const infoBoxY = pageHeight - 80;
    pdf.setFillColor(249, 250, 251); // Gray-50
    pdf.setDrawColor(209, 213, 219); // Gray-300
    pdf.setLineWidth(0.5);
    pdf.roundedRect(40, infoBoxY, pageWidth - 80, 40, 3, 3, 'FD');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99); // Gray-600
    const generationDate = generatedAt ? new Date(generatedAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    pdf.text(`Generated on: ${generationDate}`, pageWidth / 2, infoBoxY + 15, { align: 'center' });
    pdf.text('Confidential - For Internal Use Only', pageWidth / 2, infoBoxY + 30, { align: 'center' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add professional page header
   */
  private static addPageHeader(pdf: jsPDF, title: string, pageNum: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Draw header bar
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(0, 0, pageWidth, 25, 'F');

    // Title in header (white text)
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 20, 17, { maxWidth: pageWidth - 60 });

    // Page number in header
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageNum}`, pageWidth - 20, 17, { align: 'right' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Draw line under header
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.line(0, 25, pageWidth, 25);
  }

  /**
   * Add professional page footer
   */
  private static addPageFooter(pdf: jsPDF, pageNum: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Draw line above footer
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.setLineWidth(0.5);
    pdf.line(0, pageHeight - 20, pageWidth, pageHeight - 20);

    // Footer text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.text('© Incubation Management System - Confidential Document', pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 10, { align: 'right' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add executive summary section with professional styling
   */
  private static addExecutiveSummary(pdf: jsPDF, data: ReportData, yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Section title with colored background
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EXECUTIVE SUMMARY', 25, yPosition + 2);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;

    // Add filter information box if available
    if (data.filters) {
      pdf.setFillColor(249, 250, 251); // Gray-50
      pdf.setDrawColor(209, 213, 219); // Gray-300
      pdf.setLineWidth(0.5);
      const filterBoxHeight = 50;
      pdf.roundedRect(20, yPosition, pageWidth - 40, filterBoxHeight, 3, 3, 'FD');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 138); // Blue-900
      pdf.text('APPLIED FILTERS', 25, yPosition + 8);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99); // Gray-600
      
      let filterY = yPosition + 18;
      const filterLines = [
        { label: 'Report Type', value: data.filters.report_type || 'N/A' },
        { label: 'Date Range', value: `${data.filters.date_from || 'All'} to ${data.filters.date_to || 'All'}` },
        { label: 'Status', value: data.filters.status || 'All' },
        { label: 'Category', value: data.filters.category || 'All' },
        { label: 'Sort By', value: `${data.filters.sort_by || 'N/A'} (${data.filters.sort_order || 'N/A'})` }
      ];

      filterLines.forEach((line, index) => {
        const xPos = index % 2 === 0 ? 25 : pageWidth / 2;
        if (index % 2 === 0) filterY = yPosition + 18 + Math.floor(index / 2) * 10;
        pdf.text(`${line.label}:`, xPos, filterY);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.value, xPos + 35, filterY);
        pdf.setFont('helvetica', 'normal');
      });

      yPosition += filterBoxHeight + 15;
      pdf.setTextColor(0, 0, 0);
    }

    // Summary highlights box
    if (data.summary) {
      const summary = data.summary;
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(1);
      const summaryBoxHeight = 120;
      pdf.roundedRect(20, yPosition, pageWidth - 40, summaryBoxHeight, 3, 3, 'FD');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 138);
      pdf.text('KEY HIGHLIGHTS', 25, yPosition + 8);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      // Key highlights - dynamically build based on what's available
      const highlights: string[] = [];
      
      if (summary.total_teams !== undefined) highlights.push(`Total Teams: ${summary.total_teams}`);
      if (summary.active_teams !== undefined) highlights.push(`Active Teams: ${summary.active_teams}`);
      if (summary.total_projects !== undefined) highlights.push(`Total Projects: ${summary.total_projects}`);
      if (summary.active_projects !== undefined) highlights.push(`Active Projects: ${summary.active_projects}`);
      if (summary.completed_projects !== undefined) highlights.push(`Completed Projects: ${summary.completed_projects}`);
      if (summary.total_inventory !== undefined) highlights.push(`Total Inventory: ${summary.total_inventory}`);
      if (summary.assigned_quantity !== undefined) highlights.push(`Assigned Items: ${summary.assigned_quantity}`);
      if (summary.available_quantity !== undefined) highlights.push(`Available Items: ${summary.available_quantity}`);
      if (summary.total !== undefined) highlights.push(`Total Records: ${summary.total}`);
      if (summary.active !== undefined) highlights.push(`Active: ${summary.active}`);
      if (summary.pending !== undefined) highlights.push(`Pending: ${summary.pending}`);
      if (summary.completed !== undefined) highlights.push(`Completed: ${summary.completed}`);
      if (summary.project_completion_rate !== undefined) {
        highlights.push(`Project Completion Rate: ${summary.project_completion_rate.toFixed(1)}%`);
      }
      if (summary.total_users !== undefined) highlights.push(`Total Users: ${summary.total_users}`);

      if (highlights.length > 0) {
        let highlightY = yPosition + 20;
        highlights.forEach((highlight, index) => {
          const xPos = index % 2 === 0 ? 30 : pageWidth / 2;
          if (index % 2 === 0) highlightY = yPosition + 20 + Math.floor(index / 2) * 10;
          
          // Bullet point
          pdf.setFillColor(37, 99, 235);
          pdf.circle(xPos - 5, highlightY - 2, 1.5, 'F');
          
          pdf.text(highlight, xPos, highlightY);
        });
      }

      yPosition += summaryBoxHeight + 15;
    }

    return yPosition;
  }

  /**
   * Add key metrics dashboard with professional styling
   */
  private static addKeyMetrics(pdf: jsPDF, metrics: any, yPosition: number): number {
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Section title with colored background
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KEY METRICS DASHBOARD', 25, yPosition + 2);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;

    // Create metrics table with enhanced styling
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
      theme: 'striped',
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        lineColor: [229, 231, 235],
        lineWidth: 0.5
      },
      headStyles: { 
        fillColor: [37, 99, 235], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    return (pdf as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add detailed data tables with all columns - professional styling
   */
  private static addDetailedTables(pdf: jsPDF, details: any[], yPosition: number, addHeaderFooter: (pageNum: number) => void): number {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Section title with colored background
    pdf.setFillColor(37, 99, 235); // Blue-600
    pdf.rect(20, yPosition - 8, pageWidth - 40, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILED ANALYSIS', 25, yPosition + 2);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;

    if (details.length > 0) {
      // Get all unique keys from all items to build comprehensive columns
      const allKeys = new Set<string>();
      details.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      // Exclude certain keys that shouldn't be in the table
      const excludeKeys = new Set(['id', 'metrics']);
      const columns = Array.from(allKeys).filter(key => !excludeKeys.has(key));

      // Build headers
      const headers = columns.map(key => {
        // Format header names
        return key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      });

      // Build table data
      const tableData = details.map((item, index) => {
        return columns.map(col => {
          const value = item[col];
          if (value === null || value === undefined) return 'N/A';
          if (typeof value === 'object') return JSON.stringify(value).substring(0, 50);
          return String(value);
        });
      });

      // Calculate column widths dynamically
      const numColumns = columns.length;
      const availableWidth = pageWidth - 40; // Margins
      const baseWidth = availableWidth / numColumns;
      const columnStyles: any = {};
      
      columns.forEach((col, index) => {
        // Give more width to name/title columns
        if (col.includes('name') || col.includes('title') || col.includes('email')) {
          columnStyles[index] = { cellWidth: baseWidth * 1.5 };
        } else if (col.includes('description')) {
          columnStyles[index] = { cellWidth: baseWidth * 2 };
        } else {
          columnStyles[index] = { cellWidth: baseWidth };
        }
      });

      // Add info about number of records
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Total Records: ${details.length}`, 20, yPosition);
      yPosition += 10;
      pdf.setTextColor(0, 0, 0);

      (pdf as any).autoTable({
        startY: yPosition,
        head: [headers],
        body: tableData,
        theme: 'striped',
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          lineColor: [229, 231, 235],
          lineWidth: 0.5,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [37, 99, 235], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: columnStyles,
        margin: { left: 20, right: 20 },
        didDrawPage: (data: any) => {
          // Add header and footer on each page
          // data.pageNumber is provided by jsPDF-autoTable callback
          const pageNum = data.pageNumber || pdf.internal.pages.length;
          addHeaderFooter(pageNum);
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

    // Filters sheet (if available)
    if (data.filters) {
      const filtersSheet = XLSX.utils.json_to_sheet([data.filters]);
      XLSX.utils.book_append_sheet(workbook, filtersSheet, 'Filters');
    }

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

    // Details sheet - include all columns
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

    // Filter information
    if (data.filters) {
      csvContent += 'Applied Filters\n';
      csvContent += Object.entries(data.filters).map(([key, value]) => `${key},${value}`).join('\n');
      csvContent += '\n\n';
    }

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

    // Details data - include all columns
    if (data.details && data.details.length > 0) {
      csvContent += 'Details\n';
      // Get all unique keys from all items
      const allKeys = new Set<string>();
      data.details.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });
      const headers = Array.from(allKeys).join(',');
      csvContent += headers + '\n';
      data.details.forEach(item => {
        const values = Array.from(allKeys).map(key => {
          const value = item[key];
          // Handle values that might contain commas
          if (value && typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value ?? '';
        }).join(',');
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