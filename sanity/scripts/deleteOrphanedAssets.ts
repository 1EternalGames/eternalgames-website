// sanity/scripts/deleteOrphanedAssets.ts
// Run this script with: npx tsx sanity/scripts/deleteOrphanedAssets.ts

import 'dotenv/config';
import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = '2025-09-28';

if (!projectId || !dataset || !token) {
  console.error('Error: Missing Sanity environment variables.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion,
  useCdn: false,
});

async function deleteOrphanedAssets() {
  console.log('Scanning for orphaned assets...');

  // 1. Find all image assets that are NOT referenced by any document
  // count(*[references(^._id)]) == 0 checks if nothing refers to this asset ID
  const query = `*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0]._id`;
  
  const orphanedIds = await client.fetch<string[]>(query);

  if (orphanedIds.length === 0) {
    console.log('No orphaned assets found. Your Sanity is clean.');
    return;
  }

  console.log(`Found ${orphanedIds.length} orphaned assets. Deleting...`);

  // 2. Batch delete
  const transaction = client.transaction();
  orphanedIds.forEach(id => {
    transaction.delete(id);
  });

  try {
    await transaction.commit();
    console.log('Cleanup complete. Storage space reclaimed.');
  } catch (error) {
    console.error('Failed to delete assets:', error);
  }
}

deleteOrphanedAssets();