// scripts/list-ga-access.ts
// Run with: npx tsx scripts/list-ga-access.ts

import 'dotenv/config';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';

async function listAccessibleProperties() {
  console.log('\n🕵️  Scanning Google Analytics Access...\n');

  const email = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    console.error('❌ Missing GA_CLIENT_EMAIL or GA_PRIVATE_KEY in .env');
    return;
  }

  const client = new AnalyticsAdminServiceClient({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
  });

  try {
    console.log(`🔑 Authenticated as: ${email}`);
    console.log('📡 Fetching accessible Account Summaries...\n');

    const [summaries] = await client.listAccountSummaries();

    if (summaries.length === 0) {
      console.log('⚠️  RESULT: This email has NO access to any Google Analytics accounts.');
      console.log('   Please go to GA Admin > Property Access Management and add the email again.');
      return;
    }

    console.log('✅ FOUND ACCESS TO THE FOLLOWING:\n');

    let foundTarget = false;
    const targetId = process.env.GA_PROPERTY_ID;

    for (const account of summaries) {
      console.log(`📁 Account: ${account.displayName} (${account.name})`);
      
      if (account.propertySummaries) {
        for (const prop of account.propertySummaries) {
           const propId = prop.property?.split('/')[1];
           const isMatch = propId === targetId;
           
           if (isMatch) foundTarget = true;

           console.log(`   └─ 📊 Property: "${prop.displayName}"`);
           console.log(`        ID: ${propId} ${isMatch ? '✅ (MATCHES .ENV)' : ''}`);
        }
      }
      console.log('');
    }

    if (!foundTarget) {
      console.log('❌ PROBLEM FOUND: The Service Account CANNOT see the Property ID in your .env file.');
      console.log(`   .env ID: ${targetId}`);
      console.log('   Please update your .env file with one of the valid IDs listed above.');
    } else {
      console.log('✅ Configuration looks correct. If site still fails, check for typos in .env variables.');
    }

  } catch (error: any) {
    if (error.message?.includes('Google Analytics Admin API has not been used')) {
      // Extract the project ID from the error message or use a generic link
      const projectIdMatch = error.message.match(/project (\d+) before/);
      const projectId = projectIdMatch ? projectIdMatch[1] : '';
      
      console.error('\n🚫 BLOCKED: The "Google Analytics Admin API" is disabled in your Cloud Project.');
      console.error('   This script needs it to list your properties to help you debug.');
      console.log('\n👉 ENABLE IT HERE:');
      console.log(`   https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview?project=${projectId}`);
      console.log('\n   (Click the blue "ENABLE" button, wait 30 seconds, and run this script again)');
    } else {
      console.error('❌ API Error:', error.message);
    }
  }
}

listAccessibleProperties();