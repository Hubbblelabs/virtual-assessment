import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-card p-4 rounded-lg shadow-sm border flex gap-4 items-center h-[72px] animate-pulse" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg shadow-sm border h-[100px] animate-pulse" />
                <div className="bg-card p-4 rounded-lg shadow-sm border h-[100px] animate-pulse" />
                <div className="bg-card p-4 rounded-lg shadow-sm border h-[100px] animate-pulse" />
                <div className="bg-card p-4 rounded-lg shadow-sm border h-[100px] animate-pulse" />
            </div>

            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                <TableSkeleton rows={10} columns={6} />
            </div>
        </div>
    );
}
