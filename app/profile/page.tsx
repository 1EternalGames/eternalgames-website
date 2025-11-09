// app/profile/page.tsx
export const maxDuration = 60;
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileEditForm from '@/components/ProfileEditForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import { ContentBlock } from '@/components/ContentBlock';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { redirect('/api/auth/signin'); }
    
    // Fetch user and check if they have a password set (i.e., not an OAuth user)
    const user = await prisma.user.findUnique({ 
        where: { id: session.user.id }, 
        select: { password: true, id: true, name: true, email: true, username: true, image: true, createdAt: true, bio: true, twitterHandle: true, instagramHandle: true, age: true, country: true, agePublic: true, countryPublic: true, emailVerified: true }
    });

    if (!user) { redirect('/api/auth/signin'); }

    const hasPasswordAuth = !!user.password;

    return (
        <div className="container page-container">
            <h1 className="page-title">إعدادات الحساب</h1>
            <ContentBlock title="تحرير البيانات">
                <ProfileEditForm user={user} />
            </ContentBlock>
            
            {hasPasswordAuth && (
                <ContentBlock title="تغيير كلمة السر">
                    <PasswordChangeForm />
                </ContentBlock>
            )}
        </div>
    );
}


