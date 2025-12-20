// components/upscaler/UpscalerClient.tsx
'use client';

import { useUpscaler } from '@/hooks/useUpscaler';
import UpscalerDropzone from './UpscalerDropzone';
import UpscalerProcessing from './UpscalerProcessing';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import styles from './Upscaler.module.css';
import { motion } from 'framer-motion';

export default function UpscalerClient() {
    const { status, progress, message, resultSrc, originalSrc, upscaleImage, reset } = useUpscaler();

    const handleDownload = () => {
        if (!resultSrc) return;
        const link = document.createElement('a');
        link.href = resultSrc;
        link.download = `eternal-upscale-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (status === 'idle') {
        return <UpscalerDropzone onImageSelect={upscaleImage} />;
    }

    if (status === 'error') {
        return (
            <div className={styles.dropzone} style={{ flexDirection: 'column', gap: '1rem', borderColor: '#DC2626' }}>
                <h3 style={{ color: '#DC2626', margin: 0 }}>فشلت المعالجة</h3>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '80%' }}>{message}</p>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>تأكد من دعم المتصفح لـ WebGL وافتح (F12) للتفاصيل.</p>
                <button onClick={reset} className="primary-button" style={{ marginTop: '1rem' }}>
                    حاول مجدداً
                </button>
            </div>
        );
    }

    if (status === 'complete' && resultSrc && originalSrc) {
        return (
            <div className={styles.resultContainer}>
                <div className={styles.compareContainer}>
                    <ReactCompareSlider
                        itemOne={<ReactCompareSliderImage src={originalSrc} alt="Original" />}
                        itemTwo={<ReactCompareSliderImage src={resultSrc} alt="Upscaled" />}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
                <div className={styles.actionsBar}>
                    <motion.button 
                        onClick={handleDownload} 
                        className="primary-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        تحميل الصورة (PNG)
                    </motion.button>
                    <button onClick={reset} className="outline-button">
                        صورة جديدة
                    </button>
                </div>
            </div>
        );
    }

    return (
        <UpscalerProcessing 
            status={status} 
            progress={progress} 
            message={message} 
            imageSrc={originalSrc || ''} 
        />
    );
}


