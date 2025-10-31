import React from 'react';
import { Spinner } from './Spinner';

export interface GlobalLoaderProps {
  visible: boolean;
  message?: string;
  backdrop?: 'light' | 'dark' | 'blur';
}

const backdropClasses = {
  light: 'bg-white bg-opacity-70',
  dark: 'bg-black bg-opacity-40',
  blur: 'bg-white bg-opacity-30 backdrop-blur-sm',
};

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ 
  visible, 
  message = 'Loading...',
  backdrop = 'dark' 
}) => {
  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50
        flex flex-col items-center justify-center
        transition-opacity duration-300
        ${backdropClasses[backdrop]}
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      role="alert"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-2xl">
        <Spinner size="xl" color="blue" />
        {message && (
          <p className="text-gray-700 font-medium text-lg animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;
