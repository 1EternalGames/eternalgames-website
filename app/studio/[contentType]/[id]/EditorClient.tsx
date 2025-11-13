// app/studio/[contentType]/[id]/EditorClient.tsx

'use client';
import { useState, useMemo, useEffect, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorSidebar } from './EditorSidebar';
import { EditorCanvas } from './EditorCanvas';
import { BlockToolbar } from './BlockToolbar';
import { MobileViewToggle } from './editor-components/MobileViewToggle';
import { MobileBlockCreator } from './editor-components/MobileBlockCreator';
import { Editor } from '@tiptap/react';
import { updateDocumentAction, publishDocumentAction, validateSlugAction } from '../../actions';
import { useToast } from '@/lib/toastStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useBodyClass } from '@/hooks/useBodyClass';
import { uploadFile } from './RichTextEditor';
import { UploadQuality } from '@/lib/image-optimizer';
import { tiptapToPortableText } from '../../utils/tiptapToPortableText';
import { useEditorStore } from '@/lib/editorStore';
import styles from './Editor.module.css';
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';

type EditorDocument = {
    _id: string; _type: string; _updatedAt: string; title: string; slug?: { current: string }; score?: number; verdict?: string; pros?: string[]; cons?: string[]; game?: { _id: string; title: string } | null; publishedAt?: string | null; mainImage?: { _ref: string | null; url: string | null; metadata?: any }; authors?: any[]; reporters?: any[]; designers?: any[]; tags?: any[]; releaseDate?: string; platforms?: string[]; synopsis?: string; tiptapContent?: any; content?: any; category?: { _id: string; title: string } | null;
};

