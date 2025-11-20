// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { translateTitleToAction } from '@/app/studio/actions';
import prisma from '@/lib/prisma'; // <-- THE FIX: Import prisma

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'غير مُصرَّح به.' }, { status: 401 });
    }

    // THE DEFINITIVE FIX: Fetch fresh roles from DB
    const user = await prisma.user.findUnique({ 
        where: { id: session.user.id },
        select: { roles: { select: { name: true } } }
    });
    const userRoles = user?.roles.map((r: any) => r.name) || [];

    const isAuthorized = userRoles.some((role: string) =>
      ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: 'غير مُصرَّح به.' }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'العنوان مطلوب.' }, { status: 400 });
    }

    const slug = await translateTitleToAction(title);

    return NextResponse.json({ slug });
  } catch (error) {
    console.error('API Error in /api/translate:', error);
    return NextResponse.json(
      { error: 'فشل في الترجمة.' },
      { status: 500 }
    );
  }
}