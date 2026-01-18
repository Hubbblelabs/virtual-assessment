'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardSkeleton } from "@/components/skeletons";
import {
    BookOpen,
    FileText,
    CheckCircle,
    Clock,
    ArrowRight,
    TrendingUp,
    Users,
    ClipboardList,
    FileQuestion,
    UsersRound,
    BarChart3,
    GraduationCap
} from 'lucide-react';

interface Stats {
    assignedTests?: number;
    completedTests?: number;
    pendingTests?: number;
    averageScore?: number;
    totalStudents?: number;
    totalTeachers?: number;
    totalQuestions?: number;
    totalTests?: number;
    totalSubmissions?: number;
    totalGroups?: number;
    evaluatedSubmissions?: number;
    pendingSubmissions?: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/analytics?type=overview');
            setStats(response.data.overview || {});
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            setStats({});
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    // Admin Dashboard
    if (user?.role === 'admin') {
        return (
            <div className="space-y-8 p-6">


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                            <FileQuestion className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalQuestions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalTests || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                            <UsersRound className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalGroups || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Evaluated</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.evaluatedSubmissions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Evaluation</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingSubmissions || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common administrative tasks.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                                <Link href="/users">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">Manage Users</div>
                                            <div className="text-xs text-muted-foreground">Add or edit users</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                                <Link href="/subjects">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">Manage Subjects</div>
                                            <div className="text-xs text-muted-foreground">Configure subjects and chapters</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>System Overview</CardTitle>
                            <CardDescription>Platform activity summary.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Submissions</span>
                                    <span className="font-bold">{stats?.totalSubmissions || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                                    <span className="font-bold">
                                        {stats?.totalSubmissions && stats?.evaluatedSubmissions
                                            ? Math.round((stats.evaluatedSubmissions / stats.totalSubmissions) * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Teacher Dashboard
    if (user?.role === 'teacher') {
        return (
            <div className="space-y-8 p-6">


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Questions</CardTitle>
                            <FileQuestion className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalQuestions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Tests</CardTitle>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalTests || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Evaluated</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.evaluatedSubmissions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pendingSubmissions || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks for teachers.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                                <Link href="/questions/create">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <FileQuestion className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">Create Question</div>
                                            <div className="text-xs text-muted-foreground">Add a new question to the bank</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                                <Link href="/tests/create">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <ClipboardList className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">Create Test</div>
                                            <div className="text-xs text-muted-foreground">Build a new assessment</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>My Groups</CardTitle>
                            <CardDescription>Student groups you manage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-4">
                                <UsersRound className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">View and manage your student groups</p>
                                <Button variant="link" asChild className="mt-2">
                                    <Link href="/student-groups">View Groups</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Student Dashboard (default)
    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-end">
                <Button asChild>
                    <Link href="/tests">View All Tests</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Tests</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.assignedTests || 0}</div>
                        <p className="text-xs text-muted-foreground">Total tests assigned to you</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.completedTests || 0}</div>
                        <p className="text-xs text-muted-foreground">Tests submitted successfully</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pendingTests || 0}</div>
                        <p className="text-xs text-muted-foreground">Tests waiting for submission</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
                        <p className="text-xs text-muted-foreground">Across all completed tests</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks you might want to perform.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                            <Link href="/tests">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">Take a Test</div>
                                        <div className="text-xs text-muted-foreground">View available tests and start</div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-between h-auto py-4" asChild>
                            <Link href="/reports">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">View Analytics</div>
                                        <div className="text-xs text-muted-foreground">Check your performance reports</div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>Tips for using the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-sm">View your assigned tests in the Tests section</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-sm">Track your progress in the Reports section</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
