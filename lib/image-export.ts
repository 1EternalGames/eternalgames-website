// lib/image-export.ts

// Helper to fetch and base64 encode the font
async function getFontBase64() {
    try {
        // Fetch the Cairo font (Bold/Black 900) directly to ensure it renders in Canvas
        const response = await fetch('https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhxzQw.woff2');
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Failed to fetch font for export', e);
        return null;
    }
}

export async function downloadElementAsImage(elementId: string, fileName: string, format: 'png' | 'jpeg' = 'png') {
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

    // 2. Pre-process Fonts (Inject @font-face with base64 data)
    const fontBase64 = await getFontBase64();
    let styleTag = svg.querySelector('style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        svg.prepend(styleTag);
    }
    
    if (fontBase64) {
        // Explicitly define the font face for the SVG context
        styleTag.textContent += `
            @font-face {
                font-family: 'Cairo';
                font-style: normal;
                font-weight: 900;
                src: url(${fontBase64}) format('woff2');
            }
            text, input { font-family: 'Cairo', sans-serif !important; }
        `;
    }

    // 3. Serialize and Draw
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1080; 
    const height = 1350;
    
    canvas.width = width;
    canvas.height = height;

    if (!ctx) return;

    const img = new Image();
    const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
    img.src = `data:image/svg+xml;base64,${svgBase64}`;

    return new Promise<void>((resolve, reject) => {
        img.onload = () => {
            if (format === 'jpeg') {
                ctx.fillStyle = '#000000';
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
            }, `image/${format}`, 1.0);
        };
        img.onerror = (e) => reject(e);
    });
}