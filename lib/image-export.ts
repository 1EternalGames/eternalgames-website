// lib/image-export.ts

/**
 * Loads local font files, converts them to Base64, and generates the @font-face CSS.
 * This ensures the exact font file (with all Arabic glyphs) is embedded in the SVG.
 */
async function getFontStyles() {
    // List of fonts to embed. 
    // Ensure these files exist in your /public/fonts/ folder.
    const fonts = [
        { family: 'Cairo', weight: '400', src: '/fonts/Cairo-Regular.ttf' },
        { family: 'Cairo', weight: '500', src: '/fonts/Cairo-Medium.ttf' },
        { family: 'Cairo', weight: '700', src: '/fonts/Cairo-Bold.ttf' },
        { family: 'Cairo', weight: '900', src: '/fonts/Cairo-Black.ttf' },
    ];

    let css = '';

    for (const font of fonts) {
        try {
            // Fetch the local file
            // Note: In Next.js, fetching from the public folder via URL works relative to the domain
            const response = await fetch(font.src);
            if (!response.ok) throw new Error(`Failed to load ${font.src}`);
            
            const blob = await response.blob();
            
            // Convert to Base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            // Generate CSS Rule
            // We map this font to 'Cairo'
            css += `
                @font-face {
                    font-family: '${font.family}';
                    font-style: normal;
                    font-weight: ${font.weight};
                    src: url(${base64}) format('truetype');
                }
            `;

            // --- ALIASING ---
            // Map 'Anton' (Impact-style) to Cairo-Black for consistency if Arabic is used there
            if (font.weight === '900') {
                css += `
                    @font-face {
                        font-family: 'Anton';
                        font-style: normal;
                        font-weight: 400; 
                        src: url(${base64}) format('truetype');
                    }
                    @font-face {
                        font-family: 'Impact';
                        font-style: normal;
                        font-weight: 400; 
                        src: url(${base64}) format('truetype');
                    }
                `;
            }

            // Map 'Roboto'/'Arial' to Cairo-Regular/Bold to ensure Arabic glyphs render 
            // even if the template requested a Latin font
            if (['400', '700'].includes(font.weight)) {
                css += `
                    @font-face {
                        font-family: 'Arial';
                        font-style: normal;
                        font-weight: ${font.weight};
                        src: url(${base64}) format('truetype');
                    }
                    @font-face {
                        font-family: 'Roboto';
                        font-style: normal;
                        font-weight: ${font.weight};
                        src: url(${base64}) format('truetype');
                    }
                `;
            }

        } catch (error) {
            console.error(`Error embedding font ${font.src}:`, error);
        }
    }

    return css;
}

export async function downloadElementAsImage(
    elementId: string, 
    fileName: string, 
    format: 'png' | 'jpeg' = 'jpeg', 
    scale: number = 2, 
    quality: number = 0.9 
) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Clone the element to manipulate it safely
    const clone = element.cloneNode(true) as HTMLElement;
    const svg = clone.querySelector('svg');
    if (!svg) return;

    // 1. Pre-process Images (Convert external hrefs to Base64)
    const images = svg.querySelectorAll('image');
    for (const img of Array.from(images)) {
        const href = img.getAttribute('href');
        if (href && !href.startsWith('data:')) {
            try {
                const response = await fetch(href);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                img.setAttribute('href', base64);
            } catch (err) {
                console.warn('Failed to convert image for export:', err);
            }
        }
    }

    // 2. Inject Local Fonts
    const fontStyles = await getFontStyles();
    
    // Critical Styles to force Cairo
    const criticalStyles = `
        text, input, div, span, p, foreignObject { 
            font-family: 'Cairo', sans-serif !important; 
        } 
        .social-editor-content p { margin: 0 !important; }
        .variant-hero p { margin: 0; font-size: 0.55em !important; color: #00FFF0 !important; line-height: 1.4 !important; font-weight: 700; }
        .variant-hero p::first-line { font-size: 1.81em !important; color: #FFFFFF !important; line-height: 1.1 !important; font-weight: 900; }
        .variant-card p { margin: 0; font-size: 0.85em !important; color: #FFFFFF !important; opacity: 0.9; font-weight: 500; line-height: 1.3 !important; }
        .variant-card p::first-line { font-size: 1.17em !important; color: #FFFFFF !important; opacity: 1; font-weight: 700; line-height: 1.2 !important; }
    `;
    
    let styleTag = svg.querySelector('style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        svg.prepend(styleTag);
    }
    styleTag.textContent = (styleTag.textContent || '') + criticalStyles + (fontStyles || '');

    // 3. Serialize and Draw
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    const baseWidth = 1080; 
    const baseHeight = 1350;
    const width = baseWidth * scale;
    const height = baseHeight * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const img = new Image();
    const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
    img.src = `data:image/svg+xml;base64,${svgBase64}`;

    return new Promise<void>((resolve, reject) => {
        img.onload = () => {
            if (format === 'jpeg') {
                ctx.fillStyle = '#050505'; 
                ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${fileName}.${format}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    resolve();
                } else {
                    reject(new Error('Canvas conversion failed'));
                }
            }, `image/${format}`, quality);
        };
        img.onerror = (e) => reject(e);
    });
}