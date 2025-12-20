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

                    {/* Review Card Template */}
                    <Link href="/studio/social-templates/review-card" className="no-underline">
                        <div className={styles.templateCard}>
                            <div className={styles.templatePreview} style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)' }}>
                                <span style={{ color: '#00FFF0' }}>Review</span>
                            </div>
                            <div style={{ padding: '1.5rem', textAlign: 'right' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>بطاقة مراجعة</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                                    التقييم، الإيجابيات، والسلبيات بتصميم موشور.
                                </p>
                            </div>
                        </div>
                    </Link>

                     {/* Monthly Games Template */}
                     <Link href="/studio/social-templates/monthly-games" className="no-underline">
                        <div className={styles.templateCard}>
                            <div className={styles.templatePreview} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                                <span style={{ color: '#FACC15' }}>Monthly</span>
                            </div>
                            <div style={{ padding: '1.5rem', textAlign: 'right' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>ألعاب الشهر</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                                    جدول إصدارات شهري لـ 9 ألعاب مع منصات.
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Weekly News Template (NEW) */}
                    <Link href="/studio/social-templates/weekly-news" className="no-underline">
                        <div className={styles.templateCard}>
                            <div className={styles.templatePreview} style={{ background: 'linear-gradient(135deg, #10121A 0%, #050505 100%)' }}>
                                <span style={{ color: '#00FFF0', fontSize: '2rem' }}>Weekly</span>
                            </div>
                            <div style={{ padding: '1.5rem', textAlign: 'right' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>النشرة الأسبوعية</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                                    ملخص لأهم الأحداث وأخبار الأسبوع في صورة واحدة.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            </ContentBlock>
        </div>
    );
}


