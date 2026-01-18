import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Test from '@/models/Test.model';
import Group from '@/models/Group.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

// GET /api/tests - Get all tests
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        let tests;
        const basePopulate = [
            { path: 'subject', select: 'name' },
            { path: 'createdBy', select: 'name email' },
            { path: 'questions.question', populate: { path: 'subject', select: 'name' } },
            { path: 'assignedGroups', select: 'name students' }
        ];

        // For students, we select all needed fields including attempts
        const studentSelect = 'title subject description duration totalMarks questions sections assignedTo assignedGroups scheduledDate deadline isPublished resultsPublished showResultsImmediately attempts showCorrectAnswers createdAt';

        if (auth.role === UserRole.STUDENT) {
            // Get groups the student is in
            const studentGroups = await Group.find({ students: auth.userId }).select('_id');
            const groupIds = studentGroups.map(g => g._id);

            tests = await Test.find({
                isPublished: true,
                $or: [
                    { assignedTo: auth.userId },
                    { assignedGroups: { $in: groupIds } }
                ]
            })
                .populate(basePopulate)
                .sort({ createdAt: -1 });
        } else if (auth.role === UserRole.TEACHER) {
            // Teachers see their own tests and tests for their subjects
            const teacherGroups = await Group.find({ teachers: auth.userId }).distinct('subject');

            tests = await Test.find({
                $or: [
                    { createdBy: auth.userId },
                    { subject: { $in: teacherGroups } }
                ]
            })
                .populate(basePopulate)
                .sort({ createdAt: -1 });
        } else {
            // Admin sees all
            tests = await Test.find()
                .populate(basePopulate)
                .sort({ createdAt: -1 });
        }

        return Response.json({ tests });
    } catch (error: unknown) {
        console.error('Get tests error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// POST /api/tests - Create new test
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

        const body = await request.json();
        const {
            title,
            subject,
            description,
            duration,
            questions,
            sections,
            assignedTo,
            assignedGroups,
            scheduledDate,
            deadline,
            attempts,
            showCorrectAnswers,
            showResultsImmediately
        } = body;

        // Calculate total marks
        const totalMarks = questions?.reduce((sum: number, q: { marks: number }) => sum + (q.marks || 0), 0) || 0;

        const test = new Test({
            title,
            subject,
            description,
            duration,
            totalMarks,
            questions: questions || [],
            sections: sections || [],
            createdBy: auth.userId,
            assignedTo: assignedTo || [],
            assignedGroups: assignedGroups || [],
            scheduledDate,
            deadline,
            attempts: attempts || 1,
            showCorrectAnswers: showCorrectAnswers || false,
            showResultsImmediately: showResultsImmediately || false,
            isPublished: false,
            resultsPublished: false
        });

        await test.save();

        const populatedTest = await Test.findById(test._id)
            .populate('subject', 'name')
            .populate('createdBy', 'name email')
            .populate('questions.question');

        return Response.json({ message: 'Test created successfully', test: populatedTest }, { status: 201 });
    } catch (error: unknown) {
        console.error('Create test error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
