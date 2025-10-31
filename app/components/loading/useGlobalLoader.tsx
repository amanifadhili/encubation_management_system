import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { GlobalLoader } from './GlobalLoader';

interface GlobalLoaderContextType {
  isVisible: boolean;
  message: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  setMessage: (message: string) => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export interface GlobalLoaderProviderProps {
  children: ReactNode;
  backdrop?: 'light' | 'dark' | 'blur';
}

export const GlobalLoaderProvider: React.FC<GlobalLoaderProviderProps> = ({ 
  children, 
  backdrop = 'dark' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const showLoader = useCallback((customMessage?: string) => {
    if (customMessage) {
      setMessage(customMessage);
    }
    setIsVisible(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsVisible(false);
    // Reset message after fade out
    setTimeout(() => setMessage('Loading...'), 300);
  }, []);

  const updateMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
  }, []);

  return (
    <GlobalLoaderContext.Provider
      value={{
        isVisible,
        message,
        showLoader,
        hideLoader,
        setMessage: updateMessage,
      }}
    >
      {children}
      <GlobalLoader visible={isVisible} message={message} backdrop={backdrop} />
    </GlobalLoaderContext.Provider>
  );
};

export const useGlobalLoader = (): GlobalLoaderContextType => {
  const context = useContext(GlobalLoaderContext);
  if (context === undefined) {
    throw new Error('useGlobalLoader must be used within a GlobalLoaderProvider');
  }
  return context;
};

export default useGlobalLoader;
