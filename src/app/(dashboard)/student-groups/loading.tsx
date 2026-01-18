import { CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg shadow-sm border flex gap-4 items-center h-[72px] animate-pulse" />
            <CardGridSkeleton count={6} />
        </div>
    );
}
