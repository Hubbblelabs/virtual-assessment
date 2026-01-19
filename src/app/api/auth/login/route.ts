import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/models/User.model';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const { email, password } = await request.json();

        if (!email || !password) {
            return Response.json({ message: 'Email and password are required' }, { status: 400 });
        }

        // Find user
        const user = await User.findOne({ email });

        // Debug logging


        if (!user) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check if password field exists
        const userObj = user.toObject ? user.toObject() : user;
        if (!userObj.password) {
            console.error('User found but password field is missing. User data:', JSON.stringify(userObj, null, 2));
            return Response.json({ message: 'Account configuration error' }, { status: 500 });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, userObj.password);
        if (!isValidPassword) {
            return Response.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        return Response.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ message: 'Server error' }, { status: 500 });
    }
}

