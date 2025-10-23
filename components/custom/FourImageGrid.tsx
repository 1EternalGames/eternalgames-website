// components/custom/FourImageGrid.tsx
'use client';

import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import styles from './FourImageGrid.module.css';

export default function FourImageGrid({ value }: { value: any }) {
    const { image1, image2, image3, image4 } = value;

    const images = [image1, image2, image3, image4].filter(img => img?.asset);

    if (images.length === 0) {
        return null;
    }

    return (
        <div className={styles.grid}>
            {images.map((image, index) => (
                <div key={image.asset._id || index} className={styles.imageWrapper}>
                    <Image
                        // THE FIX: Standardized quality to 85
                        src={urlFor(image.asset).auto('format').quality(85).url()}
                        alt={image.alt || `Grid Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        unoptimized
                    />
                </div>
            ))}
        </div>
    );
}