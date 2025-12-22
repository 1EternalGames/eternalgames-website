// lib/security.ts

export async function validateImageFile(file: File): Promise<{ isValid: boolean; error?: string }> {
  if (!file) return { isValid: false, error: 'No file provided' };
  if (file.size === 0) return { isValid: false, error: 'Empty file' };
  
  const arrayBuffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let header = "";
  for (let i = 0; i < bytes.length; i++) {
    header += bytes[i].toString(16).toUpperCase();
  }

  const isJpeg = header.startsWith('FFD8FF');
  const isPng = header.startsWith('89504E47');
  const isGif = header.startsWith('47494638');
  const isWebp = header.startsWith('52494646');

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return { 
      isValid: false, 
      error: 'نوع الملف غير مدعوم أو تالف (توقيع ثنائي غير صالح).'
    };
  }

  return { isValid: true };
}

export function sanitizeStrict(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * SSRF Protection: Validates that a URL belongs to a trusted image provider
 * or is a relative path. Blocks internal network access.
 */
const ALLOWED_IMAGE_DOMAINS = [
    'lh3.googleusercontent.com', // Google
    'avatars.githubusercontent.com', // GitHub
    'pbs.twimg.com', // Twitter
    'abs.twimg.com', // Twitter default
    'public.blob.vercel-storage.com', // Vercel Blob
    'cdn.sanity.io' // Sanity
];

export function isSafeImageUrl(url: string): boolean {
    if (!url) return false;
    
    try {
        const parsed = new URL(url);
        
        // 1. Block non-http protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
        
        // 2. Allow specific trusted domains only
        // This is the strongest defense against SSRF
        return ALLOWED_IMAGE_DOMAINS.some(domain => parsed.hostname.endsWith(domain));
    } catch (e) {
        return false;
    }
}
export function sanitizeRedirectUrl(url: string | null): string {
    if (!url) return '/';
    
    // If it starts with / and NOT // (protocol relative), it's safe-ish
    if (url.startsWith('/') && !url.startsWith('//')) {
        return url;
    }
    
    // Otherwise, force root
    return '/';
}
export function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}