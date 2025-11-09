// app/studio/director/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { UserManagementClient } from './UserManagementClient';
import { unstable_noStore as noStore } from 'next/cache';

export default async function DirectorPage() {
    noStore(); // Ensure data is always fresh

    const session = await getServerSession(authOptions);

    // Secure the route: only allow users with the 'DIRECTOR' role
    if (!session?.user?.roles.includes('DIRECTOR')) {
        redirect('/studio');
    }

    // Fetch all users and all available roles from the database
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
                <h1 className="page-title">الإدارة</h1>
                <p className="sidebar-subtitle" style={{ fontSize: '1.8rem', maxWidth: '600px', margin: '0 auto' }}>عيّن وأدِر الأدوار. تسري التغييرات بعد إعادة تسجيل الدخول.</p>
            </header>
            <UserManagementClient initialUsers={users} allRoles={allRoles} />
        </div>
    );
}


