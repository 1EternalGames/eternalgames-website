// scripts/capture-screenshots.ts
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000'; 
const OUTPUT_DIR = path.join(process.cwd(), 'public');

async function capture() {
  console.log('📸 Launching browser to capture PWA screenshots...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  // Helper function to hide dev tools, scrollbars, and toasts
  const hideDistractions = async () => {
    await page.addStyleTag({
      content: `
        /* Hide Next.js Dev Tools & Error Overlay */
        nextjs-portal,
        #next-route-announcer,
        [data-nextjs-dialog-overlay],
        [class*="nextjs-toast"],
        
        /* Hide Vercel Toolbar */
        #vercel-toolbar,
        [class*="vercel-toolbar"],
        
        /* Hide Custom Toasts */
        .toast-container-global,
        
        /* Hide Scrollbars */
        body::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { display: none; }
      `
    });
  };
  
  try {
    // 1. Mobile Screenshot (Portrait)
    console.log('📱 Capturing Mobile view...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 }); 
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    await hideDistractions(); // <-- Hides the errors/badges
    
    // Wait for animations
    await new Promise(r => setTimeout(r, 3000)); 
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot-mobile.png') });

    // 2. Desktop Screenshot (Wide)
    console.log('💻 Capturing Desktop/Wide view...');
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    
    await hideDistractions(); // <-- Hides the errors/badges
    
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot-wide.png') });

    console.log('✅ Screenshots saved to /public/ folder without overlays!');
  } catch (error) {
    console.error('❌ Error capturing screenshots. Is localhost:3000 running?', error);
  } finally {
    await browser.close();
  }
}

capture();