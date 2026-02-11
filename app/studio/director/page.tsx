// app/studio/director/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { UserManagementClient } from './UserManagementClient';
import { searchUsersAction } from './actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DirectorPage() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) redirect('/api/auth/signin');
    
    // Explicit DB check for roles to be safe
    const user = await prisma.user.findUnique({ 
        where: { id: session.user.id },
        select: { roles: { select: { name: true } } }
    });
    
    const userRoles = user?.roles.map((r: any) => r.name) || [];
    if (!userRoles.includes('DIRECTOR')) {
        redirect('/studio');
    }

    // Initial fetch (first 100)
    const initialUsers = await searchUsersAction('', 0, 100);
    const allRoles = await prisma.role.findMany();

    return (
        <div className="container page-container">
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 className="page-title">إدارة الديوان</h1>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
                    <Link href="/studio" className="outline-button no-underline">
                        العودة للأستوديو
                    </Link>
                    <Link href="/studio/analytics" className="primary-button no-underline" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                        التحليلات الشاملة
                    </Link>
                </div>
            </header>
            <UserManagementClient initialUsers={initialUsers as any} allRoles={allRoles} />
        </div>
    );
}