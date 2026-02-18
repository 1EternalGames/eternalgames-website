// app/studio/comments/page.tsx
import { getPaginatedComments } from './actions';
import CommentsManager from './CommentsManager';
import { getAuthenticatedSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AllCommentsPage() {
    const session = await getAuthenticatedSession();
    if (!session.user.roles.includes('DIRECTOR') && !session.user.roles.includes('ADMIN')) {
        redirect('/studio');
    }

    const initialComments = await getPaginatedComments(0, 100);

    return (
        <div className="container page-container">
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 className="page-title">سجل التعليقات</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                    <Link href="/studio/analytics" className="outline-button no-underline">
                        العودة للتحليلات
                    </Link>
                </div>
            </header>
            <CommentsManager initialComments={initialComments} />
        </div>
    );
}