const clientSlugify = (text: string): string => { if (!text) return ''; return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-'); };

const initialState = { _id: null, _type: null, title: '', slug: '', score: 0, verdict: '', pros: [], cons: [], game: null, tags: [], mainImage: { assetId: null, assetUrl: null }, authors: [], reporters: [], designers: [], publishedAt: null, isSlugManual: false, releaseDate: '', platforms: [], synopsis: '', category: null };

function editorReducer(state: any, action: { type: string; payload: any }) {
    switch (action.type) {
        case 'INITIALIZE_STATE': return { ...state, ...action.payload, isSlugManual: !!action.payload.slug, };
        case 'UPDATE_FIELD': return { ...state, [action.payload.field]: action.payload.value };
        case 'UPDATE_SLUG': return { ...state, slug: clientSlugify(action.payload.slug), isManual: action.payload.isManual };
        default: throw new Error(`Unhandled action type: ${action.type}`);
    }
}

const generateDiffPatch = (currentState: any, sourceOfTruth: any, editorContentJson: string) => {
    const patch: Record<string, any> = {};
    const normalize = (val: any, defaultVal: any) => val ?? defaultVal;
    const compareIds = (arr1: any[], arr2: any[]) => JSON.stringify(normalize(arr1, []).map((i: any) => i._id).sort()) === JSON.stringify(normalize(arr2, []).map((i: any) => i._id).sort());
    if (normalize(currentState.title, '') !== normalize(sourceOfTruth.title, '')) patch.title = currentState.title;
    // MODIFICATION: Do not patch slug for gameRelease
    if (sourceOfTruth._type !== 'gameRelease' && normalize(currentState.slug, '') !== normalize(sourceOfTruth.slug?.current, '')) patch.slug = { _type: 'slug', current: currentState.slug };
    if (normalize(currentState.score, 0) !== normalize(sourceOfTruth.score, 0)) patch.score = currentState.score;
    if (normalize(currentState.verdict, '') !== normalize(sourceOfTruth.verdict, '')) patch.verdict = currentState.verdict;
    if (normalize(currentState.releaseDate, '') !== normalize(sourceOfTruth.releaseDate, '')) patch.releaseDate = currentState.releaseDate;
    if (normalize(currentState.synopsis, '') !== normalize(sourceOfTruth.synopsis, '')) patch.synopsis = currentState.synopsis;
    if (normalize(currentState.category?._id, null) !== normalize(sourceOfTruth.category?._id, null)) {
        patch.category = currentState.category ? { _type: 'reference', _ref: currentState.category._id } : undefined;
    }
    if (JSON.stringify(normalize(currentState.pros, [])) !== JSON.stringify(normalize(sourceOfTruth.pros, []))) patch.pros = currentState.pros;
    if (JSON.stringify(normalize(currentState.cons, [])) !== JSON.stringify(normalize(sourceOfTruth.cons, []))) patch.cons = currentState.cons;
    if (JSON.stringify(normalize(currentState.platforms, [])) !== JSON.stringify(normalize(sourceOfTruth.platforms, []))) patch.platforms = currentState.platforms;
    if (normalize(currentState.game?._id, null) !== normalize(sourceOfTruth.game?._id, null)) patch.game = currentState.game ? { _type: 'reference', _ref: currentState.game._id } : undefined;
    if (normalize(currentState.mainImage.assetId, null) !== normalize(sourceOfTruth.mainImage?._ref, null)) patch.mainImage = currentState.mainImage.assetId ? { _type: 'image', asset: { _type: 'reference', _ref: currentState.mainImage.assetId } } : undefined;
    if (!compareIds(currentState.tags, (sourceOfTruth.tags || []).filter(Boolean))) patch.tags = normalize(currentState.tags, []).map((t: any) => ({ _type: 'reference', _ref: t._id, _key: t._id }));
    if (!compareIds(currentState.authors, (sourceOfTruth.authors || []).filter(Boolean))) patch.authors = normalize(currentState.authors, []).map((a: any) => ({ _type: 'reference', _ref: a._id, _key: a._id }));
    if (!compareIds(currentState.reporters, (sourceOfTruth.reporters || []).filter(Boolean))) patch.reporters = normalize(currentState.reporters, []).map((r: any) => ({ _type: 'reference', _ref: r._id, _key: r._id }));
    if (!compareIds(currentState.designers, (sourceOfTruth.designers || []).filter(Boolean))) patch.designers = normalize(currentState.designers, []).map((d: any) => ({ _type: 'reference', _ref: d._id, _key: d._id }));
    
    // THE DEFINITIVE FIX FOR FLICKER: Compare against sourceOfTruth.content, not tiptapContent
    const sourceContentSanity = sourceOfTruth.content || []; 
    const currentContentSanity = tiptapToPortableText(JSON.parse(editorContentJson));
    if (sourceOfTruth._type !== 'gameRelease' && JSON.stringify(currentContentSanity) !== JSON.stringify(sourceContentSanity)) {
        patch.content = currentContentSanity;
    }

    return patch;
};


export function EditorClient({ document: initialDocument, allGames, allTags, allCreators }: { document: EditorDocument, allGames: any[], allTags: any[], allCreators: any[] }) {
    const [sourceOfTruth, setSourceOfTruth] = useState<EditorDocument>(initialDocument);
    const [state, dispatch] = useReducer(editorReducer, initialState);
    const { title, slug, isSlugManual } = state;
    const toast = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [mainImageUploadQuality, setMainImageUploadQuality] = useState<UploadQuality>('1080p');
    const { blockUploadQuality, setBlockUploadQuality, setEditorActive, setLiveUrl } = useEditorStore();
    const [slugValidationStatus, setSlugValidationStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');
    const [slugValidationMessage, setSlugValidationMessage] = useState('جارٍ التحقق...');
    const debouncedSlug = useDebounce(slug, 500);
    const [editorContentJson, setEditorContentJson] = useState(JSON.stringify(initialDocument.tiptapContent || {}));
    
    useBodyClass('sidebar-open', isSidebarOpen && isMobile);
    
    useEffect(() => {
        setEditorActive(true);
        return () => {
            setEditorActive(false);
            setLiveUrl(null);
        };
    }, [setEditorActive, setLiveUrl]);

    useEffect(() => {
        const { _type, slug: docSlug, publishedAt } = sourceOfTruth;
        const isPublished = publishedAt && new Date(publishedAt) <= new Date();

        if (isPublished && docSlug?.current && _type !== 'gameRelease') {
            const contentTypePlural = _type === 'review' ? 'reviews' : _type === 'article' ? 'articles' : 'news';
            const url = `/${contentTypePlural}/${docSlug.current}`;
            setLiveUrl(url);
        } else {
            setLiveUrl(null);
        }
    }, [sourceOfTruth, setLiveUrl]);
    
    useEffect(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            const originalContent = viewport.getAttribute('content');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            return () => {
                if (originalContent) {
                    viewport.setAttribute('content', originalContent);
                }
            };
        }
    }, []);

    useEffect(() => { const handleResize = () => { const mobile = window.innerWidth <= 1024; setIsMobile(mobile); if (!mobile) setIsSidebarOpen(true); }; handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
    const patch = useMemo(() => generateDiffPatch(state, sourceOfTruth, editorContentJson), [state, sourceOfTruth, editorContentJson]);
    const hasChanges = Object.keys(patch).length > 0;
    useEffect(() => { if (editorInstance) editorInstance.storage.uploadQuality = blockUploadQuality; }, [blockUploadQuality, editorInstance]);
    
    useEffect(() => { 
        const currentSlug = sourceOfTruth.slug?.current ?? '';
        dispatch({ 
            type: 'INITIALIZE_STATE', 
            payload: { 
                _id: sourceOfTruth._id, 
                _type: sourceOfTruth._type, 
                title: sourceOfTruth.title ?? '', 
                slug: currentSlug, 
                score: sourceOfTruth.score ?? 0, 
                verdict: sourceOfTruth.verdict ?? '', 
                pros: sourceOfTruth.pros ?? [], 
                cons: sourceOfTruth.cons ?? [], 
                game: sourceOfTruth.game || null, 
                publishedAt: sourceOfTruth.publishedAt || null, 
                mainImage: { 
                    assetId: sourceOfTruth.mainImage?._ref || null, 
                    assetUrl: sourceOfTruth.mainImage?.url || null 
                }, 
                authors: (sourceOfTruth.authors || []).filter(Boolean), 
                reporters: (sourceOfTruth.reporters || []).filter(Boolean), 
                designers: (sourceOfTruth.designers || []).filter(Boolean), 
                tags: (sourceOfTruth.tags || []).filter(Boolean), 
                releaseDate: sourceOfTruth.releaseDate || '', 
                platforms: sourceOfTruth.platforms || [], 
                synopsis: sourceOfTruth.synopsis || '', 
                category: sourceOfTruth.category || null, 
            } 
        }); 
        
        const imageWidth = sourceOfTruth?.mainImage?.metadata?.dimensions?.width; 
        if (imageWidth && imageWidth >= 3840) { 
            setMainImageUploadQuality('4k'); 
        } else { 
            setMainImageUploadQuality('1080p'); 
        } 
        
        if (editorInstance) { 
            const freshTiptapContent = portableTextToTiptap(sourceOfTruth.content || []);
            const editorJSON = JSON.stringify(editorInstance.getJSON()); 
            const sourceJSON = JSON.stringify(freshTiptapContent); 
            
            if (editorJSON !== sourceJSON) { 
                editorInstance.commands.setContent(freshTiptapContent, false); 
            } 
        } 
    }, [sourceOfTruth._id, sourceOfTruth._updatedAt, editorInstance, sourceOfTruth.slug]);

    useEffect(() => { if (editorInstance) { const updateJson = () => setEditorContentJson(JSON.stringify(editorInstance.getJSON())); editorInstance.on('update', updateJson); return () => { editorInstance.off('update', updateJson); }; } }, [editorInstance]);
    useEffect(() => { if (!isSlugManual && title !== sourceOfTruth.title) { dispatch({ type: 'UPDATE_SLUG', payload: { slug: clientSlugify(title), isManual: false } }); } }, [title, isSlugManual, sourceOfTruth.title]);
    useEffect(() => {
        if (state._type === 'gameRelease') {
            setSlugValidationStatus('valid');
            setSlugValidationMessage('');
            return;
        }
        if (!state._id || !debouncedSlug) { setSlugValidationStatus('invalid'); setSlugValidationMessage(!state._id ? 'بانتظار مُعرِّف الوثيقة...' : 'لا يكُن المُعرِّفُ خاويًا.'); return; } setSlugValidationStatus('pending'); setSlugValidationMessage('جارٍ التحقق...'); const checkSlug = async () => { const result = await validateSlugAction(debouncedSlug, state._id); setSlugValidationStatus(result.isValid ? 'valid' : 'invalid'); setSlugValidationMessage(result.message); }; checkSlug();
    }, [debouncedSlug, state._id, state._type]);
    const isDocumentValid = useMemo(() => { const { title, slug, mainImage, game, score, verdict, authors, reporters, releaseDate, platforms, synopsis, category } = state; const type = sourceOfTruth._type; const baseValid = title.trim() && mainImage.assetId; if (!baseValid) return false; if (type !== 'gameRelease' && !slug.trim()) return false; if (type === 'review') return game?._id && (authors || []).length > 0 && score > 0 && verdict.trim(); if (type === 'article') return game?._id && (authors || []).length > 0; if (type === 'news') return (reporters || []).length > 0 && category; if (type === 'gameRelease') return game?._id && releaseDate.trim() && synopsis.trim() && (platforms || []).length > 0; return false; }, [state, sourceOfTruth._type]);
    
    const saveWorkingCopy = async (): Promise<boolean> => { 
        if (!hasChanges) return true; 
        if (sourceOfTruth._type !== 'gameRelease' && slugValidationStatus !== 'valid') { 
            toast.error('لا يمكن الحفظ بمُعرِّف غير صالح.', 'left'); 
            return false; 
        } 

        // Optimistically update the source of truth BEFORE the server call
        const optimisticSOT: EditorDocument = {
            ...sourceOfTruth,
            title: state.title,
            slug: { current: state.slug },
            score: state.score,
            verdict: state.verdict,
            pros: state.pros,
            cons: state.cons,
            game: state.game,
            tags: state.tags,
            mainImage: state.mainImage.assetId ? { _ref: state.mainImage.assetId, url: state.mainImage.assetUrl } : undefined,
            authors: state.authors,
            reporters: state.reporters,
            designers: state.designers,
            releaseDate: state.releaseDate,
            platforms: state.platforms,
            synopsis: state.synopsis,
            category: state.category,
            content: tiptapToPortableText(JSON.parse(editorContentJson)),
            _updatedAt: new Date().toISOString(), // Mark as updated
        };
        
        const result = await updateDocumentAction(sourceOfTruth._id, patch); 
        
        if (result.success && result.updatedDocument) { 
            // THE DEFINITIVE FIX: Replace the server response with the optimistic state
            // to prevent the flicker, but use the server's _updatedAt for sync.
            setSourceOfTruth({ ...optimisticSOT, _updatedAt: result.updatedDocument._updatedAt });
            return true; 
        } else { 
            toast.error(result.message || 'أخفق حفظ التغييرات.', 'left'); 
            // On failure, we don't revert, allowing the user to try saving again.
            return false; 
        } 
    };
    
    const handlePublish = async (publishTime?: string | null): Promise<boolean> => { const didSave = await saveWorkingCopy(); if (!didSave) { if (hasChanges) toast.error('احفظ التغييرات أولاً.', 'left'); return false; } const result = await publishDocumentAction(sourceOfTruth._id, publishTime); if (result.success && result.updatedDocument) { setSourceOfTruth(result.updatedDocument); toast.success(result.message || 'تجددت حالة النشر!', 'left'); return true; } else { toast.error(result.message || 'أخفق تحديث الحالة.', 'left'); return false; } };
    useEffect(() => { if (hasChanges) { document.title = `*لم يُحفظ* ${title || 'بلا عنوان'}`; window.onbeforeunload = () => "أَتَغادرُ وما كتبت لم يُحفظ؟"; } else { document.title = title || "EternalGames الديوان"; window.onbeforeunload = null; } return () => { window.onbeforeunload = null; }; }, [hasChanges, title]);
    useEffect(() => { document.body.classList.add('editor-active'); return () => { document.body.classList.remove('editor-active'); } }, []);
    
    const isRelease = initialDocument._type === 'gameRelease';

    return (
        <div className={styles.sanctumContainer}>
            <div className={styles.sanctumMain}>
                <motion.div
                    style={{
                        position: isMobile ? 'absolute' : 'relative',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: isMobile ? '100%' : 'auto',
                        pointerEvents: isMobile && !isSidebarOpen ? 'none' : 'auto',
                    }}
                    animate={{ x: isMobile ? (isSidebarOpen ? '0%' : '100%') : '0%' }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
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
                        mainImageUploadQuality={mainImageUploadQuality} 
                        onMainImageUploadQualityChange={setMainImageUploadQuality} 
                        allGames={allGames} 
                        allTags={allTags} 
                        allCreators={allCreators} 
                    />
                </motion.div>
                <motion.div
                    style={{
                        position: isMobile ? 'absolute' : 'relative',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '100%',
                        pointerEvents: isMobile && isSidebarOpen ? 'none' : 'auto',
                    }}
                    animate={{ x: isMobile ? (isSidebarOpen ? '-100%' : '0%') : '0%' }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
                    <EditorCanvas 
                        document={sourceOfTruth} 
                        title={title} 
                        onTitleChange={(newTitle) => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'title', value: newTitle } })} 
                        onEditorCreated={setEditorInstance} 
                        editor={editorInstance} 
                    />
                </motion.div>
            </div>
            
            <AnimatePresence>
                {!isRelease && !isMobile && (
                    <BlockToolbar key="block-toolbar-desktop" editor={editorInstance} onFileUpload={(file) => { if (editorInstance) { uploadFile(file, editorInstance, toast, blockUploadQuality); } }} uploadQuality={blockUploadQuality} onUploadQualityChange={setBlockUploadQuality} />
                )}
                {!isRelease && isMobile && !isSidebarOpen && (
                    <MobileBlockCreator key="block-creator-mobile" editor={editorInstance} onFileUpload={(file) => { if (editorInstance) { uploadFile(file, editorInstance, toast, blockUploadQuality); } }} />
                )}
            </AnimatePresence>
             {isMobile && (
                <MobileViewToggle isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            )}
        </div>
    );
}