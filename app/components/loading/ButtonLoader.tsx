import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonLoaderProps {
  loading: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  loadingText?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  form?: string;
}

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm hover:shadow focus:ring-gray-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] focus:ring-green-500',
  outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm sm:px-4 sm:py-2',
  md: 'px-4 py-2.5 text-base sm:px-5 sm:py-3',
  lg: 'px-6 py-3 text-lg sm:px-8 sm:py-4',
};

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  loading,
  onClick,
  label,
  loadingText,
  type = 'button',
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  form,
}) => {
  const isDisabled = loading || disabled;
  const displayText = loading ? (loadingText || 'Loading...') : label;
  const spinnerColor = variant === 'outline' ? 'blue' : 'white';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      form={form}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-semibold
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Spinner size="sm" color={spinnerColor} />
          <span>{displayText}</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          <span>{displayText}</span>
        </>
      )}
    </button>
  );
};

export default ButtonLoader;
