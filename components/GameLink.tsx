// components/GameLink.tsx
import Link from 'next/link';
import React from 'react';
import styles from './GameLink.module.css';

type GameLinkProps = {
    gameName?: string | null;
    gameSlug?: string | null; // Expect the slug to be passed in
    className?: string;
};

const GameLink = ({ gameName, gameSlug, className = '' }: GameLinkProps) => {
    if (!gameName || !gameSlug) {
        return null;
    }
    
    const finalClassName = `${styles.kineticGameTag} ${className} no-underline`;

    return (
        <Link href={`/games/${gameSlug}`} className={finalClassName}>
            <span>{gameName}</span>
            <span className={styles.gameTagArrow}>→</span>
        </Link>
    );
};

export default GameLink;