import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group.model';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/groups/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const group = await Group.findById(id)
            .populate('subject', 'name')
            .populate('students', 'name email')
            .populate('teachers', 'name email')
            .populate('createdBy', 'name email');

        if (!group) {
            return Response.json({ message: 'Group not found' }, { status: 404 });
        }

        return Response.json({ group });
    } catch (error: unknown) {
        console.error('Get group error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// PUT /api/groups/[id]
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

        const group = await Group.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        )
            .populate('subject', 'name')
            .populate('students', 'name email')
            .populate('teachers', 'name email')
            .populate('createdBy', 'name email');

        if (!group) {
            return Response.json({ message: 'Group not found' }, { status: 404 });
        }

        return Response.json({ message: 'Group updated successfully', group });
    } catch (error: unknown) {
        console.error('Update group error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// DELETE /api/groups/[id]
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

        const group = await Group.findById(id);
        if (!group) {
            return Response.json({ message: 'Group not found' }, { status: 404 });
        }

        // Check if group is assigned to any tests
        const testsWithGroup = await Test.find({ assignedGroups: id }).select('title');
        if (testsWithGroup.length > 0) {
            return Response.json({
                message: 'Cannot delete group due to existing dependencies',
                dependencies: [`Assigned to ${testsWithGroup.length} test(s): ${testsWithGroup.map((t: { title: string }) => t.title).join(', ')}`]
            }, { status: 409 });
        }

        await Group.findByIdAndDelete(id);
        return Response.json({ message: 'Group deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete group error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
