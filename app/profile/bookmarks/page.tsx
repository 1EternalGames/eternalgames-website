// app/profile/bookmarks/page.tsx
import BookmarksGrid from "@/components/BookmarksGrid";
import { getAuthenticatedSession } from "@/lib/auth";
import { client } from "@/lib/sanity.client";
import { contentByIdsQuery } from "@/lib/sanity.queries";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { enrichContentList } from "@/lib/enrichment"; // <-- ADDED

async function getBookmarkedContent() {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch (error) {
        redirect('/api/auth/signin');
    }

    try {
        const bookmarks = await prisma.engagement.findMany({
            where: { userId: session.user.id, type: 'BOOKMARK' },
            select: { contentId: true },
            orderBy: { createdAt: 'desc' }
        });
        
        const ids = bookmarks.map((b: any) => b.contentId);
        if (ids.length === 0) return [];
        
        const contentRaw = await client.fetch(contentByIdsQuery, { ids });
        // THE FIX: Enrich data server-side before returning
        const content = await enrichContentList(contentRaw);
        
        return content;
    } catch (error) {
        console.error("Failed to fetch bookmarked content:", error);
        return []; 
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