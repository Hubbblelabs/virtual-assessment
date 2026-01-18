'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Clock,
    Calendar,
    FileText,
    CheckCircle,
    PlayCircle,
    ArrowLeft,
    Edit,
    AlertCircle
} from 'lucide-react';

interface Test {
    _id: string;
    title: string;
    description?: string;
    subject: {
        _id: string;
        name: string;
    };
    duration: number;
    totalMarks: number;
    questions: any[];
    assignedTo: any[];
    scheduledDate?: string;
    deadline?: string;
    isPublished: boolean;
    showResultsImmediately?: boolean;
    resultsPublished?: boolean;
    createdAt: string;
}

export default function TestDetailsPage() {
    // Need to handle potential array params, though [testId] usually is string
    const params = useParams();
    const testId = Array.isArray(params.testId) ? params.testId[0] : params.testId;

    const router = useRouter();
    const { user } = useAuth();
    const [test, setTest] = useState<Test | null>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
    const isStudent = user?.role === 'student';

    useEffect(() => {
        const fetchData = async () => {
            if (!testId) return;

            try {
                setLoading(true);

                // Fetch test details
                // Note: The API response structure depends on the backend. 
                // Based on TestsPage keys, response.data.test is likely.
                // Assuming api.get(`/tests/${testId}`) returns { test: ... }
                const testResponse = await api.get(`/tests/${testId}`);
                const testData = testResponse.data.test || testResponse.data;
                setTest(testData);

                // If student, fetch submissions to check status
                if (isStudent) {
                    try {
                        const subResponse = await api.get('/submissions');
                        const submissions = subResponse.data.submissions || [];
                        const sub = submissions.find((s: any) =>
                            s.test === testId || (s.test as any)?._id === testId
                        );
                        setSubmission(sub);
                    } catch (err) {
                        console.error('Failed to fetch submissions', err);
                    }
                }

            } catch (err: any) {
                console.error('Failed to fetch test details:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load test details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [testId, isStudent]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
                <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Error Loading Test</h2>
                <p className="text-muted-foreground mb-4">{error || 'Test not found'}</p>
                <Link href="/tests">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tests
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/tests">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tests
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-primary border-primary/20">
                            {test.subject?.name || 'Subject'}
                        </Badge>
                        {test.isPublished ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border-0">
                                Published
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                                Draft
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{test.title}</h1>
                </div>

                {isTeacher && (
                    <Link href={`/tests/edit/${test._id}`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Test
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>About this Test</CardTitle>
                        <CardDescription>Overview and instructions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {test.description ? (
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                                <p>{test.description}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">No description provided.</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            <div className="flex flex-col p-4 bg-muted/40 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium">Duration</span>
                                </div>
                                <span className="text-xl font-bold">{test.duration} <span className="text-sm font-normal text-muted-foreground">mins</span></span>
                            </div>

                            <div className="flex flex-col p-4 bg-muted/40 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm font-medium">Questions</span>
                                </div>
                                <span className="text-xl font-bold">{test.questions?.length || 0}</span>
                            </div>

                            <div className="flex flex-col p-4 bg-muted/40 rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Marks</span>
                                </div>
                                <span className="text-xl font-bold">{test.totalMarks}</span>
                            </div>
                        </div>

                        {test.scheduledDate && (
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <p className="font-medium text-blue-900 dark:text-blue-200">Scheduled Date</p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">{formatDate(test.scheduledDate)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/5 border-t p-6">
                        {isStudent && (
                            <div className="w-full">
                                {submission ? (
                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full bg-muted/50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium">You have submitted this test</p>
                                                <p className="text-xs text-muted-foreground">Status: {submission.status}</p>
                                            </div>
                                        </div>
                                        {(test.showResultsImmediately || test.resultsPublished) ? (
                                            <Link href={`/tests/submissions/evaluate/${submission._id}`}>
                                                <Button size="sm">View Results</Button>
                                            </Link>
                                        ) : (
                                            <Button size="sm" variant="secondary" disabled>Results Pending</Button>
                                        )}
                                    </div>
                                ) : (
                                    <Link href={`/tests/take/${test._id}`} className="block w-full">
                                        <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 font-semibold text-lg h-12">
                                            <PlayCircle className="h-5 w-5 mr-2" />
                                            Start Test
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}

                        {isTeacher && (
                            <Link href={`/tests/submissions?testId=${test._id}`} className="ml-auto">
                                <Button variant="secondary">
                                    View Submissions
                                </Button>
                            </Link>
                        )}
                    </CardFooter>
                </Card>

                {/* Sidebar info */}
                <div className="space-y-4">
                    {isTeacher && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Visibility</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Status</span>
                                    <Badge variant={test.isPublished ? "default" : "secondary"}>
                                        {test.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
