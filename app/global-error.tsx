// app/global-error.tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // SECURITY: Log to external service (e.g. Sentry) but NOT to console in production
    if (process.env.NODE_ENV === 'development') {
        console.error('Global Error caught:', error);
    }
  }, [error]);

  return (
    <html>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: '#050505', 
        color: '#fff', 
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#DC2626' }}>
            عذراً، حدث خطأ غير متوقع
          </h2>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
             نحن نعمل على إصلاح الخلل. 
             {error.digest && <span style={{display: 'block', fontSize: '0.8em', marginTop: '0.5rem', opacity: 0.5}}>رمز الخطأ: {error.digest}</span>}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.8rem 2rem',
              backgroundColor: '#00FFF0',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            تحديث الصفحة
          </button>
        </div>
      </body>
    </html>
  );
}