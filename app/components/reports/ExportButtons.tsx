import React from 'react';
import ButtonLoader from '../loading/ButtonLoader';

export interface ExportButtonsProps {
  /** ID of the element to export */
  exportElementId: string;
  /** Print handler function */
  onPrint: () => void;
  /** PDF export handler function */
  onPdf: () => void;
  /** Excel export handler function */
  onExcel: () => void;
  /** Loading states for each export type */
  loading?: {
    print?: boolean;
    pdf?: boolean;
    excel?: boolean;
  };
  /** Additional className for customization */
  className?: string;
  /** Show specific export buttons */
  showButtons?: {
    print?: boolean;
    pdf?: boolean;
    excel?: boolean;
  };
}

/**
 * Export button group component
 * Provides Print, PDF, and Excel export buttons
 * Buttons are hidden in print mode (using .no-print class)
 * Matches the styling from reference files (bank.blade.php, tax.blade.php)
 */
const ExportButtons: React.FC<ExportButtonsProps> = ({
  onPrint,
  onPdf,
  onExcel,
  loading = {},
  className = '',
  showButtons = { print: true, pdf: true, excel: true },
}) => {
  const { print: printLoading = false, pdf: pdfLoading = false, excel: excelLoading = false } =
    loading;

  return (
    <div className={`flex flex-wrap gap-2 no-print ${className}`}>
      {showButtons.print && (
        <ButtonLoader
          loading={printLoading}
          onClick={onPrint}
          label="Print"
          loadingText="Preparing..."
          variant="secondary"
          size="sm"
          className="text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        />
      )}
      {showButtons.pdf && (
        <ButtonLoader
          loading={pdfLoading}
          onClick={onPdf}
          label="Export PDF"
          loadingText="Generating PDF..."
          variant="secondary"
          size="sm"
          className="text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        />
      )}
      {showButtons.excel && (
        <ButtonLoader
          loading={excelLoading}
          onClick={onExcel}
          label="Export Excel"
          loadingText="Generating Excel..."
          variant="secondary"
          size="sm"
          className="text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        />
      )}
    </div>
  );
};

export default ExportButtons;

