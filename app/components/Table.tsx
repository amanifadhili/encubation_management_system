import React, { useState } from "react";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

// Tooltip component for icon actions
const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-block"
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

function Table<T extends { id: number | string }>({ columns, data, actions, emptyMessage = "No data found.", className = "" }: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-lg shadow-lg bg-white ${className}`}>
      <table className="min-w-full">
        <thead className="bg-blue-100 border-b-2 border-blue-300">
          <tr>
            {columns.map((col) => (
              <th key={col.key as string} className={`px-4 py-3 text-left text-blue-900 font-bold ${col.className || ""}`}>{col.label}</th>
            ))}
            {actions && <th className="px-4 py-3 text-left text-blue-900 font-bold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-blue-400">{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b hover:bg-blue-50 transition">
                {columns.map((col) => (
                  <td key={col.key as string} className={`px-4 py-3 ${col.className || ""}`}>
                    {col.render ? col.render(row) : (row[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 space-x-2">{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table; 