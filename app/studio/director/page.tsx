// app/studio/director/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { UserManagementClient } from './UserManagementClient';
import { unstable_noStore as noStore } from 'next/cache';

export default async function DirectorPage() {
    noStore(); 

    const session = await getServerSession(authOptions);
    
    let userRoles: string[] = [];
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({ 
            where: { id: session.user.id },
            select: { roles: { select: { name: true } } }
        });
        userRoles = user?.roles.map((r: any) => r.name) || [];
    }

    if (!userRoles.includes('DIRECTOR')) {
        redirect('/studio');
    }

    const users = await prisma.user.findMany({
        include: {
            roles: {
                select: { name: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const allRoles = await prisma.role.findMany();

    return (
        <div className="container page-container">
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="page-title">إدارة الديوان</h1>
                <p className="sidebar-subtitle" style={{ fontSize: '1.8rem', maxWidth: '600px', margin: '0 auto' }}>
                    تحكَّم في رُتَب الأعضاء وصلاحياتهم. التغييراتُ نافذةٌ فورًا.
                </p>
            </header>
            <UserManagementClient initialUsers={users} allRoles={allRoles} />
        </div>
    );
}