import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Subject from '@/models/Subject.model';
import Group from '@/models/Group.model';
import Question from '@/models/Question.model';
import Test from '@/models/Test.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/subjects/[id] - Get subject by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const subject = await Subject.findById(id);
        if (!subject) {
            return Response.json({ message: 'Subject not found' }, { status: 404 });
        }

        return Response.json(subject);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}

// PUT /api/subjects/[id] - Update subject (Admin only)
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
        const { name, chapters } = await request.json();

        if (name) {
            const existingSubject = await Subject.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });
            if (existingSubject) {
                return Response.json({ message: 'Subject with this name already exists' }, { status: 400 });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name.trim();
        if (chapters !== undefined) updateData.chapters = chapters;

        const subject = await Subject.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!subject) {
            return Response.json({ message: 'Subject not found' }, { status: 404 });
        }

        return Response.json({ message: 'Subject updated successfully', subject });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}

// DELETE /api/subjects/[id] - Delete subject (Admin only)
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

        const subject = await Subject.findById(id);
        if (!subject) {
            return Response.json({ message: 'Subject not found' }, { status: 404 });
        }

        // Integrity Checks
        const dependencies: string[] = [];

        const groupsWithSubject = await Group.find({ subject: id }).select('name');
        if (groupsWithSubject.length > 0) {
            dependencies.push(`Used in ${groupsWithSubject.length} group(s): ${groupsWithSubject.map((g: { name: string }) => g.name).join(', ')}`);
        }

        const questionsWithSubject = await Question.countDocuments({ subject: id });
        if (questionsWithSubject > 0) {
            dependencies.push(`Used in ${questionsWithSubject} question(s)`);
        }

        const testsWithSubject = await Test.find({ subject: id }).select('title');
        if (testsWithSubject.length > 0) {
            dependencies.push(`Used in ${testsWithSubject.length} test(s): ${testsWithSubject.map((t: { title: string }) => t.title).join(', ')}`);
        }

        if (dependencies.length > 0) {
            return Response.json({
                message: 'Cannot delete subject due to existing dependencies',
                dependencies
            }, { status: 409 });
        }

        await Subject.findByIdAndDelete(id);
        return Response.json({ message: 'Subject deleted successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}
