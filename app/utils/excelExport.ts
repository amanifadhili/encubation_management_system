/**
 * Excel export functionality for professional reports
 * Uses xlsx library to generate Excel files from report tables
 */

import * as XLSX from 'xlsx';
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

/**
 * Extract table data from an HTML table element
 */
function extractTableData(table: HTMLTableElement): {
  headers: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
} {
  const headers: string[] = [];
  const rows: (string | number)[][] = [];
  let footer: (string | number)[] | undefined;

  // Extract headers
  const thead = table.querySelector('thead');
  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      headerRow.querySelectorAll('th').forEach((th) => {
        headers.push(th.textContent?.trim() || '');
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
      footer = [];
      footerRow.querySelectorAll('td, th').forEach((cell) => {
        const text = cell.textContent?.trim() || '';
        const num = parseFloat(text.replace(/,/g, ''));
        footer.push(isNaN(num) ? text : num);
      });
    }
  }

  return { headers, rows, footer };
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
 * Export a report element to Excel
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
    const { headers, rows, footer } = extractTableData(table);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const wsData: (string | number)[][] = [];

    // Add report header if requested
    if (includeHeader) {
      const headerInfo = extractReportHeader(clone);
      if (headerInfo.length > 0) {
        headerInfo.forEach((info) => {
          wsData.push([info]);
        });
        wsData.push([]); // Empty row separator
      }
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

    // Set column widths if provided
    if (columnWidths) {
      const cols = headers.map((header, idx) => ({
        wch: columnWidths[header] || 15,
      }));
      ws['!cols'] = cols;
    } else {
      // Auto-width columns (estimate based on content)
      const cols = headers.map((_, idx) => {
        let maxWidth = 10;
        // Check header width
        const headerLength = headers[idx]?.toString().length || 0;
        maxWidth = Math.max(maxWidth, headerLength);
        // Check data widths
        rows.forEach((row) => {
          const cellValue = row[idx]?.toString().length || 0;
          maxWidth = Math.max(maxWidth, Math.min(cellValue, 50)); // Cap at 50
        });
        return { wch: maxWidth + 2 }; // Add padding
      });
      ws['!cols'] = cols;
    }

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
 * Export to Excel with multiple sheets
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
      const { headers, rows, footer } = extractTableData(table);
      const wsData: (string | number)[][] = [];

      if (mergedOptions.includeHeader) {
        const headerInfo = extractReportHeader(clone);
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
      XLSX.utils.book_append_sheet(wb, ws, name);
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Multi-sheet Excel export failed:', error);
    throw error;
  }
}

