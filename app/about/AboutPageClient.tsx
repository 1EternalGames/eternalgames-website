// app/about/AboutPageClient.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ContentBlock } from '@/components/ContentBlock';
import AboutPageJsonLd from '@/components/seo/AboutPageJsonLd';
import { urlFor } from '@/sanity/lib/image';
import StaffCard from '@/components/about/StaffCard';
import EditTeamModal from '@/components/about/EditTeamModal';

export default function AboutPageClient({ initialData }: { initialData: any }) {
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamData, setTeamData] = useState(initialData);

    const userRoles = (session?.user as any)?.roles || [];
    const canEdit = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

    const getImg = (member: any) => member?.image
        ? urlFor(member.image).width(400).height(400).fit('crop').url()
        : '/default-avatar.svg';

    const handleSave = (newData: any) => {
        setTeamData(newData);
    };

    return (
        <>
            <AboutPageJsonLd />
            <div className="container page-container">
                <div style={{ maxWidth: '800px', margin: '0 auto 6rem auto', textAlign: 'center' }}>
                    <h1 className="page-title">من نحن</h1>
                    <p style={{ fontSize: '1.8rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                        في <strong>EternalGames</strong>، نؤمن بأن الألعاب ليست مجرد وسيلة ترفيه، بل هي شكل من أشكال الفن الحديث.
                        تأسست منصتنا لتكون صوتًا موثوقًا للاعب العربي، نقدم مراجعات دقيقة، أخبارًا موثقة، ومقالات تحليلية تغوص في عمق الصناعة.
                    </p>
                </div>
                
                <ContentBlock title="فريق العمل">
                    {canEdit && (
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <button onClick={() => setIsModalOpen(true)} className="outline-button">تعديل الفريق</button>
                        </div>
                    )}
                    {teamData ? (
                        <>
                            {teamData.ceo && (
                                <section style={{ marginBottom: '6rem' }}>
                                    <h2 className="section-title">المؤسس</h2>
                                    <div style={{ maxWidth: '350px', margin: '0 auto' }}>
                                        <StaffCard name={teamData.ceo.name} username={teamData.ceo.username} imageUrl={getImg(teamData.ceo)} />
                                    </div>
                                </section>
                            )}

                            <section style={{ marginBottom: '8rem' }}>
                                <h2 className="section-title">قيادة الفريق</h2>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '2.5rem',
                                    maxWidth: '1200px',
                                    margin: '0 auto'
                                }}>
                                    {teamData.editorInChief && (
                                        <div style={{display:'flex', flexDirection: 'column', gap: '1rem'}}><div style={{textAlign:'center', color:'var(--accent)', fontWeight:700}}>رئيس التحرير</div><StaffCard name={teamData.editorInChief.name} username={teamData.editorInChief.username} imageUrl={getImg(teamData.editorInChief)} /></div>
                                    )}
                                    {teamData.headOfReviews && (
                                        <div style={{display:'flex', flexDirection: 'column', gap: '1rem'}}><div style={{textAlign:'center', color:'var(--accent)', fontWeight:700}}>رئيس قسم المراجعات</div><StaffCard name={teamData.headOfReviews.name} username={teamData.headOfReviews.username} imageUrl={getImg(teamData.headOfReviews)} /></div>
                                    )}
                                    {teamData.headOfCommunication && (
                                        <div style={{display:'flex', flexDirection: 'column', gap: '1rem'}}><div style={{textAlign:'center', color:'var(--accent)', fontWeight:700}}>رئيس التواصل</div><StaffCard name={teamData.headOfCommunication.name} username={teamData.headOfCommunication.username} imageUrl={getImg(teamData.headOfCommunication)} /></div>
                                    )}
                                    {teamData.headOfVisuals && (
                                        <div style={{display:'flex', flexDirection: 'column', gap: '1rem'}}><div style={{textAlign:'center', color:'var(--accent)', fontWeight:700}}>رئيس المرئيات</div><StaffCard name={teamData.headOfVisuals.name} username={teamData.headOfVisuals.username} imageUrl={getImg(teamData.headOfVisuals)} /></div>
                                    )}
                                </div>
                            </section>

                            {teamData.reportersSection?.length > 0 && <ContentBlock title="فريق التغطية الإخبارية"><div className="content-grid gpu-cull">{teamData.reportersSection.map((m: any) => <StaffCard key={m._id} name={m.name} username={m.username} imageUrl={getImg(m)} />)}</div></ContentBlock>}
                            {teamData.authorsSection?.length > 0 && <ContentBlock title="فريق التحرير والمحتوى"><div className="content-grid gpu-cull">{teamData.authorsSection.map((m: any) => <StaffCard key={m._id} name={m.name} username={m.username} imageUrl={getImg(m)} />)}</div></ContentBlock>}
                            {teamData.designersSection?.length > 0 && <ContentBlock title="فريق التصميم والإبداع"><div className="content-grid gpu-cull">{teamData.designersSection.map((m: any) => <StaffCard key={m._id} name={m.name} username={m.username} imageUrl={getImg(m)} />)}</div></ContentBlock>}
                        </>
                    ) : <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}><p>يتم تحديث هيكل الفريق حالياً...</p></div>}
                </ContentBlock>

                <ContentBlock title="تواصل معنا">
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.6rem', marginBottom: '2rem' }}>هل لديك استفسار، اقتراح، أو ترغب في الانضمام لفريقنا؟ لا تتردد في مراسلتنا.</p>
                        <a href="mailto:contact@EternalGamesWeb.com" className="primary-button no-underline">contact@EternalGamesWeb.com</a>
                    </div>
                </ContentBlock>
            </div>
            
            {isModalOpen && <EditTeamModal currentTeam={teamData} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </>
    );
}