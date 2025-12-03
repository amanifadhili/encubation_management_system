import React from "react";

/**
 * Reusable Badge component for status/role display.
 * @param {object} props
 * @param {"default"|"success"|"warning"|"danger"|"info"|string} [props.variant] - Badge color style
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.className] - Additional Tailwind classes
 */
export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info" | string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-200 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

const Badge: React.FC<BadgeProps> = ({ variant = "default", children, className = "" }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${variantStyles[variant] || variantStyles.default} ${className}`}>
    {children}
  </span>
);

export default Badge; 