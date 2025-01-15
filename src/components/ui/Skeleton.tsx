interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-md ${className}`}
    />
  );
}

export function GoalsSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-7 w-48 mb-2">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="h-4 w-36">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4">
            <div className="h-6 w-24 mb-4">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="h-2.5 w-full">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 