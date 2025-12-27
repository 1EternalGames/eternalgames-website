// components/GameLink.tsx
import React from 'react';
import styles from './GameLink.module.css';
// IMPORT KineticLink
import KineticLink from '@/components/kinetic/KineticLink';

type GameLinkProps = {
    gameName?: string | null;
    gameSlug?: string | null;
    className?: string;
};

const GameLink = ({ gameName, gameSlug, className = '' }: GameLinkProps) => {
    if (!gameName || !gameSlug) {
        return null;
    }
    
    const finalClassName = `${styles.kineticGameTag} ${className} no-underline`;

    // Use KineticLink with type="games"
    return (
        <KineticLink 
            href={`/games/${gameSlug}`} 
            slug={gameSlug}
            type="games" // <--- SUPPORTED
            className={finalClassName} 
        >
            <span>{gameName}</span>
            <span className={styles.gameTagArrow}>→</span>
        </KineticLink>
    );
};

export default GameLink;