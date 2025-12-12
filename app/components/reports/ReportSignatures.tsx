import React from 'react';

export interface SignatureField {
  /** Label for the signature field (e.g., "Prepared by", "Review and Approved") */
  label: string;
  /** Whether this field is optional */
  optional?: boolean;
}

export interface ReportSignaturesProps {
  /** Array of signature field definitions */
  signatures: SignatureField[];
  /** Additional className for customization */
  className?: string;
  /** Spacing between signature fields */
  spacing?: 'default' | 'compact' | 'wide';
}

/**
 * Report signature section component
 * Displays signature lines for "Prepared by", "Review and Approved", etc.
 * Matches the styling from reference files (bank.blade.php)
 */
const ReportSignatures: React.FC<ReportSignaturesProps> = ({
  signatures,
  className = '',
  spacing = 'default',
}) => {
  const spacingClass =
    spacing === 'compact'
      ? 'gap-8'
      : spacing === 'wide'
      ? 'gap-20'
      : 'gap-16';

  return (
    <div className={`mt-12 flex flex-col sm:flex-row sm:flex-wrap ${spacingClass} text-sm text-gray-800 report-signatures ${className}`}>
      {signatures.map((signature, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          <div className="font-semibold">{signature.label}</div>
          <div
            className="border-b border-gray-400 w-48 sm:w-64 signature-line print:border-gray-900"
            style={{ minHeight: '24px' }}
          ></div>
        </div>
      ))}
    </div>
  );
};

export default ReportSignatures;

