import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission.model';
import Test from '@/models/Test.model';
import Question from '@/models/Question.model';
import User from '@/models/User.model';
import Group from '@/models/Group.model';
import { getAuthFromRequest, createUnauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'overview';

        if (type === 'overview') {
            const [
                totalTests,
                totalQuestions,
                totalSubmissions,
                totalStudents,
                totalTeachers,
                totalGroups,
                evaluatedSubmissions,
                pendingSubmissions
            ] = await Promise.all([
                Test.countDocuments(),
                Question.countDocuments(),
                Submission.countDocuments(),
                User.countDocuments({ role: UserRole.STUDENT }),
                User.countDocuments({ role: UserRole.TEACHER }),
                Group.countDocuments(),
                Submission.countDocuments({ status: 'evaluated' }),
                Submission.countDocuments({ status: { $in: ['pending', 'submitted'] } })
            ]);

            return Response.json({
                overview: {
                    totalTests,
                    totalQuestions,
                    totalSubmissions,
                    totalStudents,
                    totalTeachers,
                    totalGroups,
                    evaluatedSubmissions,
                    pendingSubmissions
                }
            });
        }

        if (type === 'submissions') {
            const { testId } = Object.fromEntries(searchParams);

            const filter: Record<string, unknown> = {};
            if (testId) filter.test = testId;

            const submissions = await Submission.find(filter)
                .populate('test', 'title totalMarks')
                .populate('student', 'name email')
                .select('totalMarksObtained status submittedAt attemptNumber');

            // Calculate statistics
            const evaluatedSubs = submissions.filter(s => s.status === 'evaluated');
            const totalMarks = evaluatedSubs.reduce((sum, s) => sum + (s.totalMarksObtained || 0), 0);
            const averageScore = evaluatedSubs.length > 0 ? totalMarks / evaluatedSubs.length : 0;

            return Response.json({
                submissions,
                statistics: {
                    total: submissions.length,
                    evaluated: evaluatedSubs.length,
                    pending: submissions.length - evaluatedSubs.length,
                    averageScore: Math.round(averageScore * 100) / 100
                }
            });
        }

        return Response.json({ message: 'Invalid analytics type' }, { status: 400 });
    } catch (error: unknown) {
        console.error('Analytics error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
