// app/api/blob/upload/route.ts

import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma'; // <-- THE FIX: Import prisma

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

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'غير مُصرَّح به' }, { status: 401 });
    }

    // THE DEFINITIVE FIX: Fetch fresh roles from DB
    const user = await prisma.user.findUnique({ 
        where: { id: session.user.id },
        select: { roles: { select: { name: true } } }
    });
    const userRoles = user?.roles.map((r: any) => r.name) || [];

    const isCreatorOrAdmin = userRoles.some((role: string) =>
      ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
    );

    if (!isCreatorOrAdmin) {
      return NextResponse.json(
        { error: 'غير مُصرَّح به' },
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


