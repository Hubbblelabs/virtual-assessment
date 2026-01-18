import { CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 h-[72px] animate-pulse" />
            <CardGridSkeleton count={6} />
        </div>
    );
}
