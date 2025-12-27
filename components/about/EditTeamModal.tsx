// components/about/EditTeamModal.tsx
'use client';

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { getAllStaffAction } from '@/app/actions/homepageActions';
import { updateAboutPageAction } from '@/app/actions/aboutActions';
import { useToast } from '@/lib/toastStore';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { sanityLoader } from '@/lib/sanity.loader';

type Creator = { _id: string; name: string; username?: string; image?: any };

// Reusable creator selector popover
const CreatorSelector = ({ label, allStaff, selected, onSelect }: { label: string, allStaff: Creator[], selected: Creator | null, onSelect: (c: Creator | null) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => 
        allStaff.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), 
    [allStaff, search]);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</label>
            <div className="profile-input" onClick={() => setIsOpen(true)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selected?.name || 'اختر عضوًا...'}</span>
                {selected && <button onClick={(e) => { e.stopPropagation(); onSelect(null); }} style={{background:'none', border:'none', color:'#DC2626', cursor:'pointer'}}>x</button>}
            </div>
            {isOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', zIndex: 10, borderRadius: '8px', marginTop: '0.5rem', padding: '0.5rem' }}>
                    <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="profile-input" style={{ marginBottom: '0.5rem' }} autoFocus />
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filtered.map(staff => <button key={staff._id} onClick={() => { onSelect(staff); setIsOpen(false); }} className="country-picker-button">{staff.name}</button>)}
                    </div>
                </div>
            )}
        </div>
    );
};

const TeamSelector = ({ label, allStaff, selected, onUpdate }: { label: string, allStaff: Creator[], selected: Creator[], onUpdate: (team: Creator[]) => void }) => {
    const add = (c: Creator) => { if (!selected.find(s => s._id === c._id)) onUpdate([...selected, c]); };
    const remove = (id: string) => onUpdate(selected.filter(s => s._id !== id));

    return (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '1.6rem' }}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0', padding: '0.5rem', background:'var(--bg-primary)', borderRadius:'8px' }}>
                {selected.map(c => <div key={c._id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'var(--bg-secondary)', padding:'0.2rem 0.8rem', borderRadius:'99px' }}>{c.name} <button onClick={() => remove(c._id)} style={{background:'none',border:'none',color:'#DC2626',cursor:'pointer'}}>x</button></div>)}
            </div>
            <CreatorSelector label={`إضافة إلى ${label}`} allStaff={allStaff.filter(s => !selected.some(c => c._id === s._id))} selected={null} onSelect={(c) => c && add(c)} />
        </div>
    );
};

export default function EditTeamModal({ currentTeam, onClose, onSave }: { currentTeam: any, onClose: () => void, onSave: (data: any) => void }) {
    const [allStaff, setAllStaff] = useState<Creator[]>([]);
    const [ceo, setCeo] = useState<Creator | null>(currentTeam?.ceo || null);
    const [headOfComm, setHeadOfComm] = useState<Creator | null>(currentTeam?.headOfCommunication || null);
    const [headOfReviews, setHeadOfReviews] = useState<Creator | null>(currentTeam?.headOfReviews || null);
    const [editorInChief, setEditorInChief] = useState<Creator | null>(currentTeam?.editorInChief || null);
    const [headOfVisuals, setHeadOfVisuals] = useState<Creator | null>(currentTeam?.headOfVisuals || null);
    const [reporters, setReporters] = useState<Creator[]>(currentTeam?.reportersSection || []);
    const [authors, setAuthors] = useState<Creator[]>(currentTeam?.authorsSection || []);
    const [designers, setDesigners] = useState<Creator[]>(currentTeam?.designersSection || []);
    const [isFetching, startFetch] = useTransition();
    const [isSaving, startSave] = useTransition();
    const toast = useToast();

    useEffect(() => {
        startFetch(async () => {
            const staff = await getAllStaffAction();
            setAllStaff(staff);
        });
    }, []);

    const handleSave = () => {
        startSave(async () => {
            const dataToSave = {
                ceo: ceo?._id || null,
                headOfCommunication: headOfComm?._id || null,
                headOfReviews: headOfReviews?._id || null,
                editorInChief: editorInChief?._id || null,
                headOfVisuals: headOfVisuals?._id || null,
                reportersSection: reporters.map(c => c._id),
                authorsSection: authors.map(c => c._id),
                designersSection: designers.map(c => c._id),
            };
            const result = await updateAboutPageAction(dataToSave);
            if (result.success) {
                // To reflect changes without a full reload, we need to pass back the full objects
                const updatedData = { ceo, headOfCommunication: headOfComm, headOfReviews, editorInChief, headOfVisuals, reportersSection: reporters, authorsSection: authors, designersSection: designers };
                onSave(updatedData);
                toast.success(result.message);
                onClose();
            } else {
                toast.error(result.message);
            }
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} style={{ maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0 }}>تعديل هيكل الفريق</h3>
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', margin: '-1rem' }}>
                {isFetching ? <div className="spinner" /> : (
                    <>
                        <CreatorSelector label="المؤسس (CEO)" allStaff={allStaff} selected={ceo} onSelect={setCeo} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                            <CreatorSelector label="رئيس التحرير" allStaff={allStaff} selected={editorInChief} onSelect={setEditorInChief} />
                            <CreatorSelector label="رئيس المراجعات" allStaff={allStaff} selected={headOfReviews} onSelect={setHeadOfReviews} />
                            <CreatorSelector label="رئيس التواصل" allStaff={allStaff} selected={headOfComm} onSelect={setHeadOfComm} />
                            <CreatorSelector label="رئيس المرئيات" allStaff={allStaff} selected={headOfVisuals} onSelect={setHeadOfVisuals} />
                        </div>
                        <TeamSelector label="فريق الأخبار" allStaff={allStaff} selected={reporters} onUpdate={setReporters} />
                        <TeamSelector label="فريق التحرير" allStaff={allStaff} selected={authors} onUpdate={setAuthors} />
                        <TeamSelector label="فريق التصميم" allStaff={allStaff} selected={designers} onUpdate={setDesigners} />
                    </>
                )}
            </div>
            <div className={modalStyles.modalActions} style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={handleSave} className="primary-button" disabled={isSaving}>
                    {isSaving ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
            </div>
        </Modal>
    );
}