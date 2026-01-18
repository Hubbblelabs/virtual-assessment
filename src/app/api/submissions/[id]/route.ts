import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/models/Submission.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/submissions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const submission = await Submission.findById(id)
            .populate({
                path: 'test',
                select: 'title subject totalMarks duration showCorrectAnswers resultsPublished',
                populate: { path: 'subject', select: 'name' }
            })
            .populate('student', 'name email')
            .populate('evaluatedBy', 'name email')
            .populate({
                path: 'answers.question',
                select: 'questionText marks questionType correctAnswer options chapter topic attachments correctAnswerAttachments'
            });

        if (!submission) {
            return Response.json({ message: 'Submission not found' }, { status: 404 });
        }

        return Response.json({ submission });
    } catch (error: unknown) {
        console.error('Get submission error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// PUT /api/submissions/[id] - Evaluate submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }
        if (auth.role !== UserRole.ADMIN && auth.role !== UserRole.TEACHER) {
            return createForbiddenResponse();
        }

        await connectDB();
        const { id } = await params;
        const { answers, totalMarksObtained } = await request.json();

        const updateData: Record<string, unknown> = {
            evaluatedBy: auth.userId,
            evaluatedAt: new Date(),
            status: 'evaluated'
        };

        if (answers) updateData.answers = answers;
        if (totalMarksObtained !== undefined) updateData.totalMarksObtained = totalMarksObtained;

        const submission = await Submission.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('test', 'title')
            .populate('student', 'name email')
            .populate('evaluatedBy', 'name email');

        if (!submission) {
            return Response.json({ message: 'Submission not found' }, { status: 404 });
        }

        return Response.json({ message: 'Submission evaluated successfully', submission });
    } catch (error: unknown) {
        console.error('Evaluate submission error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
