// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      padding: '2rem',
      paddingTop: 'var(--nav-height-scrolled)' 
    }}>
      <h1 style={{ 
        fontSize: 'clamp(8rem, 15vw, 12rem)', 
        fontWeight: 900, 
        color: 'var(--accent)',
        textShadow: '0 0 30px color-mix(in srgb, var(--accent) 30%, transparent)',
        margin: 0,
        lineHeight: 1
      }}>
        404
      </h1>
      <h2 style={{ fontSize: '2.4rem', margin: '1rem 0 2rem 0' }}>
        الطريق مسدود
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 4rem auto', fontSize: '1.6rem' }}>
        الصفحة التي تبحث عنها قد تكون حُذفت، نُقلت، أو أنها لم تكن موجودة من الأساس في هذا الموقع.
      </p>

      {/* Retention Links */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
        <Link href="/reviews" className="outline-button no-underline">
           المراجعات
        </Link>
        <Link href="/news" className="outline-button no-underline">
           الأخبار
        </Link>
        <Link href="/releases" className="outline-button no-underline">
           الإصدارات
        </Link>
      </div>

      <Link href="/" className="primary-button no-underline">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}