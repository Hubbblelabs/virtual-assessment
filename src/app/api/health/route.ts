import { NextRequest } from 'next/server';

// GET /api/health - Health check
export async function GET(_request: NextRequest) {
    return Response.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
}
