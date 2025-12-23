// app/terms-of-service/page.tsx
import { Metadata } from 'next';
import { ContentBlock } from '@/components/ContentBlock';

export const metadata: Metadata = {
    title: 'شروط الخدمة',
    description: 'الشروط والأحكام لاستخدام منصة EternalGames.',
};

export default function TermsOfServicePage() {
    return (
        <div className="container page-container">
            <h1 className="page-title">شروط الخدمة</h1>

            <ContentBlock title="قبول الشروط">
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    بوصولك واستخدامك لمنصة EternalGames، فإنك تقر بقبولك لهذه الشروط. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام الموقع.
                </p>
            </ContentBlock>

            <ContentBlock title="سلوك المستخدم">
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    نحن مجتمع مبني على الشغف والاحترام. يُحظر تمامًا:
                </p>
                <ul style={{ listStyle: 'disc', paddingRight: '2rem', fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '1rem' }}>
                    <li>خطاب الكراهية، التنمر، أو المضايقة في التعليقات.</li>
                    <li>نشر محتوى غير لائق أو روابط ضارة.</li>
                    <li>محاولة اختراق الموقع أو جمع بيانات المستخدمين.</li>
                </ul>
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '1rem' }}>
                    تحتفظ الإدارة بحق حظر أي حساب يخالف هذه القواعد دون سابق إنذار.
                </p>
            </ContentBlock>

            <ContentBlock title="الملكية الفكرية">
                <p style={{ fontSize: '1.6rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    جميع المحتويات المنشورة من قبل فريق التحرير (مقالات، مراجعات، تصاميم) هي ملكية حصرية لـ EternalGames. لا يجوز نسخها أو إعادة نشرها دون إذن كتابي. المحتوى الذي ينشره المستخدمون (التعليقات) يظل ملكاً لهم، لكنهم يمنحوننا رخصة لعرضه.
                </p>
            </ContentBlock>
        </div>
    );
}