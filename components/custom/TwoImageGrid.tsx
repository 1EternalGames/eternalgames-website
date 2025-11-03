// components/custom/TwoImageGrid.tsx
'use client';

import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { useLightboxStore } from '@/lib/lightboxStore';
import styles from './TwoImageGrid.module.css';

export default function TwoImageGrid({ value }: { value: any }) {
    const { image1, image2 } = value;
    const openLightbox = useLightboxStore((state) => state.openLightbox);

    const images = [image1, image2].filter(img => img?.asset);
    if (images.length === 0) return null;

    const imageUrls = images.map(img => urlFor(img.asset).auto('format').url());

    return (
        <div className={styles.grid}>
            {images.map((image, index) => (
                <div 
                    key={image.asset._id || index}
                    className={`${styles.imageWrapper} image-lightbox-trigger`}
                    onClick={() => openLightbox(imageUrls, index)}
                >
                    <Image
                        src={urlFor(image.asset).width(800).auto('format').url()}
                        alt={image.alt || `Grid Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        draggable={false}
                        style={{ objectFit: 'cover' }}
                    />
                </div>
            ))}
        </div>
    );
}


