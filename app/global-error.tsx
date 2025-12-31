// app/global-error.tsx
'use client';

import { useEffect } from 'react';
import localFont from 'next/font/local';

// Use local font for error page consistency
const cairo = localFont({
  src: [
    {
      path: '../public/fonts/Cairo-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Cairo-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-main',
  display: 'swap',
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Global Error caught:', error);
    }
  }, [error]);

  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: '#050505', 
        color: '#E1E1E6', 
        fontFamily: 'var(--font-main), sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #050505 70%)'
      }}>
        <div style={{ 
            textAlign: 'center', 
            padding: '4rem', 
            maxWidth: '500px',
            border: '1px solid #2a2e3c',
            borderRadius: '12px',
            backgroundColor: '#0A0B0F',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ fontSize: '3.2rem', marginBottom: '1.5rem', color: '#DC2626', fontWeight: 800 }}>
            عذراً، حدث خطأ غير متوقع
          </h2>
          <p style={{ color: '#7D808C', marginBottom: '3rem', fontSize: '1.6rem', lineHeight: 1.6 }}>
             واجه النظام خللاً تقنياً مفاجئاً. فريقنا يعمل على استعادة الخدمة.
             {error.digest && (
                 <span style={{
                     display: 'block', 
                     marginTop: '2rem', 
                     padding: '1rem',
                     backgroundColor: 'rgba(255,255,255,0.05)',
                     borderRadius: '6px',
                     fontFamily: 'monospace',
                     fontSize: '1.2rem',
                     color: '#555'
                 }}>
                     رمز الخطأ: {error.digest}
                 </span>
             )}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '1.2rem 3rem',
              backgroundColor: '#00FFF0',
              color: '#050505',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '1.6rem',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 255, 240, 0.3)',
              transition: 'transform 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            تحديث الصفحة
          </button>
        </div>
      </body>
    </html>
  );
}