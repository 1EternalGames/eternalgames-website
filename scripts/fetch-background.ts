import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'public');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'my-space-bg.svg');

// --- CONFIGURATION ---
const WIDTH = 1920;
const HEIGHT = 1080;
const STAR_COUNT = 300; // Baked stars

function generateSVG() {
    console.log('Generating custom background SVG...');

    // 1. Generate Static Stars
    let stars = '';
    for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * WIDTH;
        const y = Math.random() * HEIGHT;
        const r = Math.random() * 1.5;
        const opacity = Math.random() * 0.8 + 0.2;
        stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#F0F0FF" opacity="${opacity}" />`;
    }

    // 2. Reconstruct the Defs (Gradients/Patterns from your design)
    const defs = `
        <defs>
            <filter id="sb_stellarBloom">
                <feGaussianBlur stdDeviation="2" result="blur"></feGaussianBlur>
                <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
            </filter>

            <linearGradient id="sb_shardGradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.30"></stop>
                <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.10"></stop>
                <stop offset="100%" stop-color="#10121A" stop-opacity="0"></stop>
            </linearGradient>

            <linearGradient id="sb_shardGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00FFF0" stop-opacity="0.35"></stop>
                <stop offset="50%" stop-color="#00FFF0" stop-opacity="0.1"></stop>
                <stop offset="100%" stop-color="#10121A" stop-opacity="0"></stop>
            </linearGradient>

            <radialGradient id="sb_nebulaTop" cx="50%" cy="0%" r="80%">
                <stop offset="0%" stop-color="#00FFF0" stop-opacity="0.12"></stop>
                <stop offset="100%" stop-color="#10121A" stop-opacity="0"></stop>
            </radialGradient>
            <radialGradient id="sb_nebulaBottom" cx="10%" cy="100%" r="60%">
                <stop offset="0%" stop-color="#556070" stop-opacity="0.2"></stop>
                <stop offset="100%" stop-color="#10121A" stop-opacity="0"></stop>
            </radialGradient>
            <radialGradient id="sb_nebulaRight" cx="95%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00FFF0" stop-opacity="0.08"></stop>
                <stop offset="100%" stop-color="#10121A" stop-opacity="0"></stop>
            </radialGradient>

            <pattern id="sb_scanlinePattern" x="0" y="0" width="10" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="3" x2="10" y2="3" stroke="#000" stroke-width="1" opacity="0.4"></line>
            </pattern>
            
            <radialGradient id="sb_vignette" cx="50%" cy="50%" r="80%">
                <stop offset="60%" stop-color="#10121A" stop-opacity="0"></stop>
                <stop offset="100%" stop-color="#10121A" stop-opacity="0.9"></stop>
            </radialGradient>
        </defs>
    `;

    // 3. Construct the full SVG content
    const svgContent = `
        <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            ${defs}
            
            <!-- Base Background -->
            <rect width="100%" height="100%" fill="#10121A"></rect>

            <!-- Nebulas -->
            <rect width="100%" height="100%" fill="url(#sb_nebulaTop)" style="mix-blend-mode: screen"></rect>
            <rect width="100%" height="100%" fill="url(#sb_nebulaBottom)" style="mix-blend-mode: screen"></rect>
            <rect width="100%" height="100%" fill="url(#sb_nebulaRight)" style="mix-blend-mode: screen"></rect>

            <!-- Stars (Baked) -->
            ${stars}

            <!-- Shards (Static Geometry from your code) -->
            <g style="mix-blend-mode: soft-light">
                <g fill="url(#sb_shardGradWhite)" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5">
                    <path d="M 120 120 L 320 160 L 220 320 L 80 260 Z" opacity="0.7"></path>
                    <path d="M -20 600 L 220 640 L 120 820 L 40 780 Z" opacity="0.5"></path>
                    <path d="M 1450 880 L 1650 920 L 1550 1060 L 1320 1020 Z" opacity="0.8"></path>
                </g>
                <g fill="url(#sb_shardGradCyan)" stroke="#00FFF0" stroke-opacity="0.4" stroke-width="1.5">
                    <path d="M 1580 120 L 1780 80 L 1820 320 L 1620 280 Z" opacity="0.8"></path>
                    <path d="M 150 900 L 350 860 L 300 1040 Z" opacity="0.7"></path>
                </g>
            </g>

            <!-- Scanlines & Vignette -->
            <rect width="100%" height="100%" fill="url(#sb_scanlinePattern)" pointer-events="none"></rect>
            <rect width="100%" height="100%" fill="url(#sb_vignette)"></rect>
        </svg>
    `;

    // 4. Write to file
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, svgContent);
    console.log(`Generated static background at: ${OUTPUT_FILE}`);
}

generateSVG();