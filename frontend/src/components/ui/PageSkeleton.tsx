import { Skeleton } from "./Skeleton";

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-4 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
           <Skeleton className="h-10 w-10 rounded-full" />
           <div className="flex flex-col gap-1">
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-3 w-16" />
           </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="pt-24 px-4 space-y-6 max-w-md mx-auto sm:max-w-xl">
        {/* Banner/Card Skeleton */}
        <Skeleton className="w-full h-40 rounded-2xl" />
        
        {/* List Items Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4">
              <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Nav Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 px-6 flex justify-between items-center z-50">
         {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-2 w-10 rounded-md" />
            </div>
         ))}
      </div>
    </div>
  );
}
