// hooks/useEngagementScores.ts

'use client';

import { useState, useEffect } from 'react';

type EngagementScore = { id: number; engagementScore: number };

/**
 * Fetches and maintains viral engagement scores (likes + shares) for content.
 * Returns an array of { id: legacyId, engagementScore: number }.
 */
export const useEngagementScores = () => {
    const [scores, setScores] = useState<EngagementScore[]>([]);
    
    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch('/api/news-engagement');
                const data = await res.json();
                if (data.error) {
                    console.error("Engagement fetch error:", data.error);
                } else {
                    setScores(data);
                }
            } catch (e) {
                console.error("Engagement fetch failed", e);
            }
        };
        
        fetchScores();
        const intervalId = setInterval(fetchScores, 60000); 
        return () => clearInterval(intervalId);

    }, []);
    return scores;
}


