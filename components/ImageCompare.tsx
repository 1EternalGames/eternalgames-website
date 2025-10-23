// components/ImageCompare.tsx
'use client';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import styles from './ImageCompare.module.css';

export default function ImageCompare({ value }: { value: any }) {
    const { image1, image2, size } = value;

    if (!image1?.asset?.url || !image2?.asset?.url) {
        return <div className={styles.placeholder}>Could not load image comparison.</div>;
    }

    return (
        <div className={styles.imageCompareContainer} data-size={size || 'large'}>
            <div className={styles.compareWrapper}>
                <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={image1.asset.url} alt={image1.alt || 'Before'} />}
                    itemTwo={<ReactCompareSliderImage src={image2.asset.url} alt={image2.alt || 'After'} />}
                />
            </div>
        </div>
    );
}


