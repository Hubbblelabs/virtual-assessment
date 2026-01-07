import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User.model';
import { getAuthFromRequest, createUnauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = getAuthFromRequest(request);
        if (!auth) {
            return createUnauthorizedResponse();
        }

        await connectDB();

        const user = await User.findById(auth.userId).select('-password');
        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        return Response.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}
