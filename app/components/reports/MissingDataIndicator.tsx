import React from 'react';

export interface MissingDataIndicatorProps {
  /** Text to display (default: "Missing") */
  text?: string;
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: 'xs' | 'sm';
}

/**
 * Missing data indicator component
 * Displays a styled indicator for missing or incomplete data
 * Matches styling from reference files (amber/yellow warning color)
 */
const MissingDataIndicator: React.FC<MissingDataIndicatorProps> = ({
  text = 'Missing',
  className = '',
  size = 'xs',
}) => {
  const sizeClass = size === 'xs' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={`inline-block text-amber-700 font-medium ${sizeClass} ${className}`}
      title={`Missing data: ${text}`}
    >
      {text}
    </span>
  );
};

export default MissingDataIndicator;

