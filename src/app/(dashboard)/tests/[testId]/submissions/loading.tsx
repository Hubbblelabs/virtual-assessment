import { TableSkeleton } from "@/components/skeletons";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end h-10">
                <div className="h-10 w-20 rounded-md bg-muted animate-pulse" />
            </div>
            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                <TableSkeleton rows={8} columns={5} />
            </div>
        </div>
    );
}
