// scripts/verify-ga.ts
// Run with: npx tsx scripts/verify-ga.ts

import 'dotenv/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

async function verifyGoogleAnalytics() {
  console.log('\n🔍 Starting Google Analytics Diagnostics...\n');

  // 1. Load Variables
  const email = process.env.GA_CLIENT_EMAIL;
  const propertyId = process.env.GA_PROPERTY_ID;
  const privateKey = process.env.GA_PRIVATE_KEY;

  // 2. Check for existence
  if (!email) { console.error('❌ Missing GA_CLIENT_EMAIL in .env'); return; }
  if (!propertyId) { console.error('❌ Missing GA_PROPERTY_ID in .env'); return; }
  if (!privateKey) { console.error('❌ Missing GA_PRIVATE_KEY in .env'); return; }

  // 3. Format Cleaning
  const cleanPropertyId = propertyId.replace(/^properties\//, '').trim();
  const cleanPrivateKey = privateKey.includes('\\n') 
    ? privateKey.replace(/\\n/g, '\n') 
    : privateKey;

  console.log(`📋 Configuration Detected:`);
  console.log(`   - Email:       ${email}`);
  console.log(`   - Property ID: ${cleanPropertyId}`);
  console.log(`   - Key Length:  ${cleanPrivateKey.length} characters`);
  
  if (!cleanPrivateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ Error: GA_PRIVATE_KEY does not look like a valid PEM key.');
      return;
  }

  // 4. Test Connection
  console.log('\n🔄 Attempting to connect to Google Analytics...');
  
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: cleanPrivateKey,
    },
  });

  try {
    const [response] = await client.runReport({
      property: `properties/${cleanPropertyId}`,
      dateRanges: [{ startDate: 'today', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 1
    });

    console.log('\n✅ SUCCESS! Connection established.');
    console.log(`   - Active Users Today: ${response.rows?.[0]?.metricValues?.[0]?.value || 0}`);
    console.log('\n👉 Your credentials are correct. If the website still fails, try restarting the dev server.');

  } catch (error: any) {
    console.error('\n❌ CONNECTION FAILED');
    console.error(`   - Code: ${error.code}`);
    console.error(`   - Message: ${error.message}`);
    
    if (error.code === 7) {
        console.log('\n💡 DIAGNOSIS: PERMISSION DENIED');
        console.log('   1. Go to Google Analytics Admin > Property Settings > Property Access Management.');
        console.log(`   2. Ensure "${email}" is added.`);
        console.log('   3. Ensure they have at least "Viewer" role.');
        console.log(`   4. Verify the Property ID in GA matches "${cleanPropertyId}".`);
    }
  }
}

verifyGoogleAnalytics();