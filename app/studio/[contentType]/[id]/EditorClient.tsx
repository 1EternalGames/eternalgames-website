// app/studio/[contentType]/[id]/EditorClient.tsx

'use client';
import { useState, useMemo, useEffect, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EditorSidebar } from './EditorSidebar';
import { EditorCanvas } from './EditorCanvas';
import { BlockToolbar } from './BlockToolbar';
import { Editor } from '@tiptap/react';
import { updateDocumentAction, publishDocumentAction, validateSlugAction } from '../../actions';
import { useToast } from '@/lib/toastStore';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { uploadFile } from './RichTextEditor';
import { UploadQuality } from '@/lib/image-optimizer';
import { tiptapToPortableText } from '../../utils/tiptapToPortableText';
import styles from './Editor.module.css';

type EditorDocument = {
    _id: string;
    _type: string;
    _updatedAt: string; // <-- Ensure this is part of the type
    title: string;
    slug?: { current: string };
    score?: number;
    verdict?: string;
    pros?: string[];
    cons?: string[];
    game?: { _id: string; title: string } | null;
    publishedAt?: string | null;
    mainImage?: { _ref: string | null; url: string | null; metadata?: any };
    authors?: any[];
    reporters?: any[];
    designers?: any[];
    tags?: any[];
    releaseDate?: string;
    platforms?: string[];
    synopsis?: string;
    tiptapContent?: any;
    content?: any;
};

