// components/ContentBlock.tsx
import React from 'react';
import styles from './ContentBlock.module.css';

type ContentBlockProps = {
    title: string;
    children?: React.ReactNode;
    variant?: 'default' | 'fullbleed';
};

export function ContentBlock({ title, children, variant = 'default' }: ContentBlockProps) {
    const blockClasses = `${styles.contentBlock} ${variant === 'fullbleed' ? styles.variantFullbleed : ''}`;

    return (
        <section className={blockClasses}>
            <h2 className={styles.contentBlockTitle}>{title}</h2>
            {children && (
                <div className={styles.contentBlockBody}>
                    {children}
                </div>
            )}
        </section>
    );
}