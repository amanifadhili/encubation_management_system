import React, { useState } from "react";

/**
 * Reusable Tooltip component for icon/action tooltips.
 * @param {object} props
 * @param {string} props.label - Tooltip text
 * @param {React.ReactNode} props.children - The element to wrap
 */
export interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children }) => {
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

export default Tooltip; 