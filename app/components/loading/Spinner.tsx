import React from 'react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red' | 'yellow';
  className?: string;
}

const sizeMap = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const colorMap = {
  blue: 'border-blue-500 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-500 border-t-transparent',
  green: 'border-green-500 border-t-transparent',
  red: 'border-red-500 border-t-transparent',
  yellow: 'border-yellow-500 border-t-transparent',
};

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}) => {
  return (
    <div
      className={`
        inline-block
        rounded-full
        animate-spin
        ${sizeMap[size]}
        ${colorMap[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
