import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Group from '@/models/Group.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';
import '@/models/Subject.model'; // Ensure Subject model is registered
import '@/models/User.model';    // Ensure User model is registered

// GET /api/groups - Get all groups
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }
        if (auth.role !== UserRole.ADMIN && auth.role !== UserRole.TEACHER) {
            return createForbiddenResponse();
        }

        await connectDB();

        let groups;
        if (auth.role === UserRole.ADMIN) {
            groups = await Group.find()
                .populate('subject', 'name')
                .populate('students', 'name email')
                .populate('teachers', 'name email')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        } else {
            // Teachers see only groups they're assigned to
            groups = await Group.find({ teachers: auth.userId })
                .populate('subject', 'name')
                .populate('students', 'name email')
                .populate('teachers', 'name email')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 });
        }

        return Response.json({ groups });
    } catch (error: unknown) {
        console.error('Get groups error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }
        if (auth.role !== UserRole.ADMIN && auth.role !== UserRole.TEACHER) {
            return createForbiddenResponse();
        }

        await connectDB();

        const { name, description, subject, students, teachers } = await request.json();

        const group = new Group({
            name,
            description,
            subject,
            students: students || [],
            teachers: teachers || [auth.userId],
            createdBy: auth.userId
        });

        await group.save();

        const populatedGroup = await Group.findById(group._id)
            .populate('subject', 'name')
            .populate('students', 'name email')
            .populate('teachers', 'name email')
            .populate('createdBy', 'name email');

        return Response.json({ message: 'Group created successfully', group: populatedGroup }, { status: 201 });
    } catch (error: unknown) {
        console.error('Create group error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
