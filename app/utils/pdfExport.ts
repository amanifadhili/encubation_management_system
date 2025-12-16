/**
 * PDF export functionality for professional reports
 * Uses html2pdf.js to generate PDFs from report elements
 */

// Dynamic import for html2pdf.js to handle ES module compatibility
let html2pdf: any;
const getHtml2Pdf = async () => {
  if (!html2pdf) {
    const module = await import('html2pdf.js');
    html2pdf = module.default || module;
  }
  return html2pdf;
};
import {
  cloneElementForExport,
  applyInlineStylesToClone,
  removeNoPrintElements,
  hideColumnsForExport,
  hideColumnsByExportType,
  prepareElementForExport,
} from './exportUtils';

export interface PDFOptions {
  /** PDF filename */
  filename?: string;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Page format (default: 'a4') */
  format?: 'a4' | 'letter' | 'legal';
  /** Page margins in mm */
  margin?: number | [number, number, number, number];
  /** Image quality (0-1) */
  imageQuality?: number;
  /** Canvas scale */
  scale?: number;
  /** Column classes to hide in PDF */
  hideColumns?: string[];
  /** Whether to remove .no-print elements */
  removeNoPrint?: boolean;
  /** Whether to apply inline styles */
  applyInlineStyles?: boolean;
  /** Whether to hide columns based on export type classes */
  useExportTypeHiding?: boolean;
}

/**
 * Export a report element to PDF
 * @param exportElementId - ID of the element to export
 * @param filename - PDF filename (without extension)
 * @param options - PDF export options
 */
export async function exportToPDF(
  exportElementId: string,
  filename: string = 'report',
  options: PDFOptions = {}
): Promise<void> {
  const {
    orientation = 'landscape',
    format = 'a4',
    margin = 10,
    imageQuality = 0.98,
    scale = 2,
    hideColumns = ['.sale-loss-column'],
    removeNoPrint = true,
    applyInlineStyles = true,
  } = options;

  try {
    // Prepare element for export
    const preparation = prepareElementForExport(exportElementId, {
      hideColumns,
      removeNoPrint,
      applyInlineStyles,
    });

    if (!preparation) {
      throw new Error(`Failed to prepare element "${exportElementId}" for PDF export`);
    }

    const { clone, cleanup } = preparation;

    // Get html2pdf instance
    const html2pdfLib = await getHtml2Pdf();

    // Configure html2pdf options
    const opt = {
      margin: margin,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: imageQuality },
      html2canvas: { scale: scale },
      jsPDF: {
        unit: 'mm',
        format: format,
        orientation: orientation,
      },
    };

    // Generate and download PDF
    await html2pdfLib().set(opt).from(clone).save();

    // Cleanup after export
    cleanup();
  } catch (error) {
    console.error('PDF export failed:', error);
    
    // Fallback to print if PDF generation fails
    console.warn('Falling back to print...');
    const { printReport } = await import('./printExport');
    printReport(exportElementId, { hideColumns, removeNoPrint, applyInlineStyles });
    
    throw error;
  }
}

/**
 * Export to PDF with custom container
 * This version creates a temporary container for better control
 */
export async function exportToPDFWithContainer(
  exportElementId: string,
  filename: string = 'report',
  options: PDFOptions = {}
): Promise<void> {
  const {
    orientation = 'landscape',
    format = 'a4',
    margin = 10,
    imageQuality = 0.98,
    scale = 2,
    hideColumns = ['.sale-loss-column'],
    removeNoPrint = true,
    applyInlineStyles = true,
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

    // Set up color preservation
    clone.style.webkitPrintColorAdjust = 'exact';
    clone.style.printColorAdjust = 'exact';

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
      hideColumnsByExportType(clone, 'pdf');
    }

    // Apply inline styles
    if (applyInlineStyles) {
      applyInlineStylesToClone(clone);
    }

    // Create a temporary container
    const container = document.createElement('div');
    container.style.width = '100%';
    container.appendChild(clone);

    // Get html2pdf instance
    const html2pdfLib = await getHtml2Pdf();

    // Configure html2pdf options
    const opt = {
      margin: margin,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: imageQuality },
      html2canvas: { scale: scale },
      jsPDF: {
        unit: 'mm',
        format: format,
        orientation: orientation,
      },
    };

    // Generate and download PDF
    await html2pdfLib().set(opt).from(container).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

