// app/about/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { getAllStaffAction } from '@/app/actions/homepageActions';
import { ContentBlock } from '@/components/ContentBlock';
import AboutPageJsonLd from '@/components/seo/AboutPageJsonLd';
import { urlFor } from '@/sanity/lib/image';
import StaffCard from '@/components/about/StaffCard';

export const metadata: Metadata = {
    title: 'من نحن',
    description: 'تعرف على فريق EternalGames ورؤيتنا في تقديم محتوى ألعاب عربي احترافي وموضوعي.',
};

export const dynamic = 'force-static';

export default async function AboutPage() {
    const staff = await getAllStaffAction();

    return (
        <>
            <AboutPageJsonLd />
            <div className="container page-container">
                <div style={{ maxWidth: '800px', margin: '0 auto 6rem auto', textAlign: 'center' }}>
                    <h1 className="page-title">من نحن</h1>
                    <p style={{ fontSize: '1.8rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                        في <strong>EternalGames</strong>، نؤمن بأن الألعاب ليست مجرد وسيلة ترفيه، بل هي شكل من أشكال الفن الحديث. 
                        تأسست منصتنا لتكون صوتًا موثوقًا للاعب العربي، نقدم مراجعات دقيقة، أخبارًا موثقة، ومقالات تحليلية تغوص في عمق الصناعة.
                        هدفنا هو الارتقاء بالمحتوى العربي في مجال الألعاب، بعيدًا عن الضجيج، واقترابًا من الحقيقة.
                    </p>
                </div>

                <ContentBlock title="فريق العمل">
                    <div className="content-grid gpu-cull">
                        {staff.map((member: any) => {
                            // Prepare data on server side to pass as simple props
                            const imageUrl = member.image 
                                ? urlFor(member.image).width(400).height(400).fit('crop').url() 
                                : '/default-avatar.svg';

                            return (
                                <StaffCard 
                                    key={member._id}
                                    name={member.name}
                                    username={member.username || null}
                                    imageUrl={imageUrl}
                                />
                            );
                        })}
                    </div>
                </ContentBlock>

                <ContentBlock title="تواصل معنا">
                    <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        padding: '3rem', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '1.6rem', marginBottom: '2rem' }}>
                            هل لديك استفسار، اقتراح، أو ترغب في الانضمام لفريقنا؟ لا تتردد في مراسلتنا.
                        </p>
                        <a href="mailto:contact@EternalGamesWeb.com" className="primary-button no-underline">
                            contact@EternalGamesWeb.com
                        </a>
                    </div>
                </ContentBlock>
            </div>
        </>
    );
}