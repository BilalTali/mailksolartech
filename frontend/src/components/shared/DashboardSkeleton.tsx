import { Skeleton } from "./Skeleton";

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="hidden md:flex gap-3">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 flex items-start justify-between">
                        <div className="space-y-3">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Content Skeleton */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-slate-100">
                        <Skeleton className="h-6 w-40 mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex gap-3 items-center">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Content Skeleton */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 border border-slate-100">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-12 w-full mb-3" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-100">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
