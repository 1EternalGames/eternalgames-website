// app/tools/upscaler/page.tsx
import UpscalerClient from '@/components/upscaler/UpscalerClient';
import { ContentBlock } from '@/components/ContentBlock';
import { SparklesIcon } from '@/components/icons/index';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'المسبك البصري | AI Upscaler',
    description: 'أداة رفع دقة الصور باستخدام الذكاء الاصطناعي مباشرة في متصفحك. خصوصية تامة وأداء عالٍ.',
};

export default function UpscalerPage() {
    return (
        <div className="container page-container">
            <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                <h1 className="page-title">المسبك البصري</h1>
                <p style={{ fontSize: '1.8rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    تقنية تحسين الصور بالذكاء الاصطناعي (Swin2SR). تعمل كلياً على جهازك لضمان الخصوصية والسرعة. مثالية للقطات الألعاب الفنية.
                </p>
            </div>
            
            <ContentBlock title="محطة المعالجة" Icon={SparklesIcon}>
                <UpscalerClient />
            </ContentBlock>
        </div>
    );
}