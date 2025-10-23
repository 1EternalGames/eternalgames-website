// components/custom/TwoImageGrid.tsx
'use client';

import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import styles from './TwoImageGrid.module.css';

export default function TwoImageGrid({ value }: { value: any }) {
    const { image1, image2 } = value;

    if (!image1?.asset || !image2?.asset) {
        return null;
    }

    return (
        <div className={styles.grid}>
            <div className={styles.imageWrapper}>
                <Image
                    // THE FIX: Explicitly request original format and max quality
                    src={urlFor(image1.asset).auto('format').quality(100).url()}
                    alt={image1.alt || 'Grid Image 1'}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                />
            </div>
            <div className={styles.imageWrapper}>
                <Image
                    // THE FIX: Explicitly request original format and max quality
                    src={urlFor(image2.asset).auto('format').quality(100).url()}
                    alt={image2.alt || 'Grid Image 2'}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                />
            </div>
        </div>
    );
}