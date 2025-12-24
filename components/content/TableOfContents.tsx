// components/content/TableOfContents.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './TableOfContents.module.css';

export type TocItem = {
    id: string;
    text: string;
    level: number;
};

const ListIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

export default function TableOfContents({ headings }: { headings: TocItem[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const scrollTop = useRef(0);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop: sTop, scrollHeight, clientHeight } = scrollRef.current;
            // Check if user is near the bottom (within 2px tolerance)
            setIsAtBottom(sTop + clientHeight >= scrollHeight - 2);
        }
    };

    // Check initial scroll state (e.g. if content is short)
    useEffect(() => {
        handleScroll();
    }, [headings]);

    // --- MOUSE DRAG SCROLLING LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        isDragging.current = true;
        startY.current = e.pageY - scrollRef.current.offsetTop;
        scrollTop.current = scrollRef.current.scrollTop;
        scrollRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !scrollRef.current) return;
        e.preventDefault();
        const y = e.pageY - scrollRef.current.offsetTop;
        const walk = (y - startY.current) * 1.5; // Scroll speed multiplier
        scrollRef.current.scrollTop = scrollTop.current - walk;
    };

    if (!headings || headings.length < 2) return null;

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        // If we were dragging, don't trigger the click
        if (Math.abs(e.movementY) > 2) return; 

        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <nav className={styles.tocContainer} aria-label="Table of Contents">
            <div className={styles.tocHeader}>
                <ListIcon />
                <span>محتويات المقال</span>
            </div>
            <div 
                className={`${styles.listWrapper} ${isAtBottom ? styles.atBottom : ''}`}
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onScroll={handleScroll}
                data-lenis-prevent
            >
                <ul className={styles.tocList}>
                    {headings.map((heading, index) => (
                        <li key={`${heading.id}-${index}`} className={`${styles.tocItem} ${styles[`level-${Math.min(heading.level, 3)}`]}`}>
                            <a 
                                href={`#${heading.id}`} 
                                onClick={(e) => handleLinkClick(e, heading.id)}
                                className={styles.tocLink}
                            >
                                {heading.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}