import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/tests/[id]/unpublish-results
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

        const test = await Test.findByIdAndUpdate(
            id,
            { resultsPublished: false },
            { new: true }
        ).populate('subject', 'name')
            .populate('createdBy', 'name email');

        if (!test) {
            return Response.json({ message: 'Test not found' }, { status: 404 });
        }

        return Response.json({ message: 'Test results unpublished successfully', test });
    } catch (error: unknown) {
        console.error('Unpublish results error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
