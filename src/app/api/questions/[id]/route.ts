import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Question from '@/models/Question.model';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/questions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const question = await Question.findById(id)
            .populate('createdBy', 'name email')
            .populate('subject', 'name');

        if (!question) {
            return Response.json({ message: 'Question not found' }, { status: 404 });
        }

        return Response.json({ question });
    } catch (error: unknown) {
        console.error('Get question error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// PUT /api/questions/[id]
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

        const question = await Question.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        )
            .populate('createdBy', 'name email')
            .populate('subject', 'name');

        if (!question) {
            return Response.json({ message: 'Question not found' }, { status: 404 });
        }

        return Response.json({ message: 'Question updated successfully', question });
    } catch (error: unknown) {
        console.error('Update question error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// DELETE /api/questions/[id]
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

        const question = await Question.findById(id);
        if (!question) {
            return Response.json({ message: 'Question not found' }, { status: 404 });
        }

        // Check if question is used in any Test
        const testsWithQuestion = await Test.find({ 'questions.question': id }).select('title');
        if (testsWithQuestion.length > 0) {
            return Response.json({
                message: 'Cannot delete question due to existing dependencies',
                dependencies: [`Used in ${testsWithQuestion.length} test(s): ${testsWithQuestion.map((t: { title: string }) => t.title).join(', ')}`]
            }, { status: 409 });
        }

        await Question.findByIdAndDelete(id);
        return Response.json({ message: 'Question deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete question error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
