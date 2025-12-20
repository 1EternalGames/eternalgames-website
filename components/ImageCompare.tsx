// components/ImageCompare.tsx
'use client';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { urlFor } from '@/sanity/lib/image'; // Import urlFor
import styles from './ImageCompare.module.css';

export default function ImageCompare({ value }: { value: any }) {
    const { image1, image2, size } = value;

    if (!image1?.asset || !image2?.asset) {
        return <div className={styles.placeholder}>Could not load image comparison.</div>;
    }

    // --- THE DEFINITIVE FIX ---
    const imageUrl1 = urlFor(image1).auto('format').url();
    const imageUrl2 = urlFor(image2).auto('format').url();

    return (
        <div className={styles.imageCompareContainer} data-size={size || 'large'}>
            <div className={styles.compareWrapper}>
                <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={imageUrl1} alt={image1.alt || 'Before'} />}
                    itemTwo={<ReactCompareSliderImage src={imageUrl2} alt={image2.alt || 'After'} />}
                />
            </div>
        </div>
    );
}





