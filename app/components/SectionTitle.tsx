import React from "react";

/**
 * Reusable SectionTitle component for section headers.
 * @param {object} props
 * @param {React.ReactNode} props.children - Section title content
 * @param {string} [props.className] - Additional Tailwind classes
 */
export interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, className = "" }) => (
  <h2 className={`text-xl font-semibold mb-2 text-blue-900 ${className}`}>{children}</h2>
);

export default SectionTitle; 