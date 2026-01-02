// components/constellation/StarPreviewCard.tsx

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLayoutIdStore } from '@/lib/layoutIdStore';
import { urlFor } from '@/sanity/lib/image';
import { StarData, ScreenPosition, Placement } from './config';
import { sanityLoader } from '@/lib/sanity.loader';
import { useContentStore } from '@/lib/contentStore'; 
import ArticleCard from '@/components/ArticleCard'; 
import { adaptToCardProps } from '@/lib/adapters'; 
import { CardProps } from '@/types';

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

const mapContentTypeToRouteType = (type: string): 'reviews' | 'articles' | 'news' => {
    switch (type) {
        case 'review': return 'reviews';
        case 'article': return 'articles';
        case 'news': return 'news';
        default: return 'news';
    }
};

export const StarPreviewCard = ({ starData, position, onClose }: StarPreviewCardProps) => {
    const [isMobile, setIsMobile] = useState(false);
    const { hydrateContent, openOverlay } = useContentStore();
    
    const cardRef = useRef<HTMLDivElement>(null);
    
    const initialYAlign = position.placement === 'above' ? 'bottom' : 'top';
    
    const [layoutState, setLayoutState] = useState<{
        xAlign: 'left' | 'right'; 
        yAlign: 'top' | 'bottom'; 
        isVisible: boolean;
    }>({
        xAlign: 'left',
        yAlign: initialYAlign, 
        isVisible: false 
    });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useLayoutEffect(() => {
        if (!cardRef.current) return;
        
        const updatePosition = () => {
             if (!cardRef.current) return;
             
             const width = cardRef.current.offsetWidth || (isMobile ? 260 : 300);
             const height = cardRef.current.offsetHeight || 350; 
             
             const gap = 20; 
             const VIEWPORT_MARGIN = 20;
    
             const { innerWidth: vw, innerHeight: vh } = window;
             const { top, left } = position;
    
             let xAlign: 'left' | 'right' = 'left';
             
             const rightEdge = left + width + gap + VIEWPORT_MARGIN;
             
             if (rightEdge > vw) {
                 const leftEdgeIfFlipped = left - width - gap - VIEWPORT_MARGIN;
                 if (leftEdgeIfFlipped > 0) {
                     xAlign = 'right';
                 } else {
                     const spaceRight = vw - left;
                     const spaceLeft = left;
                     xAlign = spaceRight > spaceLeft ? 'left' : 'right';
                 }
             }
    
             let yAlign: 'top' | 'bottom' = initialYAlign;
    
             const bottomEdgeIfTopAligned = top + height + gap + VIEWPORT_MARGIN;
             const topEdgeIfBottomAligned = top - height - gap - VIEWPORT_MARGIN;
    
             if (yAlign === 'top') {
                 if (bottomEdgeIfTopAligned > vh) {
                     if (topEdgeIfBottomAligned > 0) {
                         yAlign = 'bottom';
                     }
                 }
             } else {
                 if (topEdgeIfBottomAligned < 0) {
                     if (bottomEdgeIfTopAligned < vh) {
                         yAlign = 'top';
                     }
                 }
             }
    
             setLayoutState({
                 xAlign,
                 yAlign,
                 isVisible: true
             });
        };

        updatePosition();
        
        const observer = new ResizeObserver(updatePosition);
        observer.observe(cardRef.current);

        return () => observer.disconnect();
    }, [position, isMobile, initialYAlign]);

    // ADAPT CONTENT
    const cardProps: CardProps | null = adaptToCardProps(starData.content, { width: 600 });
    
    if (!cardProps) return null;

    const GAP_PX = 20;
    const tx = layoutState.xAlign === 'left' ? `${GAP_PX}px` : `calc(-100% - ${GAP_PX}px)`;
    const ty = layoutState.yAlign === 'top' ? `${GAP_PX}px` : `calc(-100% - ${GAP_PX}px)`;
    const transformStyle = `translate(${tx}, ${ty})`;
    const originY = layoutState.yAlign === 'top' ? 'top' : 'bottom';
    const originX = layoutState.xAlign === 'left' ? 'left' : 'right';
    const originStyle = `${originY} ${originX}`;

    return (
        <motion.div
            ref={cardRef}
            // FIX: Removed conflicting layoutId on wrapper
            
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ 
                opacity: layoutState.isVisible ? 1 : 0, 
                scale: layoutState.isVisible ? 1 : 0.8 
            }} 
            exit={{ opacity: 0, scale: 0.8 }}
            
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            
            style={{
                position: 'fixed', 
                top: position.top, 
                left: position.left,
                width: isMobile ? '260px' : '300px',
                // FIX: Lower Z-Index to stay under Overlay (2050)
                zIndex: 2041, 
                transform: transformStyle,
                transformOrigin: originStyle,
                cursor: 'default',
                visibility: layoutState.isVisible ? 'visible' : 'hidden' 
            }}
        >
            <div style={{ position: 'relative' }}>
                <motion.button
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    whileHover={{ scale: 1.2, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    style={{
                        position: 'absolute', top: '10px', right: '10px', zIndex: 100, width: '32px', height: '32px',
                        borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)'
                    }} aria-label="إغلاق"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </motion.button>

                <ArticleCard 
                    article={cardProps}
                    // FIX: Unique prefix to prevent conflict
                    layoutIdPrefix={`constellation-popup-${cardProps.legacyId}`}
                    isPriority={true}
                    disableLivingEffect={false} 
                    smallTags={true} 
                />
            </div>
        </motion.div>
    );
};