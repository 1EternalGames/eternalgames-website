// components/GameLink.tsx
import Link from 'next/link';
import React from 'react';
import styles from './GameLink.module.css';

type GameLinkProps = {
    gameName?: string | null; // <-- Make gameName optional to prevent errors
    className?: string;
};

const GameLink = ({ gameName, className = '' }: GameLinkProps) => {
    // --- DEFINITIVE FIX IS HERE: Part 1 ---
    // Safely handle cases where gameName might be null or undefined.
    if (!gameName) {
        return null;
    }
    const slug = gameName.replace(/\s+/g, '-').toLowerCase();

    // --- DEFINITIVE FIX IS HERE: Part 2 ---
    // Correctly combine the default module class with any passed className.
    // The default style from the module will always be applied.
    const finalClassName = `${styles.kineticGameTag} ${className} no-underline`;

    return (
        <Link href={`/games/${slug}`} className={finalClassName}>
            <span>{gameName}</span>
            <span className={styles.gameTagArrow}>→</span>
        </Link>
    );
};

export default GameLink;