const SidebarToggleIcon = () => ( <svg width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 18H3M21 12H3M21 6H3"/></svg> );
const ExitIcon = () => <svg width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const clientSlugify = (text: string): string => { if (!text) return ''; return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-'); };
const initialState = { _id: null, _type: null, title: '', slug: '', score: 0, verdict: '', pros: [], cons: [], game: null, tags: [], mainImage: { assetId: null, assetUrl: null }, authors: [], reporters: [], designers: [], publishedAt: null, isSlugManual: false, releaseDate: '', platforms: [], synopsis: '' };

function editorReducer(state: any, action: { type: string; payload: any }) {
    switch (action.type) {
        case 'INITIALIZE_STATE':
            return {
                ...action.payload,
                isSlugManual: !!action.payload.slug,
            };
        case 'UPDATE_FIELD':
            return { ...state, [action.payload.field]: action.payload.value };
        case 'UPDATE_SLUG':
            return { ...state, slug: clientSlugify(action.payload.slug), isSlugManual: action.payload.isManual };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

const generateDiffPatch = (currentState: any, sourceOfTruth: any, editorContentJson: string) => {
    const patch: Record<string, any> = {};
    const normalize = (val: any, defaultVal: any) => val ?? defaultVal;
    const compareIds = (arr1: any[], arr2: any[]) => JSON.stringify(normalize(arr1, []).map((i: any) => i._id).sort()) === JSON.stringify(normalize(arr2, []).map((i: any) => i._id).sort());

    if (normalize(currentState.title, '') !== normalize(sourceOfTruth.title, '')) patch.title = currentState.title;
    if (normalize(currentState.slug, '') !== normalize(sourceOfTruth.slug?.current, '')) patch.slug = { _type: 'slug', current: currentState.slug };
    if (normalize(currentState.score, 0) !== normalize(sourceOfTruth.score, 0)) patch.score = currentState.score;
    if (normalize(currentState.verdict, '') !== normalize(sourceOfTruth.verdict, '')) patch.verdict = currentState.verdict;
    if (normalize(currentState.releaseDate, '') !== normalize(sourceOfTruth.releaseDate, '')) patch.releaseDate = currentState.releaseDate;
    if (normalize(currentState.synopsis, '') !== normalize(sourceOfTruth.synopsis, '')) patch.synopsis = currentState.synopsis;

    if (JSON.stringify(normalize(currentState.pros, [])) !== JSON.stringify(normalize(sourceOfTruth.pros, []))) patch.pros = currentState.pros;
    if (JSON.stringify(normalize(currentState.cons, [])) !== JSON.stringify(normalize(sourceOfTruth.cons, []))) patch.cons = currentState.cons;
    if (JSON.stringify(normalize(currentState.platforms, [])) !== JSON.stringify(normalize(sourceOfTruth.platforms, []))) patch.platforms = currentState.platforms;

    if (normalize(currentState.game?._id, null) !== normalize(sourceOfTruth.game?._id, null)) patch.game = currentState.game ? { _type: 'reference', _ref: currentState.game._id } : undefined;
    if (normalize(currentState.mainImage.assetId, null) !== normalize(sourceOfTruth.mainImage?._ref, null)) patch.mainImage = currentState.mainImage.assetId ? { _type: 'image', asset: { _type: 'reference', _ref: currentState.mainImage.assetId } } : undefined;
    
    if (!compareIds(currentState.tags, (sourceOfTruth.tags || []).filter(Boolean))) patch.tags = normalize(currentState.tags, []).map((t: any) => ({ _type: 'reference', _ref: t._id, _key: t._id }));
    if (!compareIds(currentState.authors, (sourceOfTruth.authors || []).filter(Boolean))) patch.authors = normalize(currentState.authors, []).map((a: any) => ({ _type: 'reference', _ref: a._id, _key: a._id }));
    if (!compareIds(currentState.reporters, (sourceOfTruth.reporters || []).filter(Boolean))) patch.reporters = normalize(currentState.reporters, []).map((r: any) => ({ _type: 'reference', _ref: r._id, _key: r._id }));
    if (!compareIds(currentState.designers, (sourceOfTruth.designers || []).filter(Boolean))) patch.designers = normalize(currentState.designers, []).map((d: any) => ({ _type: 'reference', _ref: d._id, _key: d._id }));

    const sourceContentJson = JSON.stringify(sourceOfTruth.tiptapContent || {});
    if (sourceOfTruth._type !== 'gameRelease' && editorContentJson !== sourceContentJson) {
        patch.content = tiptapToPortableText(JSON.parse(editorContentJson));
    }

    return patch;
};


export function EditorClient({ document: initialDocument, allGames, allTags, allCreators }: { document: EditorDocument, allGames: any[], allTags: any[], allCreators: any[] }) {
    const [sourceOfTruth, setSourceOfTruth] = useState<EditorDocument>(initialDocument);
    const [state, dispatch] = useReducer(editorReducer, initialState);
    const { title, slug, isSlugManual } = state;
    const toast = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [mainImageUploadQuality, setMainImageUploadQuality] = useState<UploadQuality>('1080p');
    const [blockUploadQuality, setBlockUploadQuality] = useState<UploadQuality>('1080p');
    const [slugValidationStatus, setSlugValidationStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');
    const [slugValidationMessage, setSlugValidationMessage] = useState('جار التحقق...');
    const debouncedSlug = useDebounce(slug, 500);
    const [editorContentJson, setEditorContentJson] = useState(JSON.stringify(initialDocument.tiptapContent || {}));
    
    const patch = useMemo(() => generateDiffPatch(state, sourceOfTruth, editorContentJson), [state, sourceOfTruth, editorContentJson]);
    const hasChanges = Object.keys(patch).length > 0;
    
    useEffect(() => { if (editorInstance) editorInstance.storage.uploadQuality = blockUploadQuality; }, [blockUploadQuality, editorInstance]);
    
    // THE DEFINITIVE FIX: The dependency array now includes `_updatedAt`.
    // This ensures that after ANY successful save (draft or publish), which always changes
    // the `_updatedAt` timestamp, the form state is fully re-synchronized with the
    // authoritative data returned from the server, mimicking the publish behavior.
    useEffect(() => { 
        dispatch({ 
            type: 'INITIALIZE_STATE', 
            payload: { 
                _id: sourceOfTruth._id,
                _type: sourceOfTruth._type,
                title: sourceOfTruth.title ?? '', 
                slug: sourceOfTruth.slug?.current ?? '', 
                score: sourceOfTruth.score ?? 0, 
                verdict: sourceOfTruth.verdict ?? '', 
                pros: sourceOfTruth.pros ?? [], 
                cons: sourceOfTruth.cons ?? [], 
                game: sourceOfTruth.game || null, 
                publishedAt: sourceOfTruth.publishedAt || null, 
                mainImage: { assetId: sourceOfTruth.mainImage?._ref || null, assetUrl: sourceOfTruth.mainImage?.url || null }, 
                authors: (sourceOfTruth.authors || []).filter(Boolean), 
                reporters: (sourceOfTruth.reporters || []).filter(Boolean), 
                designers: (sourceOfTruth.designers || []).filter(Boolean), 
                tags: (sourceOfTruth.tags || []).filter(Boolean), 
                releaseDate: sourceOfTruth.releaseDate || '', 
                platforms: sourceOfTruth.platforms || [], 
                synopsis: sourceOfTruth.synopsis || '', 
            } 
        });

        const imageWidth = sourceOfTruth?.mainImage?.metadata?.dimensions?.width;
        if (imageWidth && imageWidth >= 3840) {
            setMainImageUploadQuality('4k');
        } else {
            setMainImageUploadQuality('1080p');
        }

        if (editorInstance) {
            const editorJSON = JSON.stringify(editorInstance.getJSON());
            const sourceJSON = JSON.stringify(sourceOfTruth.tiptapContent || {});
            if (editorJSON !== sourceJSON) {
                editorInstance.commands.setContent(sourceOfTruth.tiptapContent, false);
            }
        }
    }, [sourceOfTruth._id, sourceOfTruth._updatedAt, editorInstance]); // <<< THE FIX IS HERE
    
    useEffect(() => { if (editorInstance) { const updateJson = () => setEditorContentJson(JSON.stringify(editorInstance.getJSON())); editorInstance.on('update', updateJson); return () => { editorInstance.off('update', updateJson); }; } }, [editorInstance]);
    
    useEffect(() => { if (!isSlugManual && title !== sourceOfTruth.title) { dispatch({ type: 'UPDATE_SLUG', payload: { slug: clientSlugify(title), isManual: false } }); } }, [title, isSlugManual, sourceOfTruth.title]);
    
    useEffect(() => { 
        if (!state._id || !debouncedSlug) { 
            setSlugValidationStatus('invalid'); 
            setSlugValidationMessage(!state._id ? 'Waiting for document ID...' : 'المُعرّف لا يمكن أن يكون فارغًا.'); 
            return; 
        } 
        setSlugValidationStatus('pending'); 
        setSlugValidationMessage('جار التحقق...'); 
        const checkSlug = async () => { 
            const result = await validateSlugAction(debouncedSlug, state._id); 
            setSlugValidationStatus(result.isValid ? 'valid' : 'invalid'); 
            setSlugValidationMessage(result.message); 
        }; 
        checkSlug(); 
    }, [debouncedSlug, state._id]);
    
    const isDocumentValid = useMemo(() => { const { title, slug, mainImage, game, score, verdict, authors, reporters, releaseDate, platforms, synopsis } = state; const baseValid = title.trim() && slug.trim() && mainImage.assetId; if (!baseValid) return false; const type = sourceOfTruth._type; if (type === 'review') return game?._id && (authors || []).length > 0 && score > 0 && verdict.trim(); if (type === 'article') return game?._id && (authors || []).length > 0; if (type === 'news') return (reporters || []).length > 0; if (type === 'gameRelease') return releaseDate.trim() && synopsis.trim() && (platforms || []).length > 0; return false; }, [state, sourceOfTruth._type]);
    
    const saveWorkingCopy = async (): Promise<boolean> => {
        if (!hasChanges) return true;
        if (slugValidationStatus !== 'valid') { toast.error('لا يمكن الحفظ بمُعرّف غير صالح.', 'left'); return false; }
    
        const result = await updateDocumentAction(sourceOfTruth._id, patch);
    
        if (result.success && result.updatedDocument) {
            setSourceOfTruth(result.updatedDocument);
            return true;
        } else {
            toast.error(result.message || 'فشل حفظ التغييرات.', 'left');
            return false;
        }
    };
    
    const handlePublish = async (publishTime?: string | null): Promise<boolean> => {
        const didSave = await saveWorkingCopy();
        if (!didSave) {
            if (hasChanges) toast.error('يرجى حفظ التغييرات أولاً.', 'left');
            return false;
        }
        
        const result = await publishDocumentAction(sourceOfTruth._id, publishTime);
        if (result.success && result.updatedDocument) {
            setSourceOfTruth(result.updatedDocument);
            toast.success(result.message || 'تم تحديث حالة النشر بنجاح!', 'left');
            return true;
        } else {
            toast.error(result.message || 'فشل تحديث حالة النشر.', 'left');
            return false;
        }
    };
    
    useEffect(() => { if (hasChanges) { document.title = `*غير محفوظ* ${title || 'غير معنون'}`; window.onbeforeunload = () => "You have unsaved changes. Are you sure you want to leave?"; } else { document.title = title || "EternalGames الديوان"; window.onbeforeunload = null; } return () => { window.onbeforeunload = null; }; }, [hasChanges, title]);
    useEffect(() => { document.body.classList.add('editor-active'); return () => { document.body.classList.remove('editor-active'); } }, []);
    const getStatusInfo = () => { if (sourceOfTruth._type === 'gameRelease') return { text: 'إصدار', className: styles.statusPublished }; if (!state.publishedAt) return { text: 'مسودة', className: styles.statusDraft }; const date = new Date(state.publishedAt); if (date > new Date()) return { text: 'مجدولة', className: styles.statusScheduled }; return { text: 'منشورة', className: styles.statusPublished }; };
    const statusInfo = getStatusInfo();
    const isRelease = initialDocument._type === 'gameRelease';

    return (
        <div className={styles.sanctumContainer}>
            <header className={styles.editorHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.sanctumSidebarToggle} onClick={() => setIsSidebarOpen(!isSidebarOpen)}><SidebarToggleIcon /></button>
                    <a href="/studio" className={`${styles.exitButton} no-underline`}><ExitIcon />عودة للديوان</a>
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />
                    <Link href="/" className="no-underline" title="Return to Homepage" style={{ color: 'var(--text-secondary)', display: 'flex' }}>
                       <span style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '2rem', fontWeight: 800 }}>∞</span>
                    </Link>
                </div>
                <div className={styles.headerRight}>
                    <div className={`${styles.documentStatus} ${statusInfo.className}`}>{statusInfo.text}</div>
                </div>
            </header>
            <motion.div className={styles.sanctumMain} layout transition={{ type: 'spring' as const, stiffness: 400, damping: 40 }}>
                <EditorSidebar 
                    document={sourceOfTruth} 
                    isOpen={isSidebarOpen} 
                    documentState={state} 
                    dispatch={dispatch} 
                    onSave={saveWorkingCopy} 
                    hasChanges={hasChanges} 
                    onPublish={handlePublish} 
                    slugValidationStatus={slugValidationStatus} 
                    slugValidationMessage={slugValidationMessage} 
                    isDocumentValid={isDocumentValid} 
                    uploadQuality={mainImageUploadQuality} 
                    onUploadQualityChange={setMainImageUploadQuality}
                    allGames={allGames}
                    allTags={allTags}
                    allCreators={allCreators}
                />
                <EditorCanvas document={sourceOfTruth} title={title} onTitleChange={(newTitle) => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'title', value: newTitle } })} onEditorCreated={setEditorInstance} editor={editorInstance} />
            </motion.div>
            
            <AnimatePresence>
                {!isRelease && (
                    <BlockToolbar 
                        editor={editorInstance}
                        onFileUpload={(file) => {
                            if (editorInstance) {
                                uploadFile(file, editorInstance, toast, blockUploadQuality);
                            }
                        }}
                        uploadQuality={blockUploadQuality}
                        onUploadQualityChange={setBlockUploadQuality}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}