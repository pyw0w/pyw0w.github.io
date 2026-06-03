/** Skeleton placeholder matching the final shape. Shimmer animation. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
      />
    </div>
  );
}

export function PosterSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[3/4] rounded-card" />
      <Skeleton className="h-3.5 w-3/4 rounded-sm" />
    </div>
  );
}

export function PosterGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <PosterSkeleton key={i} />
      ))}
    </div>
  );
}
