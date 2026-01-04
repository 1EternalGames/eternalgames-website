import 'dotenv/config';

const url = process.env.DATABASE_URL;
const sanityId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const siteName = process.env.NEXT_PUBLIC_SITE_NAME;

if (!url) {
    console.error("❌ NO DATABASE_URL FOUND in .env!");
    process.exit(1);
}

try {
    const dbUrl = new URL(url);
    
    console.log("\n🛑 CRITICAL SAFETY CHECK 🛑\n");
    console.log(`You are currently configured to affect the following environments:\n`);
    
    console.log(`--- [ DATABASE CONNECTION IDENTIFIERS ] ---`);
    console.log(`HOST:          ${dbUrl.hostname}`);
    console.log(`DATABASE NAME: ${dbUrl.pathname.replace('/', '')}`);
    
    // THIS IS THE IMPORTANT PART FOR UNIQUENESS
    console.log(`UNIQUE ID:     ${dbUrl.username.substring(0, 15)}... (Compare this!)`); 
    
    console.log(`\n--- [ SANITY CMS ] ---`);
    console.log(`PROJECT ID:    ${sanityId}`);
    
    console.log(`\n--- [ SITE CONFIG ] ---`);
    console.log(`SITE NAME:     ${siteName}`);
    
    console.log(`\n------------------------------------------------`);
    console.log("👉 HOW TO VERIFY:");
    console.log("1. Open the .env file of your PREVIOUS/OLD website.");
    console.log("2. Look at the long string inside DATABASE_URL.");
    console.log("3. Compare the 'UNIQUE ID' shown above with the one in your old file.");
    console.log("   (It is the text between 'postgres://' and the ':' colon).");
    console.log("4. If the strings start differently, you are safe to reset.");
    console.log(`------------------------------------------------\n`);

} catch (e) {
    console.log("Could not parse DATABASE_URL. Is it a valid connection string?");
    console.log("Raw Value (partial): ", url.substring(0, 15) + "...");
}