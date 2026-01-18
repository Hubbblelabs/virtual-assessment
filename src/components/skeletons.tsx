// Shared skeleton components
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Middle Stats Grid - 3 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Grid - 2 cols (Quick Actions / System Overview) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-card p-4 sm:p-6 rounded-lg shadow space-y-4">
                    <div className="flex justify-between">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="pt-4 mt-4 border-t flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
    return (
        <div className="rounded-md border">
            <div className="h-10 border-b bg-muted/50 px-4 flex items-center gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="h-16 px-4 flex items-center gap-4">
                        {Array.from({ length: columns }).map((_, j) => (
                            <Skeleton key={j} className="h-4 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export function SubjectCardSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-md border p-4 sm:p-5 h-[200px] flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <Skeleton className="h-5 w-5 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function QuestionListSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow-md border overflow-hidden p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ReportsSkeleton() {
    // Skeleton for the reports page
    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
            </div>

            <div className="space-y-4">
                <div className="flex gap-2 border-b">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card p-6 rounded-lg shadow border space-y-2">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
                    <div className="col-span-4 bg-card p-6 rounded-lg shadow border">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <Skeleton className="h-[350px] w-full" />
                    </div>
                    <div className="col-span-3 bg-card p-6 rounded-lg shadow border">
                        <Skeleton className="h-6 w-48 mb-4" />
                        <Skeleton className="h-[350px] w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
