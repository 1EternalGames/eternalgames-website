import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { filename, contentType } = body;

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: 'Filename and contentType are required' },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    const userRoles = (session?.user as any)?.roles || [];
    const isCreatorOrAdmin = userRoles.some((role: string) =>
      ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
    );

    if (!session || !isCreatorOrAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const blob = await put(filename, Buffer.from(''), {
      access: 'public',
      contentType,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error creating blob:', error);
    return NextResponse.json(
      { error: 'Failed to create blob' },
      { status: 500 }
    );
  }
}


