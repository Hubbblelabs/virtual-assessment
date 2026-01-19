import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission.model';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface SubjectPerformance {
    name: string;
    value: number;
    count: number;
}

// GET /api/analytics/reports - Get reports data for the current user
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || 'all';

        // Build date filter based on range
        let dateFilter: Record<string, unknown> = {};
        const now = new Date();

        switch (range) {
            case 'week':
                dateFilter = { submittedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case 'month':
                dateFilter = { submittedAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
                break;
            case 'semester':
                // Approximate semester as 6 months
                dateFilter = { submittedAt: { $gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) } };
                break;
            case 'all':
            default:
                // No date filter
                break;
        }

        // Build query filter based on user role
        const filter: Record<string, unknown> = {
            status: 'evaluated',
            ...dateFilter
        };

        if (auth.role === UserRole.STUDENT) {
            // Students see only their own submissions
            filter.student = auth.userId;
        }

        // Fetch user's evaluated submissions
        const submissions = await Submission.find(filter)
            .populate({
                path: 'test',
                select: 'title totalMarks subject',
                populate: {
                    path: 'subject',
                    select: 'name'
                }
            })
            .sort({ submittedAt: 1 });

        // Calculate overview statistics
        const totalTests = submissions.length;
        let totalScore = 0;
        let totalMaxScore = 0;
        let highestScore = 0;
        let highestScoreSubject = '';
        let totalTime = 0;

        // Calculate performance data for charts
        const performanceData: { name: string; score: number; average: number }[] = [];
        const subjectMap = new Map<string, SubjectPerformance>();

        // Get all test IDs to calculate class averages
        const testIds = [...new Set(submissions.map(s => s.test?._id?.toString()).filter(Boolean))];

        // Get average scores per test (from all students' submissions)
        const testAverages = new Map<string, number>();
        if (testIds.length > 0) {
            const allSubmissionsForTests = await Submission.aggregate([
                {
                    $match: {
                        test: { $in: testIds.map(id => id) },
                        status: 'evaluated'
                    }
                },
                {
                    $group: {
                        _id: '$test',
                        avgScore: { $avg: '$totalMarksObtained' }
                    }
                }
            ]);

            allSubmissionsForTests.forEach(item => {
                testAverages.set(item._id.toString(), Math.round(item.avgScore || 0));
            });
        }

        submissions.forEach((submission, index) => {
            const testDoc = submission.test as any;
            if (!testDoc) return;

            const totalMarks = testDoc.totalMarks || 100;
            const marksObtained = submission.totalMarksObtained || 0;
            const percentageScore = Math.round((marksObtained / totalMarks) * 100);

            totalScore += marksObtained;
            totalMaxScore += totalMarks;
            totalTime += submission.timeTaken || 0;

            // Track highest score
            if (percentageScore > highestScore) {
                highestScore = percentageScore;
                highestScoreSubject = testDoc.subject?.name || 'Unknown';
            }

            // Performance data for line/bar charts
            const testAvg = testAverages.get(testDoc._id.toString()) || 0;
            const avgPercentage = Math.round((testAvg / totalMarks) * 100);

            performanceData.push({
                name: testDoc.title || `Test ${index + 1}`,
                score: percentageScore,
                average: avgPercentage
            });

            // Subject aggregation for pie chart
            const subjectName = testDoc.subject?.name || 'General';
            if (subjectMap.has(subjectName)) {
                const existing = subjectMap.get(subjectName)!;
                existing.value = Math.round(((existing.value * existing.count) + percentageScore) / (existing.count + 1));
                existing.count += 1;
            } else {
                subjectMap.set(subjectName, { name: subjectName, value: percentageScore, count: 1 });
            }
        });

        // Convert subject map to array
        const subjectData = Array.from(subjectMap.values()).map(({ name, value }) => ({
            name,
            value
        }));

        // Calculate overall average score as percentage
        const averageScore = totalMaxScore > 0
            ? Math.round((totalScore / totalMaxScore) * 100 * 10) / 10
            : 0;

        // Convert total time from minutes to hours
        const studyTimeHours = Math.round(totalTime / 60);

        return Response.json({
            overview: {
                totalTests,
                averageScore,
                highestScore,
                highestScoreSubject,
                studyTimeHours
            },
            performance: performanceData,
            subjects: subjectData
        });
    } catch (error: unknown) {
        console.error('Reports analytics error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
