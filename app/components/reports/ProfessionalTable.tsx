import React from 'react';

export interface TableColumn {
  /** Unique key for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Text alignment for the column */
  align?: 'left' | 'right' | 'center';
  /** Additional CSS classes for the column header */
  className?: string;
  /** Tooltip/title text for the column header */
  title?: string;
}

export interface TableFooter {
  /** Totals data - key should match column keys */
  totals?: Record<string, number | string>;
  /** Number of columns to span before totals start */
  colspan?: number;
  /** Label for the totals row (default: "TOTAL") */
  label?: string;
}

export interface ProfessionalTableProps {
  /** Column definitions */
  columns: TableColumn[];
  /** Data rows - each row should have keys matching column keys */
  data: Record<string, any>[];
  /** Footer configuration with totals */
  footer?: TableFooter;
  /** Show row numbers (S/N column) */
  showRowNumbers?: boolean;
  /** Text size - 'xs' for compact tables, 'sm' for regular */
  textSize?: 'xs' | 'sm';
  /** Cell padding - 'compact' (px-2 py-2) or 'regular' (px-3 py-2) */
  padding?: 'compact' | 'regular';
  /** Function to determine if a row should have warning styling */
  getRowWarning?: (row: Record<string, any>, index: number) => boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional className for the table */
  className?: string;
  /** Custom render function for cells */
  renderCell?: (column: TableColumn, value: any, row: Record<string, any>, index: number) => React.ReactNode;
}

/**
 * Professional table component for reports
 * Matches the styling from reference files (tax.blade.php, bank.blade.php)
 * Features:
 * - Consistent borders on all cells
 * - Compact sizing option
 * - Proper alignment (right for numbers, left for text)
 * - Header and footer styling
 * - Conditional row styling for warnings
 * - Row numbering support
 */
const ProfessionalTable: React.FC<ProfessionalTableProps> = ({
  columns,
  data,
  footer,
  showRowNumbers = false,
  textSize = 'xs',
  padding = 'compact',
  getRowWarning,
  emptyMessage = 'No data available',
  className = '',
  renderCell,
}) => {
  const paddingClass = padding === 'compact' ? 'px-2 py-2' : 'px-3 py-2';
  const textSizeClass = textSize === 'xs' ? 'text-xs' : 'text-sm';

  // Build columns array with row number if needed
  const displayColumns = showRowNumbers
    ? [{ key: '_row_number', label: 'S/N', align: 'left' as const }, ...columns]
    : columns;

  const renderCellContent = (
    column: TableColumn,
    value: any,
    row: Record<string, any>,
    index: number
  ): React.ReactNode => {
    if (renderCell) {
      return renderCell(column, value, row, index);
    }
    return value !== null && value !== undefined ? String(value) : '-';
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table
        className={`min-w-full ${textSizeClass} text-left text-gray-700 border border-gray-300 print:border-gray-900 ${className}`}
      >
        <thead className="bg-blue-50 text-gray-700 print:bg-blue-50">
          <tr>
            {displayColumns.map((col) => (
              <th
                key={col.key}
                className={`${paddingClass} border border-gray-300 font-semibold print:border-gray-900 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className || ''}`}
                title={col.title}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={displayColumns.length}
                className={`${paddingClass} text-center text-gray-500 py-8`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const hasWarning = getRowWarning ? getRowWarning(row, idx) : false;
              return (
                <tr
                  key={idx}
                  className={hasWarning ? 'bg-amber-50 print:bg-amber-50' : ''}
                >
                  {displayColumns.map((col) => {
                    if (col.key === '_row_number') {
                      return (
                        <td
                          key={col.key}
                          className={`${paddingClass} border border-gray-300 print:border-gray-900`}
                        >
                          {idx + 1}
                        </td>
                      );
                    }

                    const value = row[col.key];
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <td
                        key={col.key}
                        className={`${paddingClass} border border-gray-300 print:border-gray-900 ${alignClass} ${col.className || ''}`}
                      >
                        {renderCellContent(col, value, row, idx)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
        {footer && data.length > 0 && (
          <tfoot>
            <tr className="bg-gray-200 font-semibold print:bg-gray-200">
              {(() => {
                const footerCells: React.ReactNode[] = [];
                const colspan = footer.colspan || 0;

                // Add empty cells or label for columns before totals start
                if (colspan > 0) {
                  // First cell with label and colspan
                  footerCells.push(
                    <td
                      key="footer-label"
                      className={`${paddingClass} border border-gray-300 print:border-gray-900`}
                      colSpan={colspan}
                    >
                      {footer.label || 'TOTAL'}
                    </td>
                  );
                } else {
                  // No colspan, show label in first cell
                  if (displayColumns.length > 0) {
                    footerCells.push(
                      <td
                        key="footer-label"
                        className={`${paddingClass} border border-gray-300 print:border-gray-900`}
                      >
                        {footer.label || 'TOTAL'}
                      </td>
                    );
                  }
                }

                // Add totals for remaining columns
                displayColumns.forEach((col, colIdx) => {
                  // Skip columns that are part of the colspan
                  if (colIdx < colspan) {
                    return;
                  }

                  // Skip row number column in totals (already handled in label)
                  if (col.key === '_row_number') {
                    return;
                  }

                  const totalValue = footer.totals?.[col.key];
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                  footerCells.push(
                    <td
                      key={col.key}
                      className={`${paddingClass} border border-gray-300 print:border-gray-900 ${alignClass}`}
                    >
                      {totalValue !== null && totalValue !== undefined
                        ? String(totalValue)
                        : ''}
                    </td>
                  );
                });

                return footerCells;
              })()}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default ProfessionalTable;

