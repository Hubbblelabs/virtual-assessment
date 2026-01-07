'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { Eye, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

interface Submission {
    _id: string;
    student: {
        _id: string;
        name: string;
        email: string;
    };
    status: 'pending' | 'submitted' | 'evaluated';
    totalMarksObtained?: number;
    submittedAt: string;
    attemptNumber: number;
}

interface Test {
    _id: string;
    title: string;
    totalMarks: number;
}

export default function SubmissionsPage() {
    const params = useParams();
    const testId = params.testId as string;
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const { setLabel } = useBreadcrumb();

    useEffect(() => {
        fetchData();
    }, [testId]);

    const fetchData = async () => {
        try {
            const [testRes, submissionsRes] = await Promise.all([
                api.get(`/tests/${testId}`),
                api.get(`/submissions?test=${testId}`)
            ]);
            setTest(testRes.data.test);
            setSubmissions(submissionsRes.data.submissions || []);
            setLabel(testId, testRes.data.test.title);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'evaluated':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Evaluated
                    </span>
                );
            case 'submitted':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        <Clock className="h-3 w-3" />
                        Submitted
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                        <AlertCircle className="h-3 w-3" />
                        Pending
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse">Loading submissions...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{test?.title} - Submissions</h1>
                    <p className="text-muted-foreground">View and evaluate student submissions</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            {submissions.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-muted-foreground">No submissions yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Submitted</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {submissions.map((submission) => (
                                <tr key={submission._id} className="hover:bg-muted/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{submission.student?.name}</div>
                                        <div className="text-sm text-muted-foreground">{submission.student?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(submission.status)}</td>
                                    <td className="px-6 py-4">
                                        {submission.status === 'evaluated'
                                            ? `${submission.totalMarksObtained} / ${test?.totalMarks}`
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {new Date(submission.submittedAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/tests/${testId}/submissions/${submission._id}/evaluate`}>
                                                <Eye className="h-4 w-4 mr-1" />
                                                {submission.status === 'evaluated' ? 'Review' : 'Evaluate'}
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
