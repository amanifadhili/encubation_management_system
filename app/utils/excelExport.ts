/**
 * Excel export functionality for professional reports
 * Uses xlsx-js-style library to generate beautifully styled Excel files from report tables
 */

import * as XLSX from 'xlsx-js-style';
import {
  cloneElementForExport,
  removeNoPrintElements,
  hideColumnsForExport,
  hideColumnsByExportType,
} from './exportUtils';

export interface ExcelOptions {
  /** Excel filename */
  filename?: string;
  /** Sheet name */
  sheetName?: string;
  /** Column classes to hide in Excel */
  hideColumns?: string[];
  /** Whether to remove .no-print elements */
  removeNoPrint?: boolean;
  /** Whether to include report header info */
  includeHeader?: boolean;
  /** Column width settings */
  columnWidths?: Record<string, number>;
  /** Whether to hide columns based on export type classes */
  useExportTypeHiding?: boolean;
}

// Professional color scheme
const COLORS = {
  // Header colors - Professional blue
  headerBg: 'E7F0FF', // Light blue background
  headerText: '1F2937', // Dark gray text
  headerBorder: '94A3B8', // Medium gray border
  
  // Footer colors - Gray background
  footerBg: 'E5E7EB', // Light gray background
  footerText: '111827', // Very dark gray text
  footerBorder: '94A3B8',
  
  // Data row colors
  rowBg: 'FFFFFF', // White
  rowAltBg: 'F9FAFB', // Very light gray for alternating rows
  rowText: '374151', // Medium gray text
  rowBorder: 'E5E7EB', // Light gray border
  
  // Report header colors
  reportHeaderBg: 'F3F4F6', // Light gray
  reportHeaderText: '111827', // Very dark gray
  reportHeaderBorder: 'D1D5DB', // Medium gray
  
  // Accent colors
  accentBlue: '3B82F6', // Professional blue
  accentGreen: '10B981', // Success green
  accentRed: 'EF4444', // Error red
  accentAmber: 'F59E0B', // Warning amber
};

// Default cell style
const defaultCellStyle: XLSX.CellStyle = {
  font: {
    name: 'Calibri',
    sz: 11,
    color: { rgb: COLORS.rowText },
  },
  alignment: {
    vertical: 'center',
    horizontal: 'left',
    wrapText: true,
  },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.rowBorder } },
    bottom: { style: 'thin', color: { rgb: COLORS.rowBorder } },
    left: { style: 'thin', color: { rgb: COLORS.rowBorder } },
    right: { style: 'thin', color: { rgb: COLORS.rowBorder } },
  },
  fill: {
    fgColor: { rgb: COLORS.rowBg },
  },
};

// Header cell style
const headerCellStyle: XLSX.CellStyle = {
  font: {
    name: 'Calibri',
    sz: 11,
    bold: true,
    color: { rgb: COLORS.headerText },
  },
  alignment: {
    vertical: 'center',
    horizontal: 'center',
    wrapText: true,
  },
  border: {
    top: { style: 'medium', color: { rgb: COLORS.headerBorder } },
    bottom: { style: 'medium', color: { rgb: COLORS.headerBorder } },
    left: { style: 'thin', color: { rgb: COLORS.headerBorder } },
    right: { style: 'thin', color: { rgb: COLORS.headerBorder } },
  },
  fill: {
    fgColor: { rgb: COLORS.headerBg },
    patternType: 'solid',
  },
};

// Footer cell style
const footerCellStyle: XLSX.CellStyle = {
  font: {
    name: 'Calibri',
    sz: 11,
    bold: true,
    color: { rgb: COLORS.footerText },
  },
  alignment: {
    vertical: 'center',
    horizontal: 'left',
    wrapText: true,
  },
  border: {
    top: { style: 'medium', color: { rgb: COLORS.footerBorder } },
    bottom: { style: 'medium', color: { rgb: COLORS.footerBorder } },
    left: { style: 'thin', color: { rgb: COLORS.footerBorder } },
    right: { style: 'thin', color: { rgb: COLORS.footerBorder } },
  },
  fill: {
    fgColor: { rgb: COLORS.footerBg },
    patternType: 'solid',
  },
};

