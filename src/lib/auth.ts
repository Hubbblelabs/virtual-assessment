import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserRole } from '@/models/User.model';

export interface AuthUser {
    userId: string;
    role: UserRole;
}

export function verifyToken(token: string): AuthUser | null {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not defined in environment variables');
        return null;
    }
    try {
        const decoded = jwt.verify(token, secret) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}

export function getAuthFromRequest(request: NextRequest): AuthUser | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    return verifyToken(token);
}

export function requireAuth(request: NextRequest): AuthUser {
    const user = getAuthFromRequest(request);
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}

export function requireRole(request: NextRequest, ...roles: UserRole[]): AuthUser {
    const user = requireAuth(request);
    if (!roles.includes(user.role)) {
        throw new Error('Access denied');
    }
    return user;
}

export function createUnauthorizedResponse(message: string = 'Authentication required') {
    return Response.json({ message }, { status: 401 });
}

export function createForbiddenResponse(message: string = 'Access denied') {
    return Response.json({ message }, { status: 403 });
}
