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

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
    const { username: encodedUsername } = await params;
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
    
    // 1. Extract content slugs from the user's recent comments.
    const commentSlugs = user.comments.map(c => c.contentSlug);
    
    // 2. Fetch the titles for these slugs from Sanity.
    let contentTitles: { slug: string, title: string }[] = [];
    if (commentSlugs.length > 0) {
        contentTitles = await client.fetch(
            groq`*[_type in ["review", "article", "news"] && slug.current in $slugs]{ "slug": slug.current, title }`,
            { slugs: commentSlugs }
        );
    }
    
    // 3. Create a lookup map for easy access (slug -> title).
    const titleMap = new Map(contentTitles.map(item => [item.slug, item.title]));

    const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const joinDate = new Date(user.createdAt);
    const year = joinDate.getFullYear();
    const monthIndex = joinDate.getMonth();
    const formattedJoinDate = `${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]} ${year}`;


    const userRoles = user.roles.map(r => r.name);
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
                         <Link href={`/creators/${user.username}`} className="primary-button" style={{marginTop: '2rem', display: 'block', textAlign: 'center'}}>
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
                                {user.comments.map(comment => {
                                    const contentTitle = titleMap.get(comment.contentSlug) || 'تعليقٌ لم يعد متاحًا';
                                    const path = comment.contentSlug.startsWith('review-') ? 'reviews' : comment.contentSlug.startsWith('article-') ? 'articles' : 'news';
                                    const linkHref = `/${path}/${comment.contentSlug}`;

                                    return (
                                        <li key={comment.id}>
                                            <p style={{margin: '0 0 0.5rem 0'}}>
                                                علّق على <Link href={linkHref} className="creator-credit-link">{contentTitle}</Link>
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