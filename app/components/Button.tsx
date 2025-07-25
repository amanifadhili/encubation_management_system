import React from "react";

/**
 * Reusable Button component with variants and flexible props.
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement> & {
 *   variant?: "primary" | "secondary" | "danger" | "icon",
 *   fullWidth?: boolean,
 *   loading?: boolean,
 *   children: React.ReactNode
 * }} props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "icon";
  fullWidth?: boolean;
  loading?: boolean;
}

const base = "inline-flex items-center justify-center font-semibold rounded transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed";
const variants = {
  primary: "bg-blue-700 text-white hover:bg-blue-800 shadow",
  secondary: "bg-gray-200 text-blue-700 hover:bg-gray-300",
  danger: "bg-red-600 text-white hover:bg-red-700",
  icon: "p-2 rounded-full hover:bg-blue-100 text-blue-700",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}) => (
  <button
    className={[
      base,
      variants[variant],
      fullWidth ? "w-full" : "",
      loading ? "opacity-70" : "",
      className,
    ].join(" ")}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-blue-700 rounded-full inline-block"></span>
    ) : null}
    {children}
  </button>
);

export default Button; 