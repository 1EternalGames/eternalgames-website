// components/content/TableOfContents.tsx
'use client';

import React from 'react';
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
    if (!headings || headings.length < 2) return null;

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Navbar offset
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
            <ul className={styles.tocList}>
                {headings.map((heading, index) => (
                    <li key={`${heading.id}-${index}`} className={`${styles.tocItem} ${styles[`level-${Math.min(heading.level - 1, 2)}`]}`}>
                        <a 
                            href={`#${heading.id}`} 
                            onClick={(e) => handleScroll(e, heading.id)}
                            className={styles.tocLink}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}