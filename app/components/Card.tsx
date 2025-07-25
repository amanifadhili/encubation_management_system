import React from "react";

/**
 * Reusable Card component for summary/info display.
 * @param {object} props
 * @param {string} [props.title] - Optional card title
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional Tailwind classes
 */
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded shadow p-4 ${className}`}>
    {title && <div className="text-lg font-semibold text-blue-900 mb-2">{title}</div>}
    {children}
  </div>
);

export default Card; 