// Report header cell style
const reportHeaderCellStyle: XLSX.CellStyle = {
  font: {
    name: 'Calibri',
    sz: 14,
    bold: true,
    color: { rgb: COLORS.reportHeaderText },
  },
  alignment: {
    vertical: 'center',
    horizontal: 'left',
    wrapText: true,
  },
  fill: {
    fgColor: { rgb: COLORS.reportHeaderBg },
    patternType: 'solid',
  },
};

/**
 * Extract table data from an HTML table element
 */
function extractTableData(table: HTMLTableElement): {
  headers: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
  headerAlignments?: ('left' | 'center' | 'right')[];
} {
  const headers: string[] = [];
  const headerAlignments: ('left' | 'center' | 'right')[] = [];
  const rows: (string | number)[][] = [];
  let footer: (string | number)[] | undefined;

  // Extract headers
  const thead = table.querySelector('thead');
  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      headerRow.querySelectorAll('th').forEach((th) => {
        headers.push(th.textContent?.trim() || '');
        // Determine alignment from class names
        const className = th.className || '';
        if (className.includes('text-right')) {
          headerAlignments.push('right');
        } else if (className.includes('text-center')) {
          headerAlignments.push('center');
        } else {
          headerAlignments.push('left');
        }
      });
    }
  }

  // Extract data rows
  const tbody = table.querySelector('tbody');
  if (tbody) {
    tbody.querySelectorAll('tr').forEach((tr) => {
      const row: (string | number)[] = [];
      tr.querySelectorAll('td').forEach((td) => {
        const text = td.textContent?.trim() || '';
        // Try to parse as number if possible
        const num = parseFloat(text.replace(/,/g, ''));
        row.push(isNaN(num) ? text : num);
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });
  }

  // Extract footer
  const tfoot = table.querySelector('tfoot');
  if (tfoot) {
    const footerRow = tfoot.querySelector('tr');
    if (footerRow) {
      const footerData: (string | number)[] = [];
      footerRow.querySelectorAll('td, th').forEach((cell) => {
        const text = cell.textContent?.trim() || '';
        const num = parseFloat(text.replace(/,/g, ''));
        footerData.push(isNaN(num) ? text : num);
      });
      if (footerData.length > 0) {
        footer = footerData;
      }
    }
  }

  return { headers, rows, footer, headerAlignments };
}

/**
 * Extract report header information
 */
function extractReportHeader(element: HTMLElement): string[] {
  const headerInfo: string[] = [];
  const headerElement = element.querySelector('.export-header');
  
  if (headerElement) {
    const textNodes = headerElement.querySelectorAll('div');
    textNodes.forEach((node) => {
      const text = node.textContent?.trim();
      if (text) {
        headerInfo.push(text);
      }
    });
  }

  return headerInfo;
}

/**
 * Apply professional styling to a worksheet
 */
function applyWorksheetStyles(
  ws: XLSX.WorkSheet,
  wsData: (string | number)[][],
  headerInfo: string[],
  headers: string[],
  rows: (string | number)[][],
  footer: (string | number)[] | undefined,
  headerAlignments?: ('left' | 'center' | 'right')[]
): void {
  let currentRow = 0;
  
  // Style report header rows
  if (headerInfo.length > 0) {
    headerInfo.forEach(() => {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = { ...reportHeaderCellStyle };
      ws[cellAddress].s!.alignment!.horizontal = 'left';
      // Merge cells for header row
      const lastCol = headers.length > 0 ? headers.length - 1 : 0;
      if (headers.length > 0) {
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({
          s: { r: currentRow, c: 0 },
          e: { r: currentRow, c: lastCol },
        });
      }
      currentRow++;
    });
    currentRow++; // Skip empty row separator
  }

  // Style header row
  if (headers.length > 0) {
    headers.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: colIdx });
      if (!ws[cellAddress]) return;
      const headerStyle = { ...headerCellStyle };
      if (headerAlignments && headerAlignments[colIdx]) {
        headerStyle.alignment!.horizontal = headerAlignments[colIdx];
      }
      ws[cellAddress].s = headerStyle;
    });
    currentRow++;
  }

  // Style data rows with alternating colors
  rows.forEach((row, rowIdx) => {
    const isEvenRow = rowIdx % 2 === 0;
    row.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: colIdx });
      if (!ws[cellAddress]) return;
      
      const cellStyle = { ...defaultCellStyle };
      // Alternate row background
      cellStyle.fill!.fgColor!.rgb = isEvenRow ? COLORS.rowBg : COLORS.rowAltBg;
      
      // Use left alignment for all cells, but respect header alignment if specified
      const cellValue = row[colIdx];
      // Use header alignment if available, otherwise default to left
      if (headerAlignments && headerAlignments[colIdx]) {
        cellStyle.alignment!.horizontal = headerAlignments[colIdx];
      } else {
        cellStyle.alignment!.horizontal = 'left';
      }
      
      // Format numbers with commas but keep them left-aligned
      if (typeof cellValue === 'number' && !ws[cellAddress].z) {
        ws[cellAddress].z = '#,##0.00';
      }
      
      ws[cellAddress].s = cellStyle;
    });
    currentRow++;
  });

  // Style footer row
  if (footer && footer.length > 0) {
    currentRow++; // Skip empty row separator
    footer.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: colIdx });
      if (!ws[cellAddress]) return;
      const footerStyle = { ...footerCellStyle };
      
      // Use left alignment for footer cells, but respect header alignment if available
      const cellValue = footer[colIdx];
      if (headerAlignments && headerAlignments[colIdx]) {
        footerStyle.alignment!.horizontal = headerAlignments[colIdx];
      } else {
        footerStyle.alignment!.horizontal = 'left';
      }
      
      // Format numbers with commas but keep them left-aligned
      if (typeof cellValue === 'number' && !ws[cellAddress].z) {
        ws[cellAddress].z = '#,##0.00';
      }
      
      ws[cellAddress].s = footerStyle;
    });
  }
}

