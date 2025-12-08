import Link from 'next/link';
import { CardProps } from '@/types';
import { ContentBlock } from '@/components/ContentBlock';
import styles from '@/components/studio/social/SocialEditor.module.css';

export default function SocialTemplatesDashboard() {
    return (
        <div className="container page-container">
            <h1 className="page-title">قوالب التواصل الاجتماعي</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '4rem', textAlign: 'center' }}>
                أنشئ محتوى بصري احترافي لمنصات التواصل الاجتماعي بسرعة فائقة.
            </p>

            <ContentBlock title="القوالب المتاحة">
                <div className={styles.templateGrid}>
                    {/* Instagram News Template Card */}
                    <Link href="/studio/social-templates/instagram-news" className="no-underline">
                        <div className={styles.templateCard}>
                            <div className={styles.templatePreview}>
                                <span>IG News</span>
                            </div>
                            <div style={{ padding: '1.5rem', textAlign: 'right' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>خبر إنستغرام (Titan)</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                                    تصميم سايبربنك للأخبار العاجلة والإشاعات.
                                </p>
                            </div>
                        </div>
                    </Link>
                    
                    {/* Placeholder for future templates */}
                     <div className={styles.templateCard} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <div className={styles.templatePreview}>
                            <span>Review</span>
                        </div>
                        <div style={{ padding: '1.5rem', textAlign: 'right' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>بطاقة مراجعة (قريبًا)</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                                تلخيص التقييم، الإيجابيات، والسلبيات.
                            </p>
                        </div>
                    </div>
                </div>
            </ContentBlock>
        </div>
    );
}