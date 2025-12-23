// app/privacy-policy/page.tsx
import { Metadata } from 'next';
import { ContentBlock } from '@/components/ContentBlock';

export const metadata: Metadata = {
    title: 'سياسة الخصوصية',
    description: 'سياسة الخصوصية لمنصة EternalGames.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container page-container">
            <h1 className="page-title">سياسة الخصوصية</h1>
            
            <ContentBlock title="مقدمة">
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    في EternalGames، نولي خصوصيتك أهمية قصوى. تشرح هذه الوثيقة ما هي المعلومات التي نجمعها، وكيف نستخدمها، وكيف نحميها. باستخدامك للموقع، فإنك توافق على الممارسات الموضحة في هذه السياسة.
                </p>
            </ContentBlock>

            <ContentBlock title="البيانات التي نجمعها">
                <ul style={{ listStyle: 'disc', paddingRight: '2rem', fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <li style={{ marginBottom: '1rem' }}><strong>معلومات الحساب:</strong> عند التسجيل، نجمع اسمك، بريدك الإلكتروني، وصورتك الرمزية (عبر Google/GitHub أو مباشرة).</li>
                    <li style={{ marginBottom: '1rem' }}><strong>بيانات التفاعل:</strong> تعليقاتك، تقييماتك، والمحتوى الذي تحفظه في المفضلة.</li>
                    <li style={{ marginBottom: '1rem' }}><strong>البيانات التقنية:</strong> عنوان IP (لأغراض الأمان ومنع الاحتيال)، ونوع المتصفح والجهاز لتحسين الأداء.</li>
                </ul>
            </ContentBlock>

            <ContentBlock title="كيف نستخدم بياناتك">
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    لا نقوم ببيع بياناتك لأي طرف ثالث. تُستخدم البيانات حصراً لـ:
                </p>
                <ul style={{ listStyle: 'disc', paddingRight: '2rem', fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '1rem' }}>
                    <li>تخصيص تجربتك (مثل "كوكبة" الاهتمامات).</li>
                    <li>إرسال إشعارات حول الردود على تعليقاتك (يمكنك تعطيلها).</li>
                    <li>حماية المنصة من المحتوى العشوائي (Spam).</li>
                </ul>
            </ContentBlock>
            
            <ContentBlock title="ملفات تعريف الارتباط (Cookies)">
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    نستخدم ملفات تعريف الارتباط الضرورية لتسجيل الدخول وحفظ تفضيلاتك (مثل الوضع الليلي). كما نستخدم أدوات تحليلية (مثل Google Analytics) لفهم كيفية استخدام الموقع بشكل مجهول الهوية.
                </p>
            </ContentBlock>
        </div>
    );
}