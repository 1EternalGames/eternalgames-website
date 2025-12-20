// components/studio/[contentType]/[id]/EditorSidebar.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useTransition, useEffect } from 'react';
import ButtonLoader from '@/components/ui/ButtonLoader';
import { ProsConsInput } from './metadata/ProsConsInput';
import { GameInput } from './metadata/GameInput';
import { TagInput } from './metadata/TagInput';
import { MainImageInput } from './metadata/MainImageInput';
import { CreatorInput } from './metadata/CreatorInput';
import { PlatformInput } from './metadata/PlatformInput';
import { SlugInput } from './metadata/SlugInput';
import { NewsTypeInput } from './metadata/NewsTypeInput'; 
import { DeveloperInput } from './metadata/DeveloperInput'; 
import { PublisherInput } from './metadata/PublisherInput'; 
import ColorDictionaryManager from './metadata/color-dictionary/ColorDictionaryManager';
import VerticalImageEditor from './metadata/VerticalImageEditor'; // IMPORTED
import { UploadQuality } from '@/lib/image-optimizer';
import styles from './Editor.module.css';

const sidebarVariants = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 40 } }, exit: { opacity: 0, x: 50, transition: { duration: 0.2, ease: 'easeInOut' as const } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
const ToggleSwitch = ({ checked, onChange, name }: { checked: boolean, onChange: (checked: boolean) => void, name?: string }) => ( <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`toggle ${checked ? 'active' : ''}`}> <motion.div className="toggle-handle" layout transition={{ type: 'spring' as const, stiffness: 700, damping: 30 }} /> {name && <input type="checkbox" name={name} checked={checked} readOnly style={{ display: 'none' }} />} </button> );

