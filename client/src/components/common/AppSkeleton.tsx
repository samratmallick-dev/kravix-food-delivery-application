const Shimmer = ({ className }: { className: string }) => (
      <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);

const AppSkeleton = () => (
      <div className="min-h-screen bg-background">
            {/* Navbar skeleton */}
            <div className="w-full bg-background shadow-md">
                  <div className="container-app flex items-center justify-between py-4 h-24">
                        <Shimmer className="h-10 w-32" />
                        <div className="flex gap-3">
                              <Shimmer className="h-10 w-24" />
                              <Shimmer className="h-10 w-10" />
                        </div>
                  </div>
                  <div className="border-t border-gray-200 py-3 px-3">
                        <div className="container-app">
                              <Shimmer className="h-10 w-full max-w-xl" />
                        </div>
                  </div>
            </div>

            {/* Hero skeleton */}
            <Shimmer className="w-full h-64 rounded-none" />

            {/* Cards grid skeleton */}
            <div className="container-app py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-border">
                              <Shimmer className="h-36 w-full rounded-none" />
                              <div className="p-3 space-y-2">
                                    <Shimmer className="h-4 w-3/4" />
                                    <Shimmer className="h-3 w-1/2" />
                              </div>
                        </div>
                  ))}
            </div>
      </div>
);

export default AppSkeleton;
