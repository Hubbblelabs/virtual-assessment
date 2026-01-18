'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SubmissionsRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const testId = searchParams.get('testId');

    useEffect(() => {
        if (testId) {
            router.replace(`/tests/${testId}/submissions`);
        } else {
            router.replace('/tests');
        }
    }, [testId, router]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <SubmissionsRedirect />
        </Suspense>
    )
}
