// app/api/blob/upload/route.ts
import { handleUpload } from '@vercel/blob/client'; // <-- THE FIX IS HERE
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
          throw new Error('Not authenticated.');
        }

        const userRoles = session.user.roles || [];
        const isCreatorOrAdmin = userRoles.some(role => 
            ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
        );

        if (!isCreatorOrAdmin) {
            throw new Error('Insufficient permissions for upload.');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.pathname, JSON.parse(tokenPayload));
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}