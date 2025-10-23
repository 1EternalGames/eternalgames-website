'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';

// A placeholder to prevent layout shift while the component loads.
const CommentsPlaceholder = () => (
<div style={{ minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<div className="spinner" />
</div>
);

// Dynamically import the interactive CommentList component.
const CommentList = dynamic(() => import('./CommentList'), {
loading: () => <CommentsPlaceholder />,
ssr: false // This is a purely client-side interactive component.
});

export default function LazyCommentSection({ comments, session, slug }: { comments: any[]; session: Session | null, slug: string }) {
const [isIntersecting, setIntersecting] = useState(false);
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
if (!ref.current) return;
const observer = new IntersectionObserver(
([entry]) => {
// Trigger when the placeholder is 250px from the viewport edge
if (entry.isIntersecting) {
setIntersecting(true);
observer.unobserve(entry.target);
}
},
{ rootMargin: "250px" }
);
observer.observe(ref.current);
return () => observer.disconnect();
}, []);

// Render a static placeholder div until it's time to load the interactive component.
return (
<div ref={ref} style={{ minHeight: '250px' }}>
{isIntersecting ? <CommentList comments={comments} session={session} slug={slug} /> : null}
</div>
);
}



























