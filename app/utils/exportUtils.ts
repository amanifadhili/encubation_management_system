/**
 * Export utilities for professional reports
 * Provides functions to clone elements, apply styles, and prepare for export
 */

/**
 * Clone an element for export, preserving structure but preparing for styling
 * @param elementId - ID of the element to clone
 * @returns Cloned HTMLElement or null if element not found
 */
export function cloneElementForExport(elementId: string): HTMLElement | null {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return null;
  }

  // Deep clone the element
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Set up color preservation for the clone
  clone.style.webkitPrintColorAdjust = 'exact';
  clone.style.printColorAdjust = 'exact';
  clone.style.colorAdjust = 'exact';

  return clone;
}

/**
 * Apply inline styles to a cloned element for reliable export/print
 * This ensures styles are preserved even if CSS is not loaded
 * @param clone - The cloned HTMLElement to style
 */
export function applyInlineStylesToClone(clone: HTMLElement): void {
  // Apply styles to tables
  clone.querySelectorAll('table').forEach((table) => {
    const el = table as HTMLElement;
    el.style.width = '100%';
    el.style.borderCollapse = 'collapse';
    el.style.borderSpacing = '0';
  });

  // Apply styles to table cells
  clone.querySelectorAll('th, td').forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.border = '1px solid #999';
    el.style.padding = '6px';
    el.style.fontSize = '12px';
    el.style.color = '#000';
  });

  // Apply styles to table headers
  clone.querySelectorAll('thead').forEach((thead) => {
    const el = thead as HTMLElement;
    el.style.background = '#e7f0ff';
    el.style.fontWeight = '700';
    el.style.webkitPrintColorAdjust = 'exact';
    el.style.printColorAdjust = 'exact';
  });

  // Apply styles to table headers (th)
  clone.querySelectorAll('thead th').forEach((th) => {
    const el = th as HTMLElement;
    el.style.background = '#e7f0ff';
    el.style.fontWeight = '700';
    el.style.color = '#1f2937';
  });

  // Apply styles to table footer
  clone.querySelectorAll('tfoot').forEach((tfoot) => {
    const el = tfoot as HTMLElement;
    el.style.background = '#e5e7eb';
    el.style.fontWeight = '600';
    el.style.webkitPrintColorAdjust = 'exact';
    el.style.printColorAdjust = 'exact';
  });

  // Apply styles to table footer cells
  clone.querySelectorAll('tfoot td, tfoot th').forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.background = '#e5e7eb';
    el.style.fontWeight = '600';
  });

  // Apply styles to export header
  clone.querySelectorAll('.export-header').forEach((header) => {
    const el = header as HTMLElement;
    el.style.fontWeight = '700';
    el.style.border = '1px solid #999';
    el.style.padding = '12px';
    el.style.background = '#f9fafb';
  });

  // Apply styles to export date
  clone.querySelectorAll('.export-date').forEach((date) => {
    const el = date as HTMLElement;
    el.style.textAlign = 'right';
    el.style.width = '100%';
    el.style.display = 'block';
  });
}

/**
 * Hide specific columns in a cloned element
 * @param clone - The cloned HTMLElement
 * @param columnClasses - Array of CSS classes to hide (e.g., ['.sale-loss-column', '.print-hide'])
 */
export function hideColumnsForExport(
  clone: HTMLElement,
  columnClasses: string[] = ['.sale-loss-column']
): void {
  columnClasses.forEach((className) => {
    clone.querySelectorAll(className).forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  });
}

/**
 * Hide columns based on export type
 * Supports classes like .print-hide, .pdf-hide, .excel-hide
 * @param clone - The cloned HTMLElement
 * @param exportType - Type of export ('print', 'pdf', 'excel')
 */
export function hideColumnsByExportType(
  clone: HTMLElement,
  exportType: 'print' | 'pdf' | 'excel'
): void {
  const hideClass = `.${exportType}-hide`;
  clone.querySelectorAll(hideClass).forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  // Also hide general export-hide class
  clone.querySelectorAll('.export-hide').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });
}

/**
 * Show only columns for specific export type
 * Useful for showing only .print-only, .pdf-only, etc. columns
 * @param clone - The cloned HTMLElement
 * @param exportType - Type of export ('print', 'pdf', 'excel')
 */
export function showColumnsByExportType(
  clone: HTMLElement,
  exportType: 'print' | 'pdf' | 'excel'
): void {
  // Hide all -only columns first
  ['print', 'pdf', 'excel'].forEach((type) => {
    clone.querySelectorAll(`.${type}-only`).forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  });

  // Show only the requested export type
  const showClass = `.${exportType}-only`;
  clone.querySelectorAll(showClass).forEach((el) => {
    (el as HTMLElement).style.display = '';
  });
}

/**
 * Remove elements with .no-print class from clone
 * @param clone - The cloned HTMLElement
 */
export function removeNoPrintElements(clone: HTMLElement): void {
  clone.querySelectorAll('.no-print').forEach((el) => {
    el.remove();
  });
}

/**
 * Save original DOM state and restore after export operation
 * This is used to temporarily replace body content for export, then restore it
 */
export interface DOMState {
  originalNodes: Node[];
  scrollPosition: number;
}

/**
 * Save the current DOM state
 * @returns DOMState object containing original nodes and scroll position
 */
export function saveDOMState(): DOMState {
  const originalNodes = Array.from(document.body.childNodes);
  const scrollPos = window.pageYOffset || document.documentElement.scrollTop || 0;

  return {
    originalNodes,
    scrollPosition: scrollPos,
  };
}

/**
 * Restore the DOM state
 * @param state - The DOMState object returned by saveDOMState
 */
export function restoreDOMState(state: DOMState): void {
  document.body.innerHTML = '';
  state.originalNodes.forEach((node) => {
    document.body.appendChild(node);
  });
  window.scrollTo(0, state.scrollPosition);
}

/**
 * Helper function to clone, style, and prepare element for export
 * @param elementId - ID of the element to export
 * @param options - Options for export preparation
 * @returns Object with clone and cleanup function, or null if element not found
 */
export interface ExportPreparationOptions {
  hideColumns?: string[];
  removeNoPrint?: boolean;
  applyInlineStyles?: boolean;
}

export function prepareElementForExport(
  elementId: string,
  options: ExportPreparationOptions = {}
): {
  clone: HTMLElement;
  cleanup: () => void;
  state: DOMState;
} | null {
  const {
    hideColumns = ['.sale-loss-column'],
    removeNoPrint = true,
    applyInlineStyles = true,
  } = options;

  const clone = cloneElementForExport(elementId);
  if (!clone) {
    return null;
  }

  // Remove no-print elements
  if (removeNoPrint) {
    removeNoPrintElements(clone);
  }

  // Hide specific columns
  if (hideColumns.length > 0) {
    hideColumnsForExport(clone, hideColumns);
  }

  // Apply inline styles
  if (applyInlineStyles) {
    applyInlineStylesToClone(clone);
  }

  // Save current DOM state
  const state = saveDOMState();

  // Cleanup function to restore DOM
  const cleanup = () => {
    restoreDOMState(state);
  };

  return { clone, cleanup, state };
}

/**
 * Temporarily replace body content with clone for export operation
 * @param clone - The cloned element to display
 * @returns Cleanup function to restore original DOM
 */
export function replaceBodyForExport(clone: HTMLElement): () => void {
  const state = saveDOMState();

  // Replace body content with clone
  document.body.innerHTML = '';
  document.body.appendChild(clone);

  // Return cleanup function
  return () => {
    restoreDOMState(state);
  };
}

