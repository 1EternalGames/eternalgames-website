// lib/badges.tsx
import React from 'react';

export type BadgeId = 'DIRECTOR' | 'REVIEWER' | 'AUTHOR' | 'REPORTER' | 'DESIGNER' | 'FOUNDER' | 'FIRST_COMMENT' | 'ENGAGED_COMMENTER' | 'TOP_CONTRIBUTOR';

export interface Badge {
    id: BadgeId;
    name: string;
    description: string;
    Icon: (props: { className?: string }) => React.JSX.Element;
}

const DirectorIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/></svg>;
const ReviewerIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5.17 11.17l-2.83-2.83-2.83 2.83-1.17-1.17 2.83-2.83-2.83-2.83 1.17-1.17 2.83 2.83 2.83-2.83 1.17 1.17-2.83 2.83 2.83 2.83-1.17 1.17z"/></svg>;
const AuthorIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>;
const ReporterIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>;
const DesignerIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-11.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-2.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>;

const FounderIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>;
const FirstCommentIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 12H5v-2h14v2zm0-3H5V9h14v2zm0-3H5V6h14v2z"/></svg>;
const EngagedCommenterIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>;
const TopContributorIcon = ({ className = '' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5.5 9h11zM12 21.8l-5.5-9h11z"/></svg>;

export const BADGES: Record<BadgeId, Badge> = {
    DIRECTOR: { id: 'DIRECTOR', name: 'مدير', description: 'يشرف على مشروع EternalGames.', Icon: DirectorIcon },
    REVIEWER: { id: 'REVIEWER', name: 'مُراجع', description: 'صوت موثوق لمراجعات الألعاب.', Icon: ReviewerIcon },
    AUTHOR: { id: 'AUTHOR', name: 'كاتب', description: 'يخطُّ المقالات والمواضيع.', Icon: AuthorIcon },
    REPORTER: { id: 'REPORTER', name: 'مراسل', description: 'يقتفي أثر أخبار الصناعة.', Icon: ReporterIcon },
    DESIGNER: { id: 'DESIGNER', name: 'مصمم', description: 'يضفي رونقًا على المحتوى.', Icon: DesignerIcon },
    FOUNDER: { id: 'FOUNDER', name: 'مؤسس', description: 'التحق بركب EternalGames في شهره الأول.', Icon: FounderIcon },
    FIRST_COMMENT: { id: 'FIRST_COMMENT', name: 'مبادر', description: 'خطَّ أول تعليقٍ له.', Icon: FirstCommentIcon },
    ENGAGED_COMMENTER: { id: 'ENGAGED_COMMENTER', name: 'مساهم', description: 'جاوزت تعليقاته العشرة.', Icon: EngagedCommenterIcon },
    TOP_CONTRIBUTOR: { id: 'TOP_CONTRIBUTOR', name: 'عمود المجتمع', description: 'جاوز الخمسين تعليقًا.', Icon: TopContributorIcon },
};

export function getBadgesForUser(user: { createdAt: Date; _count: { comments: number }, roles: string[] }): Badge[] {
    const earnedBadges: Badge[] = [];
    const roles = new Set(user.roles);

    if (roles.has('DIRECTOR')) earnedBadges.push(BADGES.DIRECTOR);
    if (roles.has('REVIEWER')) earnedBadges.push(BADGES.REVIEWER);
    if (roles.has('AUTHOR')) earnedBadges.push(BADGES.AUTHOR);
    if (roles.has('REPORTER')) earnedBadges.push(BADGES.REPORTER);
    if (roles.has('DESIGNER')) earnedBadges.push(BADGES.DESIGNER);

    const founderCutoffDate = new Date('2025-11-01');
    if (user.createdAt < founderCutoffDate) {
        earnedBadges.push(BADGES.FOUNDER);
    }

    const commentCount = user._count.comments;
    if (commentCount >= 50) earnedBadges.push(BADGES.TOP_CONTRIBUTOR);
    else if (commentCount >= 10) earnedBadges.push(BADGES.ENGAGED_COMMENTER);
    else if (commentCount >= 1) earnedBadges.push(BADGES.FIRST_COMMENT);

    return earnedBadges;
}


