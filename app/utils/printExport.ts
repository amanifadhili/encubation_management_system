/**
 * Print export functionality for professional reports
 * Clones report element, applies styles, and triggers browser print
 */

import {
  cloneElementForExport,
  applyInlineStylesToClone,
  removeNoPrintElements,
  hideColumnsForExport,
  hideColumnsByExportType,
  prepareElementForExport,
  replaceBodyForExport,
} from './exportUtils';

export interface PrintOptions {
  /** Column classes to hide in print (e.g., ['.sale-loss-column', '.print-hide']) */
  hideColumns?: string[];
  /** Whether to remove .no-print elements */
  removeNoPrint?: boolean;
  /** Whether to apply inline styles */
  applyInlineStyles?: boolean;
  /** Whether to hide columns based on export type classes */
  useExportTypeHiding?: boolean;
}

/**
 * Print a report element
 * @param exportElementId - ID of the element to print
 * @param options - Print options
 */
export function printReport(
  exportElementId: string,
  options: PrintOptions = {}
): void {
  const {
    hideColumns = ['.sale-loss-column'],
    removeNoPrint = true,
    applyInlineStyles = true,
    useExportTypeHiding = true,
  } = options;

  try {
    // Prepare element for export (clone, style, etc.)
    const preparation = prepareElementForExport(exportElementId, {
      hideColumns,
      removeNoPrint,
      applyInlineStyles,
    });

    if (!preparation) {
      console.error(`Failed to prepare element "${exportElementId}" for print`);
      return;
    }

    const { clone, cleanup } = preparation;

    // Hide columns based on export type
    if (useExportTypeHiding) {
      hideColumnsByExportType(clone, 'print');
    }

    // Replace body content with clone temporarily
    const restoreBody = replaceBodyForExport(clone);

    // Trigger print after a short delay to ensure DOM is ready
    setTimeout(() => {
      window.print();

      // Restore body content after print dialog closes
      // Note: This is a best-effort restoration as we can't reliably detect when print dialog closes
      // The cleanup will happen when the user interacts with the page again
      window.addEventListener(
        'focus',
        () => {
          restoreBody();
        },
        { once: true }
      );
    }, 100);
  } catch (error) {
    console.error('Print export failed:', error);
    throw error;
  }
}

/**
 * Print report using the same approach as reference files
 * This function matches the pattern from bank.blade.php
 */
export function printReportWithClone(
  exportElementId: string,
  options: PrintOptions = {}
): void {
  const {
    hideColumns = ['.sale-loss-column'],
    removeNoPrint = true,
    applyInlineStyles = true,
    useExportTypeHiding = true,
  } = options;

  try {
    const element = document.getElementById(exportElementId);
    if (!element) {
      console.error(`Element with ID "${exportElementId}" not found`);
      return;
    }

    // Save original DOM state
    const originalNodes = Array.from(document.body.childNodes);
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || 0;

    // Clone the element
    const clone = cloneElementForExport(exportElementId);
    if (!clone) {
      return;
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
      hideColumnsByExportType(clone, 'print');
    }

    // Apply inline styles
    if (applyInlineStyles) {
      applyInlineStylesToClone(clone);
    }

    // Replace body content
    document.body.innerHTML = '';
    document.body.appendChild(clone);

    // Cleanup function
    const cleanup = () => {
      document.body.innerHTML = '';
      originalNodes.forEach((node) => document.body.appendChild(node));
      window.scrollTo(0, scrollPos);
    };

    // Trigger print after a short delay
    setTimeout(() => {
      window.print();

      // Restore on window focus (when print dialog closes)
      window.addEventListener(
        'focus',
        () => {
          cleanup();
        },
        { once: true }
      );
    }, 100);
  } catch (error) {
    console.error('Print export failed:', error);
    throw error;
  }
}

