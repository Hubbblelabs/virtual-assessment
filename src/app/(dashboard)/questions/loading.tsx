import { SubjectCardSkeleton } from "@/components/skeletons";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="bg-card p-3 sm:p-4 rounded-lg shadow-sm border h-[72px] animate-pulse" />
            <SubjectCardSkeleton />
        </div>
    );
}
