// This is a standalone script to be executed with tsx or ts-node.
// It loads environment variables from the root .env file.
import 'dotenv/config';
import { createClient } from '@sanity/client';

// --- Script Configuration ---
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = '2025-09-28';
const DOC_TYPES = ['review', 'article', 'news', 'gameRelease'];

// --- Validation ---
if (!projectId || !dataset || !token) {
  console.error('Error: Missing SANITY_PROJECT_ID, SANITY_DATASET, or SANITY_API_WRITE_TOKEN in your root .env file.');
  process.exit(1);
}

// --- Create a dedicated, authenticated Sanity client for this script ---
const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion,
  useCdn: false, // Always use fresh data for a script
});

async function backfillLegacyIds() {
  console.log('Starting comprehensive backfill process for legacyIds...');

  // 1. Fetch ALL documents of the relevant types to identify duplicates and find the max ID.
  const query = `*[_type in $types] {_id, _type, title, legacyId}`;
  const allDocs = await client.fetch<{ _id: string, _type: string, title: string, legacyId: number | null }[]>(query, { types: DOC_TYPES });

  if (allDocs.length === 0) {
    console.log('No documents found to process.');
    return;
  }

  // 2. Find the true highest legacyId and identify all documents that need patching.
  const seenIds = new Set<number>();
  const docsToPatch: { _id: string, _type: string, title: string }[] = [];
  let maxId = 0;

  for (const doc of allDocs) {
    if (doc.legacyId !== null && doc.legacyId !== undefined) {
      if (seenIds.has(doc.legacyId)) {
        // This is a duplicate ID, mark for patching.
        docsToPatch.push(doc);
      } else {
        // This is the first time we've seen this ID, it's valid for now.
        seenIds.add(doc.legacyId);
        if (doc.legacyId > maxId) {
          maxId = doc.legacyId;
        }
      }
    } else {
      // The ID is missing entirely, mark for patching.
      docsToPatch.push(doc);
    }
  }

  if (docsToPatch.length === 0) {
    console.log('All documents have unique legacyIds. No action needed.');
    return;
  }

  console.log(`Current highest unique legacyId found: ${maxId}`);
  console.log(`Found ${docsToPatch.length} documents with missing or duplicate legacyIds. Starting patching process...`);

  // 3. Create a transaction to patch all corrupt documents.
  let currentIdCounter = maxId;
  const transaction = client.transaction();

  docsToPatch.forEach(doc => {
    currentIdCounter++;
    console.log(`  - Assigning NEW legacyId: ${currentIdCounter} to document [${doc._type}] "${doc.title}" (${doc._id})`);
    transaction.patch(doc._id, { set: { legacyId: currentIdCounter } });
  });

  // 4. Commit the transaction.
  try {
    const result = await transaction.commit();
    console.log(`Successfully patched ${result.results.length} documents.`);
    console.log('Backfill complete. Your data is now consistent.');
  } catch (error) {
    console.error('An error occurred while committing the transaction:', error);
    console.error('No documents were حُدِّثت. Please try again or check your Sanity token permissions.');
  }
}

// Execute the function
backfillLegacyIds();