import React, { useState } from "react";
import { PageSkeleton } from "./loading";
import { ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
  onSort?: (key: string, order: "asc" | "desc") => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Tooltip component for icon actions
const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={-1}
    >
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gray-900 text-white text-xs shadow z-50 whitespace-nowrap">
          {label}
        </span>
      )}
    </span>
  );
};

function Table<T extends { id: number | string }>({
  columns,
  data,
  actions,
  emptyMessage = "No data found.",
  className = "",
  loading = false,
  skeletonCount = 5,
  onSort,
  sortBy,
  sortOrder,
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort && columns.find((col) => col.key === key)?.sortable) {
      const newOrder = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
      onSort(key, newOrder);
    }
  };

  const getSortIcon = (key: string) => {
    if (!onSort || !columns.find((col) => col.key === key)?.sortable)
      return null;
    if (sortBy !== key) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-gray-400 ml-1" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUpIcon className="w-4 h-4 text-blue-600 ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 text-blue-600 ml-1" />
    );
  };
  if (loading) {
    return (
      <div className={`overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white ${className}`}>
        <PageSkeleton count={skeletonCount} layout="table" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
      {/* Mobile: Horizontal scroll */}
      <div className="overflow-x-auto -mx-4 sm:mx-0" role="region" aria-label="Table data" tabIndex={0}>
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Data table">
          <thead className="bg-gray-50">
            <tr role="row">
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className={`
                    px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider
                    ${col.className || ""}
                    ${col.sortable
                      ? "cursor-pointer hover:bg-gray-100 transition-colors"
                      : ""
                    }
                  `}
                onClick={() => handleSort(col.key as string)}
                aria-sort={sortBy === col.key ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                aria-label={col.sortable ? `Sort by ${col.label}` : col.label}
              >
                <div className="flex items-center gap-2">
                  <span>{col.label}</span>
                  {getSortIcon(col.key as string)}
                </div>
              </th>
              ))}
              {actions && (
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" scope="col">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 sm:px-6 py-8 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 fade-in">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <svg
                        className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2" role="status" aria-live="polite">
                      {emptyMessage}
                    </h3>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/50 transition-colors duration-150"
                  role="row"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className={`px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
