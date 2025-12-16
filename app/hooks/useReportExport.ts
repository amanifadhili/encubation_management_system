/**
 * Unified export hook for professional reports
 * Provides print, PDF, and Excel export functionality with loading states
 */

import { useState, useCallback } from 'react';
import { printReport } from '../utils/printExport';
import { exportToPDF } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import type { PrintOptions } from '../utils/printExport';
import type { PDFOptions } from '../utils/pdfExport';
import type { ExcelOptions } from '../utils/excelExport';

export interface UseReportExportOptions {
  /** ID of the element to export */
  exportElementId: string;
  /** Default filename for exports */
  filename?: string;
  /** Print options */
  printOptions?: PrintOptions;
  /** PDF options */
  pdfOptions?: PDFOptions;
  /** Excel options */
  excelOptions?: ExcelOptions;
  /** Toast notification function */
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface UseReportExportReturn {
  /** Print the report */
  printReport: () => void;
  /** Export to PDF */
  exportPDF: () => Promise<void>;
  /** Export to Excel */
  exportExcel: () => Promise<void>;
  /** Loading states */
  loading: {
    print: boolean;
    pdf: boolean;
    excel: boolean;
  };
}

/**
 * Hook for exporting reports
 * Provides unified interface for print, PDF, and Excel exports
 */
export function useReportExport(
  options: UseReportExportOptions
): UseReportExportReturn {
  const {
    exportElementId,
    filename = 'report',
    printOptions = {},
    pdfOptions = {},
    excelOptions = {},
    showToast,
  } = options;

  const [loading, setLoading] = useState({
    print: false,
    pdf: false,
    excel: false,
  });

  const handlePrint = useCallback(() => {
    try {
      setLoading((prev) => ({ ...prev, print: true }));
      printReport(exportElementId, printOptions);
      showToast?.('Print dialog opened', 'info');
    } catch (error) {
      console.error('Print failed:', error);
      showToast?.('Failed to print report', 'error');
    } finally {
      // Reset loading after a delay (print dialog doesn't block)
      setTimeout(() => {
        setLoading((prev) => ({ ...prev, print: false }));
      }, 1000);
    }
  }, [exportElementId, printOptions, showToast]);

  const handleExportPDF = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, pdf: true }));
      await exportToPDF(exportElementId, filename, pdfOptions);
      showToast?.('PDF exported successfully', 'success');
    } catch (error) {
      console.error('PDF export failed:', error);
      showToast?.('Failed to export PDF', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, pdf: false }));
    }
  }, [exportElementId, filename, pdfOptions, showToast]);

  const handleExportExcel = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, excel: true }));
      await exportToExcel(exportElementId, filename, excelOptions);
      showToast?.('Excel file exported successfully', 'success');
    } catch (error) {
      console.error('Excel export failed:', error);
      showToast?.('Failed to export Excel file', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, excel: false }));
    }
  }, [exportElementId, filename, excelOptions, showToast]);

  return {
    printReport: handlePrint,
    exportPDF: handleExportPDF,
    exportExcel: handleExportExcel,
    loading,
  };
}

export default useReportExport;

