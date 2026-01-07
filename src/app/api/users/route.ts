import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User.model';
import { UserRole } from '@/models/User.model';
import bcrypt from 'bcryptjs';
import { getAuthFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth';

// GET /api/users - Get all users (Admin/Teacher)
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
        const role = searchParams.get('role');

        const filter: Record<string, unknown> = {};
        if (role) {
            filter.role = role;
        }

        const users = await User.find(filter).select('-password');
        return Response.json({ users });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}

// POST /api/users - Create new user (Admin only)
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

        const { name, email, password, role } = await request.json();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response.json({ message: 'User with this email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        const userResponse = user.toObject();
        delete (userResponse as Record<string, unknown>).password;

        return Response.json({ message: 'User created successfully', user: userResponse }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error';
        return Response.json({ message }, { status: 500 });
    }
}
