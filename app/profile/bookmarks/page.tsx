// app/profile/bookmarks/page.tsx
import BookmarksGrid from "@/components/BookmarksGrid";
import { getAuthenticatedSession } from "@/lib/auth";
import { client } from "@/lib/sanity.client";
import { contentByIdsQuery } from "@/lib/sanity.queries";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getBookmarkedContent() {
    let session;
    try {
        // This first block specifically handles authentication.
        // If the user is not logged in, a redirect is the correct action.
        session = await getAuthenticatedSession();
    } catch (error) {
        redirect('/api/auth/signin');
    }

    try {
        // This second block handles data fetching, which should be resilient.
        // On failure, we log the error and return an empty array to the page.
        const bookmarks = await prisma.engagement.findMany({
            where: { userId: session.user.id, type: 'BOOKMARK' },
            select: { contentId: true },
            orderBy: { createdAt: 'desc' }
        });
        
        const ids = bookmarks.map(b => b.contentId);
        if (ids.length === 0) return [];
        
        const content = await client.fetch(contentByIdsQuery, { ids });
        return content;
    } catch (error) {
        console.error("Failed to fetch bookmarked content:", error);
        return []; // Gracefully return an empty array on DB/CMS error.
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