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
      <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
        <SkeletonLine width="w-1/3" height="h-5" />
        <SkeletonLine width="w-full" height="h-4" />
        <SkeletonLine width="w-2/3" height="h-4" />
      </div>
    ))}
  </div>
);

const TableLayout: React.FC<{ count: number }> = ({ count }) => (
  <div className="overflow-x-auto">
    <div className="min-w-full border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex gap-4">
          <SkeletonLine width="w-1/4" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-4" />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-b border-gray-200 p-4 last:border-b-0">
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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
        <SkeletonLine width="w-20 h-20" height="h-20" className="rounded-full mx-auto" />
        <SkeletonLine width="w-3/4 mx-auto" height="h-5" />
        <SkeletonLine width="w-full" height="h-4" />
        <SkeletonLine width="w-5/6 mx-auto" height="h-4" />
      </div>
    ))}
  </div>
);

const FormLayout: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="space-y-2">
        <SkeletonLine width="w-1/4" height="h-4" />
        <SkeletonLine width="w-full" height="h-10" className="rounded-md" />
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
    <div className={`w-full ${className}`} role="status" aria-label="Loading content">
      {layout === 'list' && <ListLayout count={count} />}
      {layout === 'table' && <TableLayout count={count} />}
      {layout === 'card' && <CardLayout count={count} />}
      {layout === 'form' && <FormLayout count={count} />}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default PageSkeleton;
