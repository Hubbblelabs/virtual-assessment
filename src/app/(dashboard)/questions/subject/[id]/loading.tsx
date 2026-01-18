import { QuestionListSkeleton } from "@/components/skeletons";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 h-10">
                <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
                <div className="ml-auto h-10 w-32 rounded-md bg-muted animate-pulse" />
            </div>
            <QuestionListSkeleton />
        </div>
    )
}
