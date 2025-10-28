// components/GameLink.tsx
import Link from 'next/link';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameHoverCard from './GameHoverCard';
import styles from './GameLink.module.css';

type GameLinkProps = {
    gameName?: string | null;
    gameSlug?: string | null;
    className?: string;
};

const GameLink = ({ gameName, gameSlug, className = '' }: GameLinkProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [gameData, setGameData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        hoverTimeout.current = setTimeout(async () => {
            setIsHovered(true);
            if (!gameData && gameSlug) {
                setIsLoading(true);
                try {
                    const response = await fetch(`/api/game-by-slug?slug=${gameSlug}`);
                    if (response.ok) {
                        const data = await response.json();
                        setGameData(data);
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        }, 400); // 400ms delay
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovered(false);
    };

    if (!gameName || !gameSlug) {
        return null;
    }
    
    const finalClassName = `${styles.kineticGameTag} ${className} no-underline`;

    return (
        <div 
            className={styles.gameLinkContainer}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <AnimatePresence>
                {isHovered && gameData && <GameHoverCard game={gameData} />}
            </AnimatePresence>

            <Link href={`/games/${gameSlug}`} className={finalClassName}>
                <span>{gameName}</span>
                <span className={styles.gameTagArrow}>→</span>
            </Link>
        </div>
    );
};

export default GameLink;