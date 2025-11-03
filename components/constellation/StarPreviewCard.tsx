// components/constellation/StarPreviewCard.tsx

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/sanity/lib/image';
import { SanityContentObject, StarData, ScreenPosition } from './config';

interface StarPreviewCardProps {
starData: StarData;
position: ScreenPosition;
onClose: () => void;
}

const typeMap: Record<'review' | 'article' | 'news', string> = {
    review: 'مراجعة',
    article: 'مقالة',
    news: 'خبر'
}

export const StarPreviewCard = ({ starData, position, onClose }: StarPreviewCardProps) => {
    const { content } = starData;
    const getLinkPath = (item: SanityContentObject) => {
        switch (item._type) {
        case 'review': return `/reviews/${item.slug}`;
        case 'article': return `/articles/${item.slug}`;
        case 'news': return `/news/${item.slug}`;
        default: return '/';
        }
    };
    
    const imageUrl = content.mainImage?.asset ? urlFor(content.mainImage).width(600).height(338).fit('crop').auto('format').url() : null;
    const blurDataURL = content.mainImage?.blurDataURL;
    const contentType = typeMap[content._type] || 'محتوى';
    const formattedDate = content.publishedAt 
        ? new Date(content.publishedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

    return (
        <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
        position: 'fixed', top: position.top, left: position.left,
        width: '300px',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 10001,
        transform: position.placement === 'below'
        ? 'translate(-50%, 20px)'
        : 'translate(-50%, calc(-100% - 20px))',
        transformOrigin: position.placement === 'below' ? 'top center' : 'bottom center',
        }}
        >
        <motion.button
        onClick={onClose} whileHover={{ scale: 1.2, rotate: 90 }} whileTap={{ scale: 0.9 }}
        style={{
        position: 'absolute', top: '10px', right: '10px', zIndex: 2, width: '32px', height: '32px',
        borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.3)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)'
        }} aria-label="إغلاق المعاينة"
        >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </motion.button>

        <div style={{ position: 'relative', width: '100%', height: '150px' }}>
            {imageUrl ? ( 
                <Image 
                    src={imageUrl} 
                    alt={content.title} 
                    fill 
                    sizes="300px"
                    style={{ objectFit: 'cover' }} 
                    placeholder={blurDataURL ? 'blur' : 'empty'}
                    blurDataURL={blurDataURL || ''}
                /> 
            ) : ( <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border-color)' }} /> )}
        </div>

        <div style={{ padding: '1.5rem', textAlign: 'right' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem'}}>
                <p style={{ textTransform: 'capitalize', color: 'var(--accent)', fontFamily: 'var(--font-main)', fontSize: '1.3rem', margin: 0 }}>{contentType}</p>
                {formattedDate && <p style={{color: 'var(--text-secondary)', fontSize: '1.2rem', margin: 0}}>{formattedDate}</p>}
            </div>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.7rem' }}>{content.title}</h3>
            <Link href={getLinkPath(content)} onClick={onClose} className="primary-button no-underline" style={{ display: 'block', textAlign: 'center' }}>
                عرض كامل الـ{contentType}
            </Link>
        </div>

        </motion.div>
    );
};


