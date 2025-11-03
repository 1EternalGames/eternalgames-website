// app/profile/bookmarks/page.tsx
import BookmarksGrid from "@/components/BookmarksGrid";
import { getAuthenticatedSession } from "@/lib/auth";
import { client } from "@/lib/sanity.client";
import { contentByIdsQuery } from "@/lib/sanity.queries";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getBookmarkedContent() {
    try {
        const session = await getAuthenticatedSession();

        // THE FIX: Query the 'engagement' table and filter by type 'BOOKMARK'
        const bookmarks = await prisma.engagement.findMany({
            where: { userId: session.user.id, type: 'BOOKMARK' },
            select: { contentId: true, contentType: true },
            orderBy: { createdAt: 'desc' }
        });
        
        const ids = bookmarks.map(b => b.contentId);
        if (ids.length === 0) return [];
        
        const content = await client.fetch(contentByIdsQuery, { ids });
        return content;
    } catch (error) {
        // This catch block is what was causing the redirect.
        redirect('/');
    }
}

export default async function BookmarksPage() {
    const bookmarkedItems = await getBookmarkedContent();

    return (
        <div className="container page-container">
            <h1 className="page-title">محفوظاتك</h1>
            <BookmarksGrid initialItems={bookmarkedItems} />
        </div>
    );
}





