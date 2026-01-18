import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { message: 'No file uploaded' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const relativeUploadDir = `/uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}`;
        const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            console.error('Error creating upload directory', e);
        }

        // Generate unique filename
        const uniqueSuffix = `${crypto.randomUUID()}-${Date.now()}`;
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const filepath = join(uploadDir, filename);
        const fileUrl = `${relativeUploadDir}/${filename}`;

        await writeFile(filepath, buffer);

        return NextResponse.json({
            message: 'File uploaded successfully',
            fileUrl: fileUrl,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { message: 'Error uploading file' },
            { status: 500 }
        );
    }
}
