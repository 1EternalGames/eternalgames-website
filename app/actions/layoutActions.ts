// app/actions/layoutActions.ts
'use server';

import { fetchUniversalData } from '@/lib/universal-data';

// This action is now just a wrapper for the shared logic,
// used primarily by the Homepage for Server-Side Rendering (SSG).
export async function getUniversalBaseData() {
    return await fetchUniversalData();
}