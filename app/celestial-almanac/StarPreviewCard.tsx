// app/celestial-almanac/StarPreviewCard.tsx

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/sanity/lib/image';
import { OrbitalBodyData, ScreenPosition } from './config';
import { sanityLoader } from '@/lib/sanity.loader'; // <-- IMPORT ADDED

import PCIcon from '@/components/icons/platforms/PCIcon';
import PS5Icon from '@/components/icons/platforms/PS5Icon';
import XboxIcon from '@/components/icons/platforms/XboxIcon';
import SwitchIcon from '@/components/icons/platforms/SwitchIcon';

const PlatformIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'PC': PCIcon,
  'PlayStation': PS5Icon,
  'PlayStation 5': PS5Icon, 
  'Xbox': XboxIcon,
  'Switch': SwitchIcon,
};

export const StarPreviewCard = ({ orbitalBody, position, onClose }: {
    orbitalBody: OrbitalBodyData;
    position: ScreenPosition;
    onClose: () => void;
}) => {
  const { content } = orbitalBody;
  const imageUrl = content.mainImage?.asset ? urlFor(content.mainImage).width(600).height(338).fit('crop').auto('format').url() : null;
  const blurDataURL = content.mainImage?.blurDataURL;
  const linkPath = '/games/' + content.slug;

  const arabicMonths = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const date = new Date(content.releaseDate);
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const formattedDate = `${day} ${arabicMonths[monthIndex]} - ${englishMonths[monthIndex]}, ${year}`;

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
        }} aria-label="إغلاق"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </motion.button>

      <div style={{ position: 'relative', width: '100%', height: '150px' }}>
        {imageUrl ? (
          <Image 
            loader={sanityLoader} // <-- LOADER ADDED
            src={imageUrl} 
            alt={content.title} 
            fill 
            sizes="300px"
            style={{ objectFit: 'cover' }} 
            placeholder={blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL || ''}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--border-color)' }} />
        )}
      </div>

      <div style={{ padding: '1.5rem', textAlign: 'right' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', fontSize: '1.3rem', margin: '0 0 0.5rem 0' }}>
          الإصدار:{formattedDate}
        </p>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.7rem' }}>{content.title}</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
          {(content.platforms || []).map(p => {
            const Icon = PlatformIcons[p];
            return Icon ? (
              <div key={p} title={p}>
                <Icon className="platform-icon" />
              </div>
            ) : null;
          })}
        </div>
        <Link href={linkPath} onClick={onClose} className="primary-button no-underline" style={{ display: 'block', textAlign: 'center' }}>
          محور اللعبة
        </Link>
      </div>
    </motion.div>
  );
};


