import React, { useEffect } from 'react';

const AccessibilityEnhancer: React.FC = () => {
  useEffect(() => {
    // Skip to main content functionality
    const handleSkipLink = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement?.id === 'skip-to-main') {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    // Enhanced keyboard navigation
    const handleKeyNavigation = (e: KeyboardEvent) => {
      // Tab navigation improvements
      if (e.key === 'Tab') {
        const activeElement = document.activeElement as HTMLElement;

        // Add focus-visible class for better focus indicators
        document.querySelectorAll('.focus-visible').forEach(el => {
          el.classList.remove('focus-visible');
        });

        if (activeElement) {
          activeElement.classList.add('focus-visible');
        }
      }

      // Escape key handling for modals
      if (e.key === 'Escape') {
        // Close any open modals or dropdowns
        const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (openModal) {
          const closeButton = openModal.querySelector('[aria-label="Close"]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }
    };

    // Screen reader announcements
    const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';

      document.body.appendChild(announcement);
      announcement.textContent = message;

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    };

    // Add skip link to page
    const addSkipLink = () => {
      const existingSkipLink = document.getElementById('skip-to-main');
      if (!existingSkipLink) {
        const skipLink = document.createElement('a');
        skipLink.id = 'skip-to-main';
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          z-index: 1000;
          border-radius: 4px;
          font-size: 14px;
        `;
        skipLink.addEventListener('focus', () => {
          skipLink.style.top = '6px';
        });
        skipLink.addEventListener('blur', () => {
          skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
      }
    };

    // Enhanced focus management
    const enhanceFocusManagement = () => {
      // Add focus trap for modals
      const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const modal = document.querySelector('[role="dialog"][aria-hidden="false"]') as HTMLElement;
          if (modal) {
            const focusableContent = modal.querySelectorAll(focusableElements);
            const firstFocusableElement = focusableContent[0] as HTMLElement;
            const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;

            if (e.shiftKey) {
              if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      });
    };

    // Initialize accessibility features
    addSkipLink();
    enhanceFocusManagement();

    // Add event listeners
    document.addEventListener('keydown', handleSkipLink);
    document.addEventListener('keydown', handleKeyNavigation);

    // Announce page load to screen readers
    announceToScreenReader('Business Incubation and Innovation Hub page loaded');

    return () => {
      document.removeEventListener('keydown', handleSkipLink);
      document.removeEventListener('keydown', handleKeyNavigation);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default AccessibilityEnhancer;