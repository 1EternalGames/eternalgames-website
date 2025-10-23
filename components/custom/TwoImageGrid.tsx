// components/custom/TwoImageGrid.tsx
'use client';

import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { useLightboxStore } from '@/lib/lightboxStore';
import styles from './TwoImageGrid.module.css';

export default function TwoImageGrid({ value }: { value: any }) {
    const { image1, image2 } = value;
    const openLightbox = useLightboxStore((state) => state.openLightbox);

    if (!image1?.asset || !image2?.asset) {
        return null;
    }

    return (
        <div className={styles.grid}>
            <div
                className={`${styles.imageWrapper} image-lightbox-trigger`}
                onClick={() => openLightbox(urlFor(image1.asset).auto('format').quality(100).url())}
            >
                <Image
                    src={urlFor(image1.asset).width(800).auto('format').quality(85).url()}
                    alt={image1.alt || 'Grid Image 1'}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                />
            </div>
            <div
                className={`${styles.imageWrapper} image-lightbox-trigger`}
                onClick={() => openLightbox(urlFor(image2.asset).auto('format').quality(100).url())}
            >
                <Image
                    src={urlFor(image2.asset).width(800).auto('format').quality(85).url()}
                    alt={image2.alt || 'Grid Image 2'}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                />
            </div>
        </div>
    );
}