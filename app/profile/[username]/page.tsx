// app/profile/[username]/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getBadgesForUser } from '@/lib/badges';
import Link from 'next/link';
import styles from '../ProfilePage.module.css';
import { client } from '@/lib/sanity.client';
import { groq } from 'next-sanity';

function hasCreatorRole(userRoles: string[]): boolean {
    return userRoles.some(role => ['REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role));
}

export default async function PublicProfilePage({ params: paramsPromise }: { params: Promise<{ username: string }> }) {
    const { username: encodedUsername } = await paramsPromise;
    const username = decodeURIComponent(encodedUsername);

    const user = await prisma.user.findUnique({
        where: { username: username },
        include: {
            roles: { select: { name: true } },
            _count: { select: { comments: true } },
            comments: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
    });

    if (!user) { notFound(); }
    
    let contentData: { slug: string, title: string, _type: string }[] = [];
    
    const commentSlugs = user.comments.map((c: any) => c.contentSlug);
    
    if (commentSlugs.length > 0) {
        contentData = await client.fetch(
            groq`*[_type in ["review", "article", "news"] && slug.current in $slugs]{ "slug": slug.current, title, _type }`,
            { slugs: commentSlugs }
        );
    }
    
    const contentMap = new Map(contentData.map(item => [item.slug, { title: item.title, type: item._type }]));

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const joinDate = new Date(user.createdAt);
    const year = joinDate.getFullYear();
    const monthIndex = joinDate.getMonth();
    const formattedJoinDate = `${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]} ${year}`;


    const userRoles = user.roles.map((r: any) => r.name);
    const earnedBadges = getBadgesForUser({ createdAt: user.createdAt, _count: user._count, roles: userRoles });
    const avatarSrc = user.image || '/default-avatar.svg';

    return (
        <div className="container page-container">
            <div className={styles.profileGrid}>
                <aside className={styles.profileSidebar}>
                    <Image src={avatarSrc} alt={user.name || 'صورة المستخدم'} width={150} height={150} className={styles.profileAvatar} priority />
                    <h1 className={styles.profileName}>{user.name}</h1>
                    {user.username && <p className={styles.profileMeta} style={{color: 'var(--accent)'}}>@{user.username}</p>}
                    <p className={styles.profileMeta}>عضوٌ منذ {formattedJoinDate}</p>
                    
                    {user.username && hasCreatorRole(userRoles) && (
                         <Link 
                            href={`/creators/${user.username}`} 
                            className="primary-button" 
                            style={{marginTop: '2rem', display: 'block', textAlign: 'center'}}
                            prefetch={false} // FIX: Disable prefetch here as well
                        >
                            عرض كل الأعمال
                        </Link>
                    )}
                </aside>

                <main className={styles.profileMain}>
                    {user.bio && ( <section className={styles.profileSection}> <h2 className={styles.profileSectionTitle}>عن</h2> <p style={{ fontSize: '1.8rem', lineHeight: 1.7 }}>{user.bio}</p> </section> )}
                    {earnedBadges.length > 0 && ( <section className={styles.profileSection}> <h2 className={styles.profileSectionTitle}>الأوسمة</h2> <div className={styles.badgeGrid}> {earnedBadges.map(badge => ( <div key={badge.id} title={badge.description} className={styles.badgeItem}> <badge.Icon className={`${styles.badgeIcon} ${styles[`badgeIcon${badge.id}`]}`} /> <span>{badge.name}</span> </div> ))} </div> </section> )}
                    <section className={styles.profileSection}>
                        <h2 className={styles.profileSectionTitle}>آخرُ نشاط</h2>
                        {user.comments.length > 0 ? (
                            <ul style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                                {user.comments.map((comment: any) => {
                                    const contentInfo = contentMap.get(comment.contentSlug);
                                    const contentTitle = contentInfo?.title || 'تعليقٌ لم يعد متاحًا';
                                    
                                    let pathSection = 'news';
                                    if (contentInfo) {
                                        if (contentInfo.type === 'review') pathSection = 'reviews';
                                        else if (contentInfo.type === 'article') pathSection = 'articles';
                                        else if (contentInfo.type === 'news') pathSection = 'news';
                                    } else {
                                        if (comment.contentSlug.startsWith('review-')) pathSection = 'reviews';
                                        else if (comment.contentSlug.startsWith('article-')) pathSection = 'articles';
                                    }

                                    const linkHref = `/${pathSection}/${comment.contentSlug}`;

                                    return (
                                        <li key={comment.id}>
                                            <p style={{margin: '0 0 0.5rem 0'}}>
                                                علّق على 
                                                {/* FIX: Disable prefetch on content links in history */}
                                                <Link href={linkHref} className="creator-credit-link" prefetch={false}>
                                                    {contentTitle}
                                                </Link>
                                            </p>
                                            <blockquote style={{margin: 0, padding: '1rem', background: 'var(--bg-secondary)', borderRight: '3px solid var(--border-color)', borderLeft: 'none', borderRadius: '4px'}}>
                                                &quot;{comment.content.slice(0, 150)}{comment.content.length > 150 ? '...' : ''}&quot;
                                            </blockquote>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : ( <p>{user.name} لم يخطَّ تعليقًا بعد.</p> )}
                    </section>
                </main>
            </div>
        </div>
    );
}