export function EditorSidebar({ 
    document, isOpen, documentState, dispatch, onSave, hasChanges, onPublish, 
    slugValidationStatus, slugValidationMessage, isDocumentValid, 
    mainImageUploadQuality, onMainImageUploadQualityChange,
    colorDictionary,
    studioMetadata 
}: any) {
    const { title, slug, score, verdict, pros, cons, game, tags, mainImage, mainImageVertical, authors, reporters, designers, releaseDate, platforms, synopsis, category, isSlugManual, newsType, price, developer, publisher, isTBA, trailer, isPinned, onGamePass, onPSPlus, datePrecision } = documentState;
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [isSaving, startSaveTransition] = useTransition();
    const [isPublishing, startPublishTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const publishedAt = document.publishedAt;
    const isReview = document._type === 'review';
    const isArticle = document._type === 'article';
    const isNews = document._type === 'news';
    const isRelease = document._type === 'gameRelease';

    const primaryCreatorConfig = useMemo(() => {
        if (isReview) return { label: 'المراجعون', sanityType: 'REVIEWER', field: 'authors' };
        if (isArticle) return { label: 'الكتّاب', sanityType: 'AUTHOR', field: 'authors' };
        if (isNews) return { label: 'المراسلون', sanityType: 'REPORTER', field: 'reporters' };
        return { label: 'المنشئون', sanityType: 'AUTHOR', field: 'authors' };
    }, [isReview, isArticle, isNews]);

    const handleSave = () => { startSaveTransition(async () => { setSaveStatus('saving'); const success = await onSave(); setSaveStatus(success ? 'success' : 'idle'); if(success) setTimeout(() => setSaveStatus('idle'), 2000); }); };
    
    const isPublished = useMemo(() => publishedAt && new Date(publishedAt) <= new Date(), [publishedAt]);
    const isScheduled = useMemo(() => publishedAt && new Date(publishedAt) > new Date(), [publishedAt]);
    const isSlugValid = slugValidationStatus === 'valid';
    const isSlugPending = slugValidationStatus === 'pending';

    const handlePublishClick = () => { 
        startPublishTransition(async () => { 
            const publishDate = isRelease ? '' : (scheduledDateTime || ''); 
            let success = false;
            if (hasChanges) { 
                const saveSuccess = await onSave(); 
                if (saveSuccess) { 
                    success = await onPublish(publishDate); 
                } 
            } else { 
                success = await onPublish(publishDate); 
            } 
            if (success) { setScheduledDateTime(''); }
        }); 
    };
    
    const publishButtonText = useMemo(() => {
        if (isRelease) { return "تحديث الإصدار"; }
        if (scheduledDateTime) return hasChanges ? "حفظ وجدولة" : "جدولة";
        if (isPublished) return hasChanges ? "حفظ وتحديث" : "تحديث";
        return hasChanges ? "حفظ ونشر" : "نشر";
    }, [isRelease, isPublished, scheduledDateTime, hasChanges]);

    const canPerformPublishAction = useMemo(() => {
        if (hasChanges) return true;
        if (isRelease) return false;
        if (!publishedAt) return true;
        if (isScheduled) return true;
        if (isPublished) { if (scheduledDateTime) return true; return false; }
        return true;
    }, [hasChanges, isRelease, publishedAt, isScheduled, isPublished, scheduledDateTime]);

    const isSaveDisabled = isSaving || !hasChanges || !isSlugValid || isSlugPending || isPublishing;
    const isPublishDisabled = isPublishing || !isDocumentValid || !isSlugValid || isSlugPending || isSaving || !canPerformPublishAction;
    const isUnpublishDisabled = isPublishing || !isSlugValid || isSlugPending || isSaving;
    const handleFieldChange = (field: string, value: any) => { dispatch({ type: 'UPDATE_FIELD', payload: { field, value } }); };

    // --- Date Component Logic ---
    const [year, setYear] = useState<string>('');
    const [month, setMonth] = useState<string>('');
    const [day, setDay] = useState<string>('');
    const [initializedDate, setInitializedDate] = useState(false);

    // One-time initialization from document state
    useEffect(() => {
        if (releaseDate && !initializedDate) {
            const d = new Date(releaseDate);
            if (!isNaN(d.getTime())) {
                setYear(d.getFullYear().toString());
                if (datePrecision === 'month' || datePrecision === 'day') {
                    setMonth((d.getMonth() + 1).toString().padStart(2, '0'));
                }
                if (datePrecision === 'day') {
                    setDay(d.getDate().toString().padStart(2, '0'));
                }
            }
            setInitializedDate(true);
        }
    }, [releaseDate, datePrecision, initializedDate]);

    // Handle Manual Changes to Date Parts
    const updateReleaseDate = (newYear: string, newMonth: string, newDay: string) => {
        setYear(newYear);
        setMonth(newMonth);
        const effectiveDay = newMonth ? newDay : ''; 
        setDay(effectiveDay);

        let newPrecision = 'year';
        const y = newYear || new Date().getFullYear().toString();
        let m = '12';
        let d = '31';

        if (newMonth) {
            m = newMonth;
            if (effectiveDay) {
                 newPrecision = 'day';
                 d = effectiveDay;
            } else {
                 newPrecision = 'month';
                 const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
                 d = lastDay.toString();
            }
        } else {
            newPrecision = 'year';
        }

        const mStr = m.padStart(2, '0');
        const dStr = d.padStart(2, '0');
        const newDateStr = `${y}-${mStr}-${dStr}`;

        if (newDateStr !== releaseDate) handleFieldChange('releaseDate', newDateStr);
        if (newPrecision !== datePrecision) handleFieldChange('datePrecision', newPrecision);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside className={styles.sanctumSidebar} variants={sidebarVariants} initial="hidden" animate="visible" exit="exit">
                    <motion.div variants={itemVariants} className={styles.sidebarContent}>
                        <h2 className={styles.sidebarTitle}>منصة التحرير</h2>
                        <p className={styles.sidebarSubtitle}>تحرير: {title}</p>
                    </motion.div>
                    
                    <motion.div className={styles.sidebarSection} variants={itemVariants}>
                        {!isRelease && ( <> <label className={styles.sidebarLabel} style={{ marginBottom: '0.75rem' }}>جدولة (اختياري)</label> <input type="datetime-local" value={scheduledDateTime} onChange={(e) => setScheduledDateTime(e.target.value)} className={styles.sidebarInput} disabled={isPublishing || isSaving} /> </> )}
                        <motion.button onClick={handlePublishClick} className="primary-button" style={{ width: '100%', marginTop: '1rem', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} disabled={isPublishDisabled} animate={{ width: isPublishing ? '44px' : '100%', borderRadius: isPublishing ? '50%' : '5px', paddingLeft: isPublishing ? 0 : '2.4rem', paddingRight: isPublishing ? 0 : '2.4rem' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                            <AnimatePresence mode="wait">{isPublishing ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{whiteSpace: 'nowrap'}}>{publishButtonText}</motion.span>}</AnimatePresence>
                        </motion.button>
                        {!isRelease && (isPublished || isScheduled) && (<motion.button onClick={() => onPublish(null)} className="outline-button" style={{ width: '100%', marginTop: '0.5rem', color: '#DC2626', borderColor: '#DC2626' }} disabled={isUnpublishDisabled}>إلغاء النشر</motion.button>)}
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '1.4rem', textAlign: 'right' }}> {!isDocumentValid && <span style={{ color: '#DC2626' }}>الحقول الإلزامية ناقصة.</span>}</p>
                    </motion.div>

                    <fieldset disabled={isSaving || isPublishing} style={{border: 'none', padding: 0, margin: 0, minWidth: 0}}>
                        <motion.div className={styles.sidebarSection} variants={itemVariants}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                <label className={styles.sidebarLabel} style={{marginBottom: 0}}>الصور</label>
                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'var(--font-main)', fontSize: '1.4rem'}}>
                                    <span>1080p</span>
                                    <ToggleSwitch checked={mainImageUploadQuality === '4k'} onChange={(isChecked) => onMainImageUploadQualityChange(isChecked ? '4k' : '1080p')} />
                                    <span>4K</span>
                                </div>
                            </div>
                            
                            {/* Horizontal Main Image */}
                            <label className={styles.sidebarLabel} style={{fontSize: '1.2rem', marginTop: '0.5rem'}}>رئيسية (أفقية)</label>
                            <MainImageInput 
                                currentAssetId={mainImage.assetId} 
                                currentAssetUrl={mainImage.assetUrl} 
                                onImageChange={(assetId, assetUrl) => handleFieldChange('mainImage', { assetId, assetUrl })} 
                                uploadQuality={mainImageUploadQuality} 
                            />

                            {/* Vertical Vanguard Image - REPLACED WITH NEW EDITOR */}
                            <div style={{ marginTop: '2.5rem' }}>
                                <label className={styles.sidebarLabel} style={{fontSize: '1.2rem'}}>Vanguard (عمودية - 4:5)</label>
                                <VerticalImageEditor 
                                    currentImageUrl={mainImageVertical.assetUrl} 
                                    onImageChange={(assetId, assetUrl) => handleFieldChange('mainImageVertical', { assetId, assetUrl })} 
                                    uploadQuality={mainImageUploadQuality} 
                                />
                            </div>
                        </motion.div>
                        
                        {!isRelease && (
                            <SlugInput 
                                slug={slug} title={title} docId={document._id} isSlugManual={isSlugManual}
                                slugValidationStatus={slugValidationStatus} slugValidationMessage={slugValidationMessage} dispatch={dispatch}
                            />
                        )}
                        
                        {isRelease ? ( <> 
                            <motion.div variants={itemVariants}><GameInput allGames={studioMetadata?.games || []} selectedGame={game} onGameSelect={(g: any) => handleFieldChange('game', g)} /></motion.div>
                            
                            <motion.div className={styles.sidebarSection} variants={itemVariants}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <label className={styles.sidebarLabel} style={{marginBottom: 0}}>تثبيت في المقدمة</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ToggleSwitch name="isPinned" checked={isPinned} onChange={(val) => handleFieldChange('isPinned', val)} />
                                    </div>
                                </div>
                                <label className={styles.sidebarLabel}>رابط العرض الدعائي (YouTube)</label>
                                <input type="url" value={trailer || ''} onChange={(e) => handleFieldChange('trailer', e.target.value)} placeholder="https://youtube.com/..." className={styles.sidebarInput} dir="ltr"/>
                            </motion.div>

                            <motion.div className={styles.sidebarSection} variants={itemVariants}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label className={styles.sidebarLabel}>تاريخ الإصدار</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>TBA</span>
                                        <ToggleSwitch name="isTBA" checked={isTBA} onChange={(val) => handleFieldChange('isTBA', val)} />
                                    </div>
                                </div>

                                {!isTBA && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {/* Year Input (Required) */}
                                        <div style={{ flex: 1 }}>
                                            <input 
                                                type="number" 
                                                placeholder="السنة (YYYY)" 
                                                value={year} 
                                                onChange={(e) => updateReleaseDate(e.target.value, month, day)} 
                                                className={styles.sidebarInput} 
                                                min="2000" max="2100"
                                            />
                                        </div>
                                        
                                        {/* Month Input (Optional) */}
                                        <div style={{ flex: 1 }}>
                                            <select 
                                                value={month} 
                                                onChange={(e) => updateReleaseDate(year, e.target.value, day)}
                                                className={styles.sidebarInput}
                                                style={{ paddingRight: '0.5rem' }}
                                            >
                                                <option value="">الشهر (اختياري)</option>
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <option key={i} value={String(i + 1).padStart(2, '0')}>
                                                        {new Date(0, i).toLocaleString('ar-EG', { month: 'short' })}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Day Input (Optional, disabled if no month) */}
                                        <div style={{ flex: 0.6 }}>
                                            <input 
                                                type="number" 
                                                placeholder="اليوم" 
                                                min="1" max="31"
                                                value={day} 
                                                onChange={(e) => updateReleaseDate(year, month, e.target.value)} 
                                                className={styles.sidebarInput}
                                                disabled={!month}
                                                style={{ opacity: !month ? 0.5 : 1 }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div> 
                            
                            <motion.div className={styles.sidebarSection} variants={itemVariants}>
                                <label className={styles.sidebarLabel}>السعر</label>
                                <input type="text" placeholder="$69.99 أو Free" value={price || ''} onChange={(e) => handleFieldChange('price', e.target.value)} className={styles.sidebarInput} />
                            </motion.div>

                            <motion.div className={styles.sidebarSection} variants={itemVariants}>
                                <label className={styles.sidebarLabel} style={{marginBottom: '1rem'}}>خدمات الاشتراك</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>Game Pass</span>
                                        <ToggleSwitch name="onGamePass" checked={onGamePass} onChange={(val) => handleFieldChange('onGamePass', val)} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>PlayStation Plus</span>
                                        <ToggleSwitch name="onPSPlus" checked={onPSPlus} onChange={(val) => handleFieldChange('onPSPlus', val)} />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants}><DeveloperInput allDevelopers={studioMetadata?.developers || []} selectedDeveloper={developer} onDeveloperSelect={(dev) => handleFieldChange('developer', dev)} /></motion.div>
                            <motion.div variants={itemVariants}><PublisherInput allPublishers={studioMetadata?.publishers || []} selectedPublisher={publisher} onPublisherSelect={(pub) => handleFieldChange('publisher', pub)} /></motion.div>
                            <motion.div variants={itemVariants}><PlatformInput selectedPlatforms={platforms} onPlatformsChange={(p: any) => handleFieldChange('platforms', p)} /></motion.div>
                            <motion.div variants={itemVariants}><TagInput allTags={studioMetadata?.tags || []} label="الوسوم (Genres)" placeholder="ابحث أو أنشئ وسمًا..." selectedTags={tags} onTagsChange={(t: any) => handleFieldChange('tags', t)} categoryForCreation="Game" /></motion.div>
                            <motion.div variants={itemVariants}><CreatorInput allCreators={studioMetadata?.creators || []} role="DESIGNER" label="المصممون (اختياري)" selectedCreators={designers} onCreatorsChange={(c: any) => handleFieldChange('designers', c)} /></motion.div>
                            <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>نبذة</label> <textarea value={synopsis} onChange={(e) => handleFieldChange('synopsis', e.target.value)} className={styles.sidebarInput} rows={5} /> </motion.div> 
                        </> ) : ( <> 
                             <div><CreatorInput allCreators={studioMetadata?.creators || []} role={primaryCreatorConfig.sanityType as any} label={primaryCreatorConfig.label} selectedCreators={documentState[primaryCreatorConfig.field]} onCreatorsChange={(c: any) => handleFieldChange(primaryCreatorConfig.field, c)} /></div> 
                             <div><GameInput allGames={studioMetadata?.games || []} selectedGame={game} onGameSelect={(g: any) => handleFieldChange('game', g)} /></div> 
                             {isNews && ( <> <motion.div variants={itemVariants}><TagInput allTags={studioMetadata?.tags || []} label="التصنيف" placeholder="اختر تصنيف الخبر..." selectedTags={category ? [category] : []} onTagsChange={(newCategoryArr: any) => handleFieldChange('category', newCategoryArr[0] || null)} singleSelection={true} categoryForCreation="News" /></motion.div> <motion.div variants={itemVariants}><NewsTypeInput value={newsType || 'official'} onChange={(val) => handleFieldChange('newsType', val)} /></motion.div> </> )}
                             {isArticle && ( <> <div><TagInput allTags={studioMetadata?.tags || []} label="نوع المقال" placeholder="اختر نوع المقال..." selectedTags={category ? [category] : []} onTagsChange={(newCategoryArr: any) => handleFieldChange('category', newCategoryArr[0] || null)} singleSelection={true} categoryForCreation="Article" /></div> <div><TagInput allTags={studioMetadata?.tags || []} label="الوسوم" placeholder="ابحث أو أنشئ وسمًا..." selectedTags={tags} onTagsChange={(t: any) => handleFieldChange('tags', t)} categoryForCreation="Game" /></div> </> )}
                             {isReview && ( <div><TagInput allTags={studioMetadata?.tags || []} label="الوسوم" placeholder="ابحث أو أنشئ وسمًا..." selectedTags={tags} onTagsChange={(t: any) => handleFieldChange('tags', t)} categoryForCreation="Game"/></div> )}
                             <div><CreatorInput allCreators={studioMetadata?.creators || []} role="DESIGNER" label="المصممون (اختياري)" selectedCreators={designers} onCreatorsChange={(c: any) => handleFieldChange('designers', c)} /></div>
                        </> )}
                        
                        {isReview && (<> <motion.hr variants={itemVariants} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} /> <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>التقييم (0-10) {score <= 0 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}</label> <input type="number" value={score} onChange={(e) => handleFieldChange('score', parseFloat(e.target.value) || 0)} className={styles.sidebarInput} min="0" max="10" step="0.1" /> </motion.div> <motion.div className={styles.sidebarSection} variants={itemVariants}> <label className={styles.sidebarLabel}>الخلاصة {!verdict.trim() && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}</label> <textarea value={verdict} onChange={(e) => handleFieldChange('verdict', e.target.value)} className={styles.sidebarInput} rows={3} /> </motion.div> <motion.div variants={itemVariants}><ProsConsInput label="المحاسن" items={pros} setItems={(p: any) => handleFieldChange('pros', p)} /></motion.div> <motion.div variants={itemVariants}><ProsConsInput label="المساوئ" items={cons} setItems={(c: any) => handleFieldChange('cons', c)} /></motion.div> </>)}
                    </fieldset>

                    <ColorDictionaryManager initialMappings={colorDictionary || []} />
                    
                    <div className={styles.sidebarFooter}>
                        <motion.button onClick={handleSave} disabled={isSaveDisabled} className="primary-button" style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} title={isSaveDisabled ? (hasChanges ? 'المُعرّف غير صالح' : 'لا تغييرات للحفظ') : 'حفظ التغييرات'} animate={{ backgroundColor: saveStatus === 'success' ? '#16A34A' : 'var(--accent)', color: saveStatus === 'success' ? '#fff' : 'inherit', width: isSaving ? '44px' : '100%', borderRadius: isSaving ? '50%' : '5px', paddingLeft: isSaving ? 0 : '2.4rem', paddingRight: isSaving ? 0 : '2.4rem' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                            <AnimatePresence mode="wait">
                                {isSaving && <ButtonLoader key="loader" />}
                                {saveStatus === 'success' && <motion.span key="success" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>حُفِظ!</motion.span>}
                                {saveStatus === 'idle' && <motion.span key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{whiteSpace: 'nowrap'}}>حفظ التغييرات</motion.span>}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}