/**
 * Export a report element to Excel with professional styling
 * @param exportElementId - ID of the element to export
 * @param filename - Excel filename (without extension)
 * @param options - Excel export options
 */
export async function exportToExcel(
  exportElementId: string,
  filename: string = 'report',
  options: ExcelOptions = {}
): Promise<void> {
  const {
    sheetName = 'Report',
    hideColumns = ['.sale-loss-column'],
    removeNoPrint = true,
    includeHeader = true,
    columnWidths,
    useExportTypeHiding = true,
  } = options;

  try {
    const element = document.getElementById(exportElementId);
    if (!element) {
      throw new Error(`Element with ID "${exportElementId}" not found`);
    }

    // Clone the element
    const clone = cloneElementForExport(exportElementId);
    if (!clone) {
      throw new Error('Failed to clone element');
    }

    // Remove no-print elements
    if (removeNoPrint) {
      removeNoPrintElements(clone);
    }

    // Hide specific columns
    if (hideColumns.length > 0) {
      hideColumnsForExport(clone, hideColumns);
    }

    // Hide columns based on export type
    if (useExportTypeHiding) {
      hideColumnsByExportType(clone, 'excel');
    }

    // Find the main table
    const table = clone.querySelector('table');
    if (!table) {
      throw new Error('No table found in report element');
    }

    // Extract table data
    const { headers, rows, footer, headerAlignments } = extractTableData(table);

    // Extract report header
    const headerInfo = includeHeader ? extractReportHeader(clone) : [];

    // Create workbook and worksheet data
    const wb = XLSX.utils.book_new();
    const wsData: (string | number)[][] = [];

    // Add report header if requested
    if (headerInfo.length > 0) {
      headerInfo.forEach((info) => {
        wsData.push([info]);
      });
      wsData.push([]); // Empty row separator
    }

    // Add table headers
    if (headers.length > 0) {
      wsData.push(headers);
    }

    // Add data rows
    rows.forEach((row) => {
      wsData.push(row);
    });

    // Add footer if exists
    if (footer && footer.length > 0) {
      wsData.push([]); // Empty row separator
      wsData.push(footer);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply professional styling
    applyWorksheetStyles(ws, wsData, headerInfo, headers, rows, footer, headerAlignments);

    // Set column widths
    if (columnWidths) {
      const cols = headers.map((header, idx) => ({
        wch: columnWidths[header] || 15,
      }));
      ws['!cols'] = cols;
    } else {
      // Auto-width columns with better calculation
      const cols = headers.map((_, idx) => {
        let maxWidth = 10;
        // Check header width
        const headerLength = headers[idx]?.toString().length || 0;
        maxWidth = Math.max(maxWidth, headerLength + 2);
        // Check data widths
        rows.forEach((row) => {
          const cellValue = row[idx]?.toString().length || 0;
          maxWidth = Math.max(maxWidth, Math.min(cellValue, 50));
        });
        // Check footer width
        if (footer && footer[idx] !== undefined && footer[idx] !== null) {
          const footerLength = footer[idx]?.toString().length || 0;
          maxWidth = Math.max(maxWidth, footerLength);
        }
        return { wch: Math.min(maxWidth + 2, 60) }; // Add padding, cap at 60
      });
      ws['!cols'] = cols;
    }

    // Freeze header row (freeze first row with data after header)
    const freezeRow = headerInfo.length > 0 ? headerInfo.length + 1 : 1;
    ws['!freeze'] = { xSplit: 0, ySplit: freezeRow, topLeftCell: `A${freezeRow + 1}`, activePane: 'bottomLeft', state: 'frozen' };

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Write and download file
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw error;
  }
}

/**
 * Export to Excel with multiple sheets (styled)
 */
export async function exportToExcelMultiSheet(
  exportElementId: string,
  filename: string = 'report',
  sheets: Array<{
    name: string;
    tableSelector?: string;
    options?: Omit<ExcelOptions, 'filename' | 'sheetName'>;
  }>,
  globalOptions: Omit<ExcelOptions, 'filename' | 'sheetName'> = {}
): Promise<void> {
  try {
    const element = document.getElementById(exportElementId);
    if (!element) {
      throw new Error(`Element with ID "${exportElementId}" not found`);
    }

    const wb = XLSX.utils.book_new();

    for (const sheetConfig of sheets) {
      const { name, tableSelector = 'table', options = {} } = sheetConfig;
      const mergedOptions = { ...globalOptions, ...options };

      // Clone the element
      const clone = cloneElementForExport(exportElementId);
      if (!clone) {
        continue;
      }

      // Apply options
      if (mergedOptions.removeNoPrint) {
        removeNoPrintElements(clone);
      }
      if (mergedOptions.hideColumns && mergedOptions.hideColumns.length > 0) {
        hideColumnsForExport(clone, mergedOptions.hideColumns);
      }

      // Find the table
      const table = clone.querySelector(tableSelector) as HTMLTableElement;
      if (!table) {
        continue;
      }

      // Extract and add data
      const { headers, rows, footer, headerAlignments } = extractTableData(table);
      const headerInfo = mergedOptions.includeHeader ? extractReportHeader(clone) : [];
      const wsData: (string | number)[][] = [];

      if (headerInfo.length > 0) {
        headerInfo.forEach((info) => wsData.push([info]));
        if (headerInfo.length > 0) wsData.push([]);
      }

      if (headers.length > 0) wsData.push(headers);
      rows.forEach((row) => wsData.push(row));
      if (footer && footer.length > 0) {
        wsData.push([]);
        wsData.push(footer);
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Apply styling
      applyWorksheetStyles(ws, wsData, headerInfo, headers, rows, footer, headerAlignments);

      // Auto-width columns
      const cols = headers.map((_, idx) => {
        let maxWidth = 10;
        const headerLength = headers[idx]?.toString().length || 0;
        maxWidth = Math.max(maxWidth, headerLength + 2);
        rows.forEach((row) => {
          const cellValue = row[idx]?.toString().length || 0;
          maxWidth = Math.max(maxWidth, Math.min(cellValue, 50));
        });
        return { wch: Math.min(maxWidth + 2, 60) };
      });
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, name);
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Multi-sheet Excel export failed:', error);
    throw error;
  }
}
