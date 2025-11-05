import React from 'react';

export interface PageSkeletonProps {
  count?: number;
  layout?: 'list' | 'table' | 'card' | 'form';
  className?: string;
}

const SkeletonLine: React.FC<{ width?: string; height?: string; className?: string }> = ({ 
  width = 'w-full', 
  height = 'h-4',
  className = '' 
}) => (
  <div className={`bg-gray-200 rounded animate-pulse ${width} ${height} ${className}`} />
);

const ListLayout: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-3/4" height="h-4" />
            <SkeletonLine width="w-1/2" height="h-3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TableLayout: React.FC<{ count: number }> = ({ count }) => (
  <div className="overflow-x-auto">
    <div className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex gap-4">
          <SkeletonLine width="w-1/4" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-4" />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 last:border-b-0 animate-pulse">
          <div className="flex gap-4">
            <SkeletonLine width="w-1/4" height="h-4" />
            <SkeletonLine width="w-1/4" height="h-4" />
            <SkeletonLine width="w-1/4" height="h-4" />
            <SkeletonLine width="w-1/4" height="h-4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CardLayout: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm animate-pulse">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl mb-3 sm:mb-4" />
        <div className="space-y-2">
          <SkeletonLine width="w-3/4" height="h-3" />
          <SkeletonLine width="w-1/2" height="h-6" />
        </div>
      </div>
    ))}
  </div>
);

const FormLayout: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-4 sm:space-y-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="space-y-2 animate-pulse">
        <SkeletonLine width="w-1/4" height="h-4" />
        <SkeletonLine width="w-full" height="h-11" className="rounded-xl" />
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ 
  count = 5, 
  layout = 'list',
  className = '' 
}) => {
  return (
    <div 
      className={`w-full ${className}`} 
      role="status" 
      aria-label="Loading content"
      aria-live="polite"
    >
      {layout === 'list' && <ListLayout count={count} />}
      {layout === 'table' && <TableLayout count={count} />}
      {layout === 'card' && <CardLayout count={count} />}
      {layout === 'form' && <FormLayout count={count} />}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

export default PageSkeleton;
