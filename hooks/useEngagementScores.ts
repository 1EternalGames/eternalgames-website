// hooks/useEngagementScores.ts

'use client';

import { useState, useEffect } from 'react';
import type { EngagementScore } from '@/types'; // Import from global types

// Define the API error response structure
type EngagementErrorResponse = {
    error: string;
};

type EngagementApiResponse = EngagementScore[] | EngagementErrorResponse;

// Type guard to check if the response is an error object
function isEngagementErrorResponse(response: EngagementApiResponse): response is EngagementErrorResponse {
    return (response as EngagementErrorResponse).error !== undefined;
}

/**
 * Fetches and maintains viral engagement scores (likes + shares) for all content types.
 * Returns an array of { id: legacyId, engagementScore: number }.
 */
export const useEngagementScores = () => {
    const [scores, setScores] = useState<EngagementScore[]>([]);
    
    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch('/api/engagement-scores');
                const data: EngagementApiResponse = await res.json();
                
                // Use the type guard to handle the error case
                if (isEngagementErrorResponse(data)) {
                    console.error("Engagement fetch error:", data.error);
                } else {
                    // Data is guaranteed to be EngagementScore[] here
                    setScores(data);
                }
            } catch (e) {
                console.error("Engagement fetch failed", e);
            }
        };
        
        fetchScores();
        // Set up polling for real-time scores updates
        const intervalId = setInterval(fetchScores, 60000); 
        return () => clearInterval(intervalId);

    }, []);
    return scores;
}


