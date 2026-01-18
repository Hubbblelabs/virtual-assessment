import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Test from '@/models/Test.model';
import Submission from '@/models/Submission.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/tests/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const test = await Test.findById(id)
            .populate('subject', 'name')
            .populate('createdBy', 'name email')
            .populate({
                path: 'questions.question',
                populate: { path: 'subject', select: 'name' }
            })
            .populate('assignedTo', 'name email')
            .populate('assignedGroups', 'name');

        if (!test) {
            return Response.json({ message: 'Test not found' }, { status: 404 });
        }

        return Response.json({ test });
    } catch (error: unknown) {
        console.error('Get test error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// PUT /api/tests/[id]
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
        const body = await request.json();

        // Recalculate total marks if questions are updated
        if (body.questions) {
            body.totalMarks = body.questions.reduce((sum: number, q: { marks: number }) => sum + (q.marks || 0), 0);
        }

        const test = await Test.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        )
            .populate('subject', 'name')
            .populate('createdBy', 'name email')
            .populate('questions.question');

        if (!test) {
            return Response.json({ message: 'Test not found' }, { status: 404 });
        }

        return Response.json({ message: 'Test updated successfully', test });
    } catch (error: unknown) {
        console.error('Update test error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// DELETE /api/tests/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        const test = await Test.findById(id);
        if (!test) {
            return Response.json({ message: 'Test not found' }, { status: 404 });
        }

        // Delete all associated submissions first
        const deleteResult = await Submission.deleteMany({ test: id });

        // Then delete the test
        await Test.findByIdAndDelete(id);

        const submissionsDeleted = deleteResult.deletedCount || 0;
        return Response.json({
            message: submissionsDeleted > 0
                ? `Test and ${submissionsDeleted} submission(s) deleted successfully`
                : 'Test deleted successfully',
            submissionsDeleted
        });
    } catch (error: unknown) {
        console.error('Delete test error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
