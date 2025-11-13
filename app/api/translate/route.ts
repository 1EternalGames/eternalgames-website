// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { translateTitleToAction } from '@/app/studio/actions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRoles = (session?.user as any)?.roles || [];

    const isAuthorized = userRoles.some((role: string) =>
      ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
    );

    if (!session || !isAuthorized) {
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