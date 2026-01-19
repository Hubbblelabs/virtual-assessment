'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportsSkeleton } from "@/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, FileX, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface OverviewData {
  totalTests: number;
  averageScore: number;
  highestScore: number;
  highestScoreSubject: string;
  studyTimeHours: number;
}

interface PerformanceItem {
  name: string;
  score: number;
  average: number;
}

interface SubjectItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ReportData {
  overview: OverviewData;
  performance: PerformanceItem[];
  subjects: SubjectItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchReports = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);

    setError(null);
    try {
      const response = await api.get(`/analytics/reports?range=${timeRange}`);
      setReportData(response.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      // Only set error if we don't have data yet
      if (!reportData) {
        setError(err.response?.data?.message || 'Failed to load reports data');
      }
    } finally {
      if (showLoading) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(true);

    // Poll every 30 seconds
    const intervalId = setInterval(() => {
      fetchReports(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [timeRange]);

  const handleManualRefresh = () => {
    fetchReports(false);
  };

  if (loading) {
    return <ReportsSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Reports</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = reportData && reportData.overview.totalTests > 0;

  if (!hasData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven&apos;t completed any evaluated tests yet. Once you take and get your tests evaluated, your performance reports will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, performance, subjects } = reportData;

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Reports</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Student'}. Here&apos;s your latest progress analysis.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="semester">Current Semester</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleManualRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Loader2 className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Data • Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalTests}</div>
                <p className="text-xs text-muted-foreground">Evaluated tests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.averageScore}%</div>
                <p className="text-xs text-muted-foreground">Across all tests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.highestScore}%</div>
                <p className="text-xs text-muted-foreground">In {overview.highestScoreSubject}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.studyTimeHours}h</div>
                <p className="text-xs text-muted-foreground">Total test time</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Your scores vs class average over time</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" name="Your Score" strokeWidth={2} />
                    <Line type="monotone" dataKey="average" stroke="#82ca9d" name="Class Average" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Performance by subject</CardDescription>
              </CardHeader>
              <CardContent>
                {subjects.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={subjects}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {subjects.map((_, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    No subject data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Analysis</CardTitle>
              <CardDescription>A detailed look at your test scores.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" name="Your Score" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="average" fill="#82ca9d" name="Class Average" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {subjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((subject: SubjectItem, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>Average Score: {subject.value}%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                        style={{ width: `${subject.value}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {subject.value >= 90 ? 'Excellent' : subject.value >= 75 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No subject data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
