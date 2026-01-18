import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission.model';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

// POST /api/tests/[id]/start - Start a test attempt (creates a pending submission)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        // Only students can start tests
        if (auth.role !== UserRole.STUDENT) {
            return Response.json({ message: 'Only students can start tests' }, { status: 403 });
        }

        const { id: testId } = await params;

        await connectDB();

        // Verify test exists and is published
        const test = await Test.findById(testId);
        if (!test) {
            return Response.json({ message: 'Test not found' }, { status: 404 });
        }
        if (!test.isPublished) {
            return Response.json({ message: 'Test is not published' }, { status: 400 });
        }

        // Check for existing pending submission (test already in progress)
        const pendingSubmission = await Submission.findOne({
            test: testId,
            student: auth.userId,
            status: 'pending'
        });

        if (pendingSubmission) {
            // Return the existing pending submission
            return Response.json({
                message: 'Test already in progress',
                submission: pendingSubmission,
                attemptNumber: pendingSubmission.attemptNumber
            });
        }

        // Count all existing submissions to determine next attempt number
        const allExistingSubmissions = await Submission.find({
            test: testId,
            student: auth.userId
        }).sort({ attemptNumber: -1 }).limit(1);

        const latestAttemptNumber = allExistingSubmissions.length > 0
            ? allExistingSubmissions[0].attemptNumber
            : 0;

        // Count completed submissions to check against max attempts
        const completedSubmissions = await Submission.countDocuments({
            test: testId,
            student: auth.userId,
            status: { $in: ['submitted', 'evaluated'] }
        });

        if (completedSubmissions >= test.attempts) {
            return Response.json({ message: 'Maximum attempts reached' }, { status: 400 });
        }

        const nextAttemptNumber = latestAttemptNumber + 1;

        // Create a new pending submission to mark the test as started
        // Use findOneAndUpdate with upsert to handle race conditions and duplicate key errors
        const submission = await Submission.findOneAndUpdate(
            {
                test: testId,
                student: auth.userId,
                attemptNumber: nextAttemptNumber
            },
            {
                $setOnInsert: {
                    test: testId,
                    student: auth.userId,
                    answers: [],
                    status: 'pending',
                    attemptNumber: nextAttemptNumber
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return Response.json({
            message: 'Test started successfully',
            submission: submission,
            attemptNumber: submission.attemptNumber
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Start test error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
