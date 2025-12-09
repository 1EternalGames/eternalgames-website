// lib/image-export.ts

/**
 * Fetches and embeds fonts to ensure the downloaded image looks exactly like the canvas.
 * We map 'Impact' to 'Anton' and 'Arial' to 'Roboto' to ensure consistent rendering
 * across all devices (especially mobile) where system fonts might be missing.
 */
async function getFontStyles() {
    try {
        // Fetch Cairo (for Arabic/Main text), Anton (Impact replacement), Roboto (Arial replacement)
        const cssUrl = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Anton&family=Roboto:wght@400;700;900&display=swap';
        const cssResponse = await fetch(cssUrl);
        const cssText = await cssResponse.text();

        // Regex to parse Google Fonts CSS
        const fontFaceRegex = /@font-face\s*{([^}]*)}/g;
        let match;
        let newCss = '';

        const urlRegex = /url\(([^)]+)\)/;
        const familyRegex = /font-family:\s*['"]?([^'";]+)['"]?/;
        const weightRegex = /font-weight:\s*(\d+)/;

        while ((match = fontFaceRegex.exec(cssText)) !== null) {
            const block = match[1];
            const urlMatch = urlRegex.exec(block);
            const familyMatch = familyRegex.exec(block);
            const weightMatch = weightRegex.exec(block);

            if (urlMatch && familyMatch) {
                const fontUrl = urlMatch[1].replace(/['"]/g, '');
                const family = familyMatch[1];
                const weight = weightMatch ? weightMatch[1] : '400';
                
                try {
                    const fontResponse = await fetch(fontUrl);
                    const blob = await fontResponse.blob();
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    // 1. Add the actual font rule
                    newCss += `
                        @font-face {
                            font-family: '${family}';
                            font-style: normal;
                            font-weight: ${weight};
                            src: url(${base64}) format('woff2');
                        }
                    `;

                    // 2. Create Aliases for System Fonts to ensure consistent look
                    // Map 'Impact' -> 'Anton'
                    if (family === 'Anton') {
                        newCss += `
                            @font-face {
                                font-family: 'Impact';
                                font-style: normal;
                                font-weight: 400;
                                src: url(${base64}) format('woff2');
                            }
                        `;
                    }
                    // Map 'Arial' -> 'Roboto'
                    if (family === 'Roboto') {
                        newCss += `
                            @font-face {
                                font-family: 'Arial';
                                font-style: normal;
                                font-weight: ${weight};
                                src: url(${base64}) format('woff2');
                            }
                        `;
                    }

                } catch (err) {
                    console.warn(`Failed to fetch font ${family} weight ${weight}:`, err);
                }
            }
        }

        return newCss;
    } catch (e) {
        console.warn('Failed to process fonts for export', e);
        return null;
    }
}

export async function downloadElementAsImage(
    elementId: string, 
    fileName: string, 
    format: 'png' | 'jpeg' = 'jpeg', 
    scale: number = 2, // Default to 2x (4K)
    quality: number = 0.9 // Default 90% quality for JPG
) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const svg = element.querySelector('svg');
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

    // 2. Inject Fonts & Styles
    const fontStyles = await getFontStyles();
    // Define critical layout styles that might be missing in the serialized SVG context
    const criticalStyles = `
        .social-editor-content p { margin: 0 !important; }
        .ProseMirror p { margin: 0 !important; }
        .social-editor-content { overflow: hidden; }
    `;
    
    let styleTag = svg.querySelector('style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        svg.prepend(styleTag);
    }
    // Append our specific font mappings and critical fixes
    styleTag.textContent = (styleTag.textContent || '') + criticalStyles + (fontStyles || '');

    // 3. Serialize and Draw
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    // Base dimensions for the template
    const baseWidth = 1080; 
    const baseHeight = 1350;

    // Calculate target dimensions
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
            // Draw image scaled
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