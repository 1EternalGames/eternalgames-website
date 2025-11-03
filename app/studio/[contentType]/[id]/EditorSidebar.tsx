// components/studio/[contentType]/[id/EditorSidebar.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useTransition } from 'react';
import ButtonLoader from '@/components/ui/ButtonLoader';
import { ProsConsInput } from './metadata/ProsConsInput';
import { GameInput } from './metadata/GameInput';
import { TagInput } from './metadata/TagInput';
import { MainImageInput } from './metadata/MainImageInput';
import { CreatorInput } from './metadata/CreatorInput';
import { PlatformInput } from './metadata/PlatformInput';
import { UploadQuality } from '@/lib/image-optimizer';
import styles from './Editor.module.css';

const sidebarVariants = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 40 } }, exit: { opacity: 0, x: 50, transition: { duration: 0.2, ease: 'easeInOut' as const } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const AlertIcon = () => <svg width="18" height="18" viewBox="0 0 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const ClockIcon = () => <svg width="18" height="18" viewBox="0 0 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const SuccessIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) => ( <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`toggle ${checked ? 'active' : ''}`}> <motion.div className="toggle-handle" layout transition={{ type: 'spring' as const, stiffness: 700, damping: 30 }} /> </button> );

export function EditorSidebar({ 
    document, isOpen, documentState, dispatch, onSave, hasChanges, onPublish, 
    slugValidationStatus, slugValidationMessage, isDocumentValid, uploadQuality, onUploadQualityChange,
    allGames, allTags, allCreators
}: any) {
    const { title, slug, score, verdict, pros, cons, game, tags, publishedAt, mainImage, authors, reporters, designers, releaseDate, platforms, synopsis } = documentState;
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [isSaving, startSaveTransition] = useTransition();
    const [isPublishing, startPublishTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const isReview = document._type === 'review';
    const isArticle = document._type === 'article';
    const isNews = document._type === 'news';
    const isRelease = document._type === 'gameRelease';

    const primaryCreatorConfig = useMemo(() => {
        if (isReview) return { label: 'المراجعون', sanityType: 'reviewer', field: 'authors' };
        if (isArticle) return { label: 'الكتّاب', sanityType: 'author', field: 'authors' };
        if (isNews) return { label: 'المراسلون', sanityType: 'reporter', field: 'reporters' };
        return { label: 'المنشئون', sanityType: 'author', field: 'authors' };
    }, [isReview, isArticle, isNews]);

    const handleSave = () => { startSaveTransition(async () => { setSaveStatus('saving'); const success = await onSave(); setSaveStatus(success ? 'success' : 'idle'); if(success) setTimeout(() => setSaveStatus('idle'), 2000); }); };

    // This check is now robust; it works for releases by checking if a draft ID is being used.
    const isPublished = !document._id.startsWith('drafts.');
    const isScheduled = publishedAt && new Date(publishedAt) > new Date();
    const isSlugValid = slugValidationStatus === 'valid';
    const isSlugPending = slugValidationStatus === 'pending';

    const handlePublishClick = () => {
        startPublishTransition(async () => {
            // For releases, we don't pass a schedule date.
            const publishDate = isRelease ? '' : (scheduledDateTime || '');
            if (hasChanges) {
                const saveSuccess = await onSave();
                if (saveSuccess) {
                    await onPublish(publishDate);
                }
            } else {
                await onPublish(publishDate);
            }
        });
    };

    const publishButtonText = useMemo(() => {
        if (isRelease) {
            return isPublished ? "تحديث الإصدار" : "نشر الإصدار";
        }
        if (scheduledDateTime) return hasChanges ? "حفظ وجدولة" : "جدولة";
        if (isPublished) return hasChanges ? "حفظ وتحديث" : "تحديث";
        return hasChanges ? "حفظ ونشر" : "انشر الآن";
    }, [isRelease, isPublished, scheduledDateTime, hasChanges]);

    const isSaveDisabled = isSaving || !hasChanges || !isSlugValid || isSlugPending || isPublishing;
    const isPublishDisabled = isPublishing || !isDocumentValid || !isSlugValid || isSlugPending || isSaving;
    const isUnpublishDisabled = isPublishing || !isSlugValid || isSlugPending || isSaving;
    const getSlugIcon = () => { if (isSlugPending) return <ClockIcon />; if (isSlugValid) return <CheckIcon />; return <AlertIcon />; };
    const handleFieldChange = (field: string, value: any) => { dispatch({ type: 'UPDATE_FIELD', payload: { field, value } }); };

    const creatorsForRole = (sanityType: string) => allCreators.filter((c: any) => c._type === sanityType);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside className={styles.sanctumSidebar} variants={sidebarVariants} initial="hidden" animate="visible" exit="exit">
                    <motion.div variants={itemVariants} className={styles.sidebarContent}>
                        <h2 className={styles.sidebarTitle}>منصة التحرير</h2>
                        <p className={styles.sidebarSubtitle}>تحرير: {title}</p>
                    </motion.div>
                    
                    <motion.div className={styles.sidebarSection} variants={itemVariants}>
                        {/* THE DEFINITIVE FIX: Publishing controls are now correctly sectioned */}
                        {!isRelease && (
                            <>
                                <label className={styles.sidebarLabel} style={{ marginBottom: '0.75rem' }}>جدولة (اختياري)</label>
                                <input type="datetime-local" value={scheduledDateTime} onChange={(e) => setScheduledDateTime(e.target.value)} className={styles.sidebarInput} disabled={isPublishing || isSaving} />
                            </>
                        )}
                        <motion.button onClick={handlePublishClick} className="primary-button" style={{ width: '100%', marginTop: '1rem', height: '44px' }} disabled={isPublishDisabled}>
                            <AnimatePresence mode="wait">{isPublishing ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{publishButtonText}</motion.span>}</AnimatePresence>
                        </motion.button>
                        {!isRelease && (isPublished || isScheduled) && (<motion.button onClick={() => onPublish(null)} className="outline-button" style={{ width: '100%', marginTop: '0.5rem', color: '#DC2626', borderColor: '#DC2626' }} disabled={isUnpublishDisabled}>إلغاء النشر</motion.button>)}
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '1.4rem', textAlign: 'right' }}> {!isDocumentValid && <span style={{ color: '#DC2626' }}>الحقول الإلزامية ناقصة.</span>}</p>
                    </motion.div>

                    <fieldset disabled={isSaving || isPublishing} style={{border: 'none', padding: 0, margin: 0, minWidth: 0}}>
                        <motion.div className={styles.sidebarSection} variants={itemVariants}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                <label className={styles.sidebarLabel} style={{marginBottom: 0}}>جودة الرفع</label>
                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'var(--font-main)', fontSize: '1.4rem'}}>
                                    <span>1080p</span>
                                    <ToggleSwitch checked={uploadQuality === '4k'} onChange={(isChecked) => onUploadQualityChange(isChecked ? '4k' : '1080p')} />
                                    <span>4K</span>
                                </div>
                            </div>
                            <MainImageInput currentAssetId={mainImage.assetId} currentAssetUrl={mainImage.assetUrl} onImageChange={(assetId, assetUrl) => handleFieldChange('mainImage', { assetId, assetUrl })} uploadQuality={uploadQuality} />
                        </motion.div>
                        
                        <motion.div className={styles.sidebarSection} variants={itemVariants}>
                            <label className={styles.sidebarLabel}>المُعرِّف {!isSlugValid && <AlertIcon />}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <motion.div key={slugValidationStatus} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>{getSlugIcon()}</motion.div>
                                <input type="text" value={slug} onChange={(e) => dispatch({ type: 'UPDATE_SLUG', payload: { slug: e.target.value, isManual: true } })} className={styles.sidebarInput} style={{ flexGrow: 1, borderColor: isSlugValid && !isSlugPending ? '#16A34A' : isSlugPending ? 'var(--border-color)' : '#DC2626' }} />
                            </div>
                            <AnimatePresence> {!isSlugValid && !isSlugPending && <motion.p initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} style={{ color: '#DC2626', fontSize: '1.2rem', marginTop: '0.5rem', textAlign: 'right' }}>{slugValidationMessage}</motion.p>} </AnimatePresence>
                        </motion.div>
                        
                        {isRelease ? ( <> <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>تاريخ الإصدار</label> <input type="date" value={releaseDate} onChange={(e) => handleFieldChange('releaseDate', e.target.value)} className={styles.sidebarInput} /> </motion.div> <motion.div variants={itemVariants}><PlatformInput selectedPlatforms={platforms} onPlatformsChange={(p: any) => handleFieldChange('platforms', p)} /></motion.div> <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>نبذة</label> <textarea value={synopsis} onChange={(e) => handleFieldChange('synopsis', e.target.value)} className={styles.sidebarInput} rows={5} /> </motion.div> </> ) : ( <> <div><CreatorInput allCreators={creatorsForRole(primaryCreatorConfig.sanityType)} label={primaryCreatorConfig.label} selectedCreators={documentState[primaryCreatorConfig.field]} onCreatorsChange={(c: any) => handleFieldChange(primaryCreatorConfig.field, c)} /></div> <div><GameInput allGames={allGames} selectedGame={game} onGameSelect={(g: any) => handleFieldChange('game', g)} /></div> <div><TagInput allTags={allTags} selectedTags={tags} onTagsChange={(t: any) => handleFieldChange('tags', t)} /></div> </> )}
                        <div><CreatorInput allCreators={creatorsForRole('designer')} label="المصممون (اختياري)" selectedCreators={designers} onCreatorsChange={(c: any) => handleFieldChange('designers', c)} /></div>
                        {isReview && (<> <motion.hr variants={itemVariants} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} /> <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>التقييم (0-10) {score <= 0 && <AlertIcon />}</label> <input type="number" value={score} onChange={(e) => handleFieldChange('score', parseFloat(e.target.value) || 0)} className={styles.sidebarInput} min="0" max="10" step="0.1" /> </motion.div> <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>الخلاصة {!verdict.trim() && <AlertIcon />}</label> <textarea value={verdict} onChange={(e) => handleFieldChange('verdict', e.target.value)} className={styles.sidebarInput} rows={3} /> </motion.div> <motion.div variants={itemVariants}><ProsConsInput label="المحاسن" items={pros} setItems={(p: any) => handleFieldChange('pros', p)} /></motion.div> <motion.div variants={itemVariants}><ProsConsInput label="المآخذ" items={cons} setItems={(c: any) => handleFieldChange('cons', c)} /></motion.div> </>)}
                    </fieldset>
                    
                    <div className={styles.sidebarFooter}>
                        <motion.button onClick={handleSave} disabled={isSaveDisabled} className="primary-button" style={{ width: '100%', height: '44px' }}
                            title={isSaveDisabled ? (hasChanges ? 'المُعرّف غير صالح' : 'لا تغييرات للحفظ') : 'حفظ التغييرات'}
                            animate={{ 
                                backgroundColor: saveStatus === 'success' ? '#16A34A' : 'var(--accent)',
                                color: saveStatus === 'success' ? '#fff' : 'inherit'
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {isSaving && <ButtonLoader key="loader" />}
                                {saveStatus === 'success' && <motion.span key="success" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>تم الحفظ!</motion.span>}
                                {saveStatus === 'idle' && <motion.span key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>حفظ التغييرات</motion.span>}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}


