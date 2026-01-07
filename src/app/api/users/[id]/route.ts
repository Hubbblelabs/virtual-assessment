import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User.model';
import Group from '@/models/Group.model';
import Question from '@/models/Question.model';
import Test from '@/models/Test.model';
import Submission from '@/models/Submission.model';
import { UserRole } from '@/models/User.model';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const user = await User.findById(id).select('-password');
        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        return Response.json({ user });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}

// PUT /api/users/[id] - Update user (Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }
        if (auth.role !== UserRole.ADMIN) {
            return createForbiddenResponse();
        }

        await connectDB();
        const { id } = await params;
        const updateData = await request.json();

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        return Response.json({ message: 'User updated successfully', user });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }
        if (auth.role !== UserRole.ADMIN) {
            return createForbiddenResponse();
        }

        await connectDB();
        const { id } = await params;

        const user = await User.findById(id);
        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        // Integrity Checks
        const dependencies: string[] = [];

        const groupsWithUser = await Group.find({
            $or: [{ students: id }, { teachers: id }]
        }).select('name');

        if (groupsWithUser.length > 0) {
            dependencies.push(`Member of ${groupsWithUser.length} group(s): ${groupsWithUser.map((g: { name: string }) => g.name).join(', ')}`);
        }

        const userTests = await Test.find({ createdBy: id }).select('title');
        if (userTests.length > 0) {
            dependencies.push(`Creator of ${userTests.length} test(s): ${userTests.map((t: { title: string }) => t.title).join(', ')}`);
        }

        const userQuestions = await Question.countDocuments({ createdBy: id });
        if (userQuestions > 0) {
            dependencies.push(`Creator of ${userQuestions} question(s)`);
        }

        const userSubmissions = await Submission.countDocuments({ student: id });
        if (userSubmissions > 0) {
            dependencies.push(`Has ${userSubmissions} submission(s)`);
        }

        if (dependencies.length > 0) {
            return Response.json({
                message: 'Cannot delete user due to existing dependencies',
                dependencies
            }, { status: 409 });
        }

        await User.findByIdAndDelete(id);
        return Response.json({ message: 'User deleted successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}
