// components/ContentBlock.tsx
import React from 'react';
import styles from './ContentBlock.module.css'; // <-- IMPORT MODULE

interface ContentBlockProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const ContentBlock: React.FC<ContentBlockProps> = ({
    title,
    children,
    className = '',
}) => {
    return (
        <div className={`${styles.contentBlock} ${className}`}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.body}>
                {children}
            </div>
        </div>
    );
};





