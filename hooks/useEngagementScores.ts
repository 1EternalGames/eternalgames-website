// hooks/useEngagementScores.ts

'use client';

import { useState, useEffect } from 'react';
import type { EngagementScore } from '@/types';

type EngagementErrorResponse = {
    error: string;
};

type EngagementApiResponse = EngagementScore[] | EngagementErrorResponse;

function isEngagementErrorResponse(response: EngagementApiResponse): response is EngagementErrorResponse {
    return (response as EngagementErrorResponse).error !== undefined;
}

export const useEngagementScores = () => {
    const [scores, setScores] = useState<EngagementScore[]>([]);
    
    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch('/api/engagement-scores');
                if (!res.ok) return;
                const data: EngagementApiResponse = await res.json();
                
                if (!isEngagementErrorResponse(data)) {
                    setScores(data);
                }
            } catch (e) {
                console.error("Engagement fetch failed", e);
            }
        };
        
        fetchScores();
        
        // OPTIMIZATION: Increased polling to 5 minutes (300,000ms)
        // Real-time updates for likes are handled optimistically in UI,
        // we only need this for the "Viral" sorting order.
        const intervalId = setInterval(fetchScores, 300000); 
        return () => clearInterval(intervalId);

    }, []);
    return scores;
}