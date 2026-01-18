import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission.model';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

// GET /api/submissions - Get all submissions
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const testId = searchParams.get('test');
        const status = searchParams.get('status');

        const filter: Record<string, unknown> = {};

        if (testId) filter.test = testId;
        if (status) filter.status = status;

        // Students can only see their own submissions
        if (auth.role === UserRole.STUDENT) {
            filter.student = auth.userId;
        }

        const submissions = await Submission.find(filter)
            .populate('test', 'title subject totalMarks duration')
            .populate('student', 'name email')
            .populate('evaluatedBy', 'name email')
            .populate({
                path: 'answers.question',
                select: 'questionText marks questionType correctAnswer subject'
            })
            .sort({ submittedAt: -1 });

        return Response.json({ submissions });
    } catch (error: unknown) {
        console.error('Get submissions error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// POST /api/submissions - Create or update submission
export async function POST(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        const { testId, answers, timeTaken } = await request.json();

        // Verify test exists and is published
        const test = await Test.findById(testId);
        if (!test) {
            return Response.json({ message: 'Test not found' }, { status: 404 });
        }
        if (!test.isPublished) {
            return Response.json({ message: 'Test is not published' }, { status: 400 });
        }

        // Check for existing pending submission (test was started via /start endpoint)
        const pendingSubmission = await Submission.findOne({
            test: testId,
            student: auth.userId,
            status: 'pending'
        });

        if (pendingSubmission) {
            // Update the existing pending submission
            // Map 'answer' field from frontend to 'answerText' in database
            const mappedAnswers = (answers || []).map((a: { question: string; answer: string }) => ({
                question: a.question,
                answerText: a.answer
            }));
            pendingSubmission.answers = mappedAnswers;
            pendingSubmission.timeTaken = timeTaken;
            pendingSubmission.status = 'submitted';
            pendingSubmission.submittedAt = new Date();
            await pendingSubmission.save();

            const populatedSubmission = await Submission.findById(pendingSubmission._id)
                .populate('test', 'title')
                .populate('student', 'name email');

            return Response.json({ message: 'Submission updated successfully', submission: populatedSubmission }, { status: 200 });
        }

        // No pending submission - check attempt count for new submission
        const existingSubmissions = await Submission.countDocuments({
            test: testId,
            student: auth.userId
        });

        if (existingSubmissions >= test.attempts) {
            return Response.json({ message: 'Maximum attempts reached' }, { status: 400 });
        }

        // Create a new submission (for backwards compatibility)
        // Map 'answer' field from frontend to 'answerText' in database
        const mappedNewAnswers = (answers || []).map((a: { question: string; answer: string }) => ({
            question: a.question,
            answerText: a.answer
        }));
        const submission = new Submission({
            test: testId,
            student: auth.userId,
            answers: mappedNewAnswers,
            timeTaken,
            status: 'submitted',
            attemptNumber: existingSubmissions + 1
        });

        await submission.save();

        const populatedSubmission = await Submission.findById(submission._id)
            .populate('test', 'title')
            .populate('student', 'name email');

        return Response.json({ message: 'Submission created successfully', submission: populatedSubmission }, { status: 201 });
    } catch (error: unknown) {
        console.error('Create submission error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
