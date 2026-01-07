import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Subject from '@/models/Subject.model';
import Group from '@/models/Group.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

// GET /api/subjects - Get all subjects
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        let subjects;

        // If user is a teacher, filter subjects based on assigned groups
        if (auth.role === UserRole.TEACHER) {
            const teacherGroups = await Group.find({
                teachers: auth.userId
            }).distinct('subject');

            subjects = await Subject.find({
                _id: { $in: teacherGroups }
            }).sort({ name: 1 });
        } else {
            subjects = await Subject.find().sort({ name: 1 });
        }

        return Response.json(subjects);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}

// POST /api/subjects - Create new subject (Admin only)
export async function POST(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }
        if (auth.role !== UserRole.ADMIN) {
            return createForbiddenResponse();
        }

        await connectDB();

        const { name, chapters } = await request.json();

        const existingSubject = await Subject.findOne({ name: name.trim() });
        if (existingSubject) {
            return Response.json({ message: 'Subject with this name already exists' }, { status: 400 });
        }

        const subject = new Subject({
            name: name.trim(),
            chapters: chapters || [],
        });

        await subject.save();
        return Response.json({ message: 'Subject created successfully', subject }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}
