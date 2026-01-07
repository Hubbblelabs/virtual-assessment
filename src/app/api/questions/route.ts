import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Question from '@/models/Question.model';
import Group from '@/models/Group.model';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';
import { UserRole } from '@/models/User.model';

// GET /api/questions - Get all questions
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

        const { searchParams } = new URL(request.url);
        const chapter = searchParams.get('chapter');
        const topic = searchParams.get('topic');
        const difficultyLevel = searchParams.get('difficultyLevel');
        const subject = searchParams.get('subject');
        const search = searchParams.get('search');
        const marks = searchParams.get('marks');

        const filter: Record<string, unknown> = {};

        if (chapter) {
            const chapters = chapter.split(',');
            filter.chapter = { $in: chapters };
        }
        if (topic) {
            const topics = topic.split(',');
            filter.topic = { $in: topics };
        }
        if (difficultyLevel) {
            const levels = difficultyLevel.split(',');
            filter.difficultyLevel = { $in: levels };
        }
        if (subject) filter.subject = subject;

        if (marks) {
            const marksList = marks.split(',').map(m => Number(m));
            filter.marks = { $in: marksList };
        }

        if (search) {
            filter.$or = [
                { questionText: { $regex: search, $options: 'i' } }
            ];
        }

        // If user is a teacher, filter questions based on assigned subjects
        if (auth.role === UserRole.TEACHER) {
            const teacherGroups = await Group.find({
                teachers: auth.userId
            }).distinct('subject');
            filter.subject = { $in: teacherGroups };
        }

        const questions = await Question.find(filter)
            .populate('createdBy', 'name email')
            .populate('subject', 'name')
            .sort({ createdAt: -1 });

        return Response.json({ questions });
    } catch (error: unknown) {
        console.error('Get questions error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

// POST /api/questions - Create new question
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
        const question = new Question({
            ...body,
            createdBy: auth.userId
        });

        await question.save();
        return Response.json({ message: 'Question created successfully', question }, { status: 201 });
    } catch (error: unknown) {
        console.error('Create question error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
