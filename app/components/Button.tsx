import React from "react";

/**
 * Reusable Button component with variants and flexible props.
 * 
 * @deprecated Consider using ButtonLoader from './loading/ButtonLoader' for new implementations.
 * ButtonLoader provides enhanced loading states, better accessibility, and consistent styling.
 * 
 * This component is maintained for backward compatibility with existing code.
 * 
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement> & {
 *   variant?: "primary" | "secondary" | "danger" | "icon",
 *   fullWidth?: boolean,
 *   loading?: boolean,
 *   children: React.ReactNode
 * }} props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "icon" | "outline";
  fullWidth?: boolean;
  loading?: boolean;
}

const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] focus:ring-blue-500",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm hover:shadow focus:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] focus:ring-red-500",
  icon: "p-2 rounded-full hover:bg-blue-100 text-blue-700 focus:ring-blue-500",
  outline: "bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}) => {
  // Size variants for responsive design
  const sizeClasses = variant === "icon" 
    ? "p-2" 
    : "px-4 py-2.5 text-base sm:px-5 sm:py-3";
  
  return (
    <button
      className={[
        base,
        variants[variant],
        sizeClasses,
        fullWidth ? "w-full" : "",
        loading ? "opacity-70" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-blue-600 rounded-full inline-block"></span>
      ) : null}
      {children}
    </button>
  );
};

export default Button; 