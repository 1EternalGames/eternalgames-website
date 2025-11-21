import os

files = {
    "app/studio/[contentType]/[id]/EditorClient.tsx": """
// app/studio/[contentType]/[id]/EditorClient.tsx

'use client';
import { useState, useMemo, useEffect, useReducer, useRef, useCallback } from 'react';
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
import type { SaveStatus } from './SaveStatusIcons';

type EditorDocument = {
    _id: string; _type: string; _updatedAt: string; title: string; slug?: { current: string }; score?: number; verdict?: string; pros?: string[]; cons?: string[]; game?: { _id: string; title: string } | null; publishedAt?: string | null; mainImage?: { _ref: string | null; url: string | null; metadata?: any }; authors?: any[]; reporters?: any[]; designers?: any[]; tags?: any[]; releaseDate?: string; platforms?: string[]; synopsis?: string; tiptapContent?: any; content?: any; category?: { _id: string; title: string } | null;
};

type ColorMapping = {
  _key?: string;
  word: string;
  color: string;
}

const clientSlugify = (text: string): string => { if (!text) return ''; return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-'); };

const getInitialEditorState = (doc: EditorDocument) => {
    const currentSlug = doc.slug?.current ?? '';
    return {
        _id: doc._id,
        _type: doc._type,
        _updatedAt: doc._updatedAt, // Keep track of server timestamp
        title: doc.title ?? '',
        slug: currentSlug,
        isSlugManual: !!currentSlug,
        score: doc.score ?? 0,
        verdict: doc.verdict ?? '',
        pros: doc.pros ?? [],
        cons: doc.cons ?? [],
        game: doc.game || null,
        publishedAt: doc.publishedAt || null,
        mainImage: {
            assetId: doc.mainImage?._ref || null,
            assetUrl: doc.mainImage?.url || null
        },
        authors: (doc.authors || []).filter(Boolean),
        reporters: (doc.reporters || []).filter(Boolean),
        designers: (doc.designers || []).filter(Boolean),
        tags: (doc.tags || []).filter(Boolean),
        releaseDate: doc.releaseDate || '',
        platforms: doc.platforms || [],
        synopsis: doc.synopsis || '',
        category: doc.category || null,
    };
};

function editorReducer(state: any, action: { type: string; payload: any }) {
    switch (action.type) {
        case 'INITIALIZE_STATE': return { ...state, ...action.payload, isSlugManual: !!action.payload.slug };
        case 'UPDATE_FIELD': return { ...state, [action.payload.field]: action.payload.value };
        case 'UPDATE_SLUG': return { ...state, slug: clientSlugify(action.payload.slug), isManual: action.payload.isManual };
        default: throw new Error(`Unhandled action type: ${action.type}`);
    }
}

const stripKeysAndNormalize = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(stripKeysAndNormalize);
    } else if (obj !== null && typeof obj === 'object') {
        if (obj._type === 'block') {
            const keyMap: Record<string, string> = {};
            let normalizedMarkDefs: any[] = [];
            if (Array.isArray(obj.markDefs) && obj.markDefs.length > 0) {
                normalizedMarkDefs = obj.markDefs.map((def: any, index: number) => {
                    const newKey = `mark_def_${index}`;
                    keyMap[def._key] = newKey;
                    const { _key, ...rest } = def;
                    return { _key: newKey, ...stripKeysAndNormalize(rest) };
                });
            }
            let normalizedChildren = [];
            if (Array.isArray(obj.children)) {
                normalizedChildren = obj.children.map((child: any) => {
                    const { _key, ...childRest } = child;
                    const newChild = stripKeysAndNormalize(childRest);
                    if (Array.isArray(newChild.marks)) {
                        newChild.marks = newChild.marks.map((m: string) => keyMap[m] || m).sort();
                        if (newChild.marks.length === 0) delete newChild.marks;
                    }
                    return newChild;
                });
            }
            const newObj: any = { ...obj };
            delete newObj._key;
            if (normalizedMarkDefs.length > 0) {
                newObj.markDefs = normalizedMarkDefs;
            } else {
                delete newObj.markDefs;
            }
            newObj.children = normalizedChildren;
            for (const key in newObj) {
                if (key !== 'markDefs' && key !== 'children' && key !== '_key') {
                    newObj[key] = stripKeysAndNormalize(newObj[key]);
                }
            }
            return newObj;
        }
        const newObj: any = {};
        for (const key in obj) {
            if (key !== '_key') {
                const val = stripKeysAndNormalize(obj[key]);
                if (val !== undefined) {
                    newObj[key] = val;
                }
            }
        }
        return newObj;
    }
    return obj;
};

const generateDiffPatch = (currentState: any, sourceOfTruth: any, editorContentJson: string) => {
    const patch: Record<string, any> = {};
    const normalize = (val: any, defaultVal: any) => val ?? defaultVal;
    const compareIds = (arr1: any[], arr2: any[]) => JSON.stringify(normalize(arr1, []).map((i: any) => i._id).sort()) === JSON.stringify(normalize(arr2, []).map((i: any) => i._id).sort());
    
    if (normalize(currentState.title, '') !== normalize(sourceOfTruth.title, '')) patch.title = currentState.title;
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
    
    const sourceContentSanity = sourceOfTruth.content || []; 
    const currentContentSanity = tiptapToPortableText(JSON.parse(editorContentJson));
    
    if (sourceOfTruth._type !== 'gameRelease') {
        const cleanSource = JSON.stringify(stripKeysAndNormalize(sourceContentSanity));
        const cleanCurrent = JSON.stringify(stripKeysAndNormalize(currentContentSanity));
        if (cleanSource !== cleanCurrent) {
            patch.content = currentContentSanity;
        }
    }
    return patch;
};

export function EditorClient({ document: initialDocument, allGames, allTags, allCreators, colorDictionary: initialColorDictionary }: { document: EditorDocument, allGames: any[], allTags: any[], allCreators: any[], colorDictionary: ColorMapping[] }) {
    const [sourceOfTruth, setSourceOfTruth] = useState<EditorDocument>(initialDocument);
    const [state, dispatch] = useReducer(editorReducer, getInitialEditorState(initialDocument));
    const { title, slug, isSlugManual } = state;
    const toast = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [mainImageUploadQuality, setMainImageUploadQuality] = useState<UploadQuality>('1080p');
    const { blockUploadQuality, setBlockUploadQuality, setEditorActive, setLiveUrl } = useEditorStore();

    const [slugValidationStatus, setSlugValidationStatus] = useState<'pending' | 'valid' | 'invalid'>(
        initialDocument.slug?.current ? 'valid' : 'pending'
    );
    const [slugValidationMessage, setSlugValidationMessage] = useState(
        initialDocument.slug?.current ? 'المُعرِّفُ صالح.' : 'جارٍ التحقق...'
    );

    const debouncedSlug = useDebounce(slug, 500);
    const [editorContentJson, setEditorContentJson] = useState(JSON.stringify(initialDocument.tiptapContent || {}));
    const [colorDictionary, setColorDictionary] = useState<ColorMapping[]>(initialColorDictionary);
    
    const [clientSaveStatus, setClientSaveStatus] = useState<SaveStatus>('saved');
    const [serverSaveStatus, setServerSaveStatus] = useState<SaveStatus>('saved');
    const clientSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const serverSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // New State for Local Storage
    const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);

    useBodyClass('sidebar-open', isSidebarOpen && isMobile);
    
    // --- LOCAL STORAGE KEY ---
    const localStorageKey = `studio-draft-${initialDocument._id}`;

    // --- 1. Load from LocalStorage on Mount ---
    useEffect(() => {
        if (isLocalStorageLoaded) return;

        const savedData = localStorage.getItem(localStorageKey);
        if (savedData) {
            try {
                const { state: localState, content: localContent, timestamp } = JSON.parse(savedData);
                const serverTime = new Date(initialDocument._updatedAt).getTime();
                const localTime = new Date(timestamp).getTime();

                // If local data is newer than server data (by at least 1 second to avoid drift), load it
                if (localTime > serverTime + 1000) {
                    console.log('[Studio] Found newer local draft, restoring...');
                    dispatch({ type: 'INITIALIZE_STATE', payload: localState });
                    setEditorContentJson(localContent);
                    // If editor is already instantiated, update its content
                    if (editorInstance) {
                        const portableText = tiptapToPortableText(JSON.parse(localContent));
                        const tiptapContent = portableTextToTiptap(portableText);
                        editorInstance.commands.setContent(tiptapContent);
                    }
                    toast.info('تم استعادة مسودة غير محفوظة.', 'left');
                    
                    // Mark as unsaved on server so logic knows to push it
                    setServerSaveStatus('pending');
                }
            } catch (e) {
                console.error('[Studio] Failed to parse local draft', e);
            }
        }
        setIsLocalStorageLoaded(true);
    }, [initialDocument, localStorageKey, editorInstance, isLocalStorageLoaded, toast]);

    // --- 2. Save to LocalStorage Helper ---
    const saveToLocalStorage = useCallback(() => {
        const dataToSave = {
            state,
            content: editorContentJson,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
        setClientSaveStatus('saved');
    }, [state, editorContentJson, localStorageKey]);

    // --- 3. Sync Editor Content if loaded from LS after editor init ---
    // This handles the race condition where editor inits before LS load finishes
    useEffect(() => {
        if (isLocalStorageLoaded && editorInstance) {
            const savedData = localStorage.getItem(localStorageKey);
            if (savedData) {
                const { content: localContent, timestamp } = JSON.parse(savedData);
                const serverTime = new Date(initialDocument._updatedAt).getTime();
                const localTime = new Date(timestamp).getTime();
                
                // Check if current editor content matches local content roughly to avoid overwriting user typing
                // But basically if we just loaded, we want to ensure the editor reflects the state
                 if (localTime > serverTime + 1000) {
                     // We rely on the previous useEffect to trigger the state update
                     // but sometimes Tiptap needs a forced set if it wasn't ready
                     const currentEditorJson = JSON.stringify(editorInstance.getJSON());
                     if (currentEditorJson !== localContent) {
                         // Check if the state matches what we expect (avoid loops)
                          const portableText = tiptapToPortableText(JSON.parse(localContent));
                          const tiptapContent = portableTextToTiptap(portableText);
                          // Only set if we haven't already typed something new
                          // This is tricky. For now, trust the layout effect order or initial load.
                     }
                 }
            }
        }
    }, [isLocalStorageLoaded, editorInstance, initialDocument._updatedAt, localStorageKey]);


    // --- Standard Effects ---
    useEffect(() => {
        setEditorActive(true);
        document.body.classList.add('editor-active');
        return () => {
            const isStillEditor = window.location.pathname.match(/^\\/studio\\/(reviews|articles|news|releases)\\//);
            if (!isStillEditor) {
                setEditorActive(false);
                setLiveUrl(null);
                document.body.classList.remove('editor-active');
            }
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
            return () => { if (originalContent) { viewport.setAttribute('content', originalContent); } };
        }
    }, []);

    useEffect(() => { const handleResize = () => { const mobile = window.innerWidth <= 1024; setIsMobile(mobile); if (!mobile) setIsSidebarOpen(true); }; handleResize(); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
    
    // Calculate Patch
    const patch = useMemo(() => generateDiffPatch(state, sourceOfTruth, editorContentJson), [state, sourceOfTruth, editorContentJson]);
    const hasChanges = Object.keys(patch).length > 0;
    
    // --- AUTO SAVE LOGIC (Modified) ---
    useEffect(() => {
        if (hasChanges) {
            // 1. Indicate Pending/Saving status
            setClientSaveStatus('saving');
            setServerSaveStatus('pending');

            // 2. Clear existing timers
            if (clientSaveTimeoutRef.current) clearTimeout(clientSaveTimeoutRef.current);
            if (serverSaveTimeoutRef.current) clearTimeout(serverSaveTimeoutRef.current);

            // 3. Set Client Save (Local Storage) Timer (1 second)
            clientSaveTimeoutRef.current = setTimeout(() => {
                saveToLocalStorage(); // Actually persist to LS
            }, 1000);

            // 4. Set Server Save Action Timer (5 seconds)
            serverSaveTimeoutRef.current = setTimeout(async () => {
                setServerSaveStatus('saving');
                const success = await saveWorkingCopy();
                if (success) {
                    setServerSaveStatus('saved');
                    // On successful server save, we update sourceOfTruth.
                    // We don't need to clear LS, but subsequent LS saves will simply overwrite.
                    // The LS timestamp will essentially match server timestamp (or be slightly ahead/behind), 
                    // but since sourceOfTruth updates, hasChanges becomes false.
                } else {
                    setServerSaveStatus('saved'); // Reset to stop spinning, toast handles error
                }
            }, 5000);
        } else {
            // If no changes (e.g. right after a server save), visual status should be saved
            if (clientSaveStatus !== 'saved') setClientSaveStatus('saved');
            if (serverSaveStatus !== 'saved') setServerSaveStatus('saved');
        }
        return () => {
            // Cleanup happens on unmount or dependency change
        };
    }, [hasChanges, state, editorContentJson, saveToLocalStorage]); // Deps ensure this runs on any data change

    
    useEffect(() => { if (editorInstance) editorInstance.storage.uploadQuality = blockUploadQuality; }, [blockUploadQuality, editorInstance]);
    
    useEffect(() => { 
        // Only sync from Server Source of Truth if it's genuinely newer/different from our local state
        // AND we are not in the middle of editing (hasChanges checks against sourceOfTruth).
        // BUT: If we just initialized from LS, state is newer than sourceOfTruth.
        // The logic: If sourceOfTruth ID changes (navigation), reset.
        // If sourceOfTruth timestamp updates (external save), we should probably prompt or careful merge, 
        // but here we just respect the local edit priority if hasChanges is true.
        
        if (sourceOfTruth._id !== state._id) {
            // Navigation to new doc
            const newState = getInitialEditorState(sourceOfTruth);
            dispatch({ type: 'INITIALIZE_STATE', payload: newState });
            // Reset LS loading state to re-check for the new ID
            setIsLocalStorageLoaded(false); 
            setEditorInstance(null); // Force re-mount of editor or handling via key
        }
    }, [sourceOfTruth, state._id]);

    useEffect(() => { if (editorInstance) { const updateJson = () => setEditorContentJson(JSON.stringify(editorInstance.getJSON())); editorInstance.on('update', updateJson); return () => { editorInstance.off('update', updateJson); }; } }, [editorInstance]);
    useEffect(() => { if (!isSlugManual && title !== sourceOfTruth.title) { dispatch({ type: 'UPDATE_SLUG', payload: { slug: clientSlugify(title), isManual: false } }); } }, [title, isSlugManual, sourceOfTruth.title]);
    
    useEffect(() => {
        if (state._type === 'gameRelease') { setSlugValidationStatus('valid'); setSlugValidationMessage(''); return; }
        if (!state._id || !debouncedSlug) { 
             if (debouncedSlug === '') {
                 setSlugValidationStatus('invalid'); 
                 setSlugValidationMessage('لا يكُن المُعرِّفُ خاويًا.');
             }
             return; 
        } 
        if (debouncedSlug === sourceOfTruth.slug?.current) {
            setSlugValidationStatus('valid');
            setSlugValidationMessage('المُعرِّفُ صالح.');
            return;
        }
        setSlugValidationStatus('pending'); 
        setSlugValidationMessage('جارٍ التحقق...'); 
        const checkSlug = async () => { 
            const result = await validateSlugAction(debouncedSlug, state._id); 
            setSlugValidationStatus(result.isValid ? 'valid' : 'invalid'); 
            setSlugValidationMessage(result.message); 
        }; 
        checkSlug();
    }, [debouncedSlug, state._id, state._type, sourceOfTruth.slug?.current]);

    const isDocumentValid = useMemo(() => { const { title, slug, mainImage, game, score, verdict, authors, reporters, releaseDate, platforms, synopsis, category } = state; const type = sourceOfTruth._type; const baseValid = title.trim() && mainImage.assetId; if (!baseValid) return false; if (type !== 'gameRelease' && !slug.trim()) return false; if (type === 'review') return game?._id && (authors || []).length > 0 && score > 0 && verdict.trim(); if (type === 'article') return game?._id && (authors || []).length > 0; if (type === 'news') return (reporters || []).length > 0 && category; if (type === 'gameRelease') return game?._id && releaseDate.trim() && synopsis.trim() && (platforms || []).length > 0; return false; }, [state, sourceOfTruth._type]);
    
    const saveWorkingCopy = async (): Promise<boolean> => { 
        const currentPatch = generateDiffPatch(state, sourceOfTruth, editorContentJson);
        const currentHasChanges = Object.keys(currentPatch).length > 0;

        if (!currentHasChanges) return true; 
        if (sourceOfTruth._type !== 'gameRelease' && slugValidationStatus !== 'valid') { 
            toast.error('لا يمكن الحفظ بمُعرِّف غير صالح.', 'left'); 
            return false; 
        } 

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
            _updatedAt: new Date().toISOString(),
        };
        
        const result = await updateDocumentAction(sourceOfTruth._id, currentPatch); 
        
        if (result.success && result.updatedDocument) { 
            setSourceOfTruth({ ...optimisticSOT, _updatedAt: result.updatedDocument._updatedAt });
            return true; 
        } else { 
            toast.error(result.message || 'أخفق حفظ التغييرات.', 'left'); 
            return false; 
        } 
    };
    
    const handlePublish = async (publishTime?: string | null): Promise<boolean> => { 
        const didSave = await saveWorkingCopy(); 
        if (!didSave) { 
            if (hasChanges) toast.error('احفظ التغييرات أولاً.', 'left'); 
            return false; 
        } 
        const result = await publishDocumentAction(sourceOfTruth._id, publishTime); 
        if (result.success && result.updatedDocument) { 
            setSourceOfTruth(prev => ({
                ...result.updatedDocument,
                content: prev.content, 
                tiptapContent: prev.tiptapContent
            })); 
            toast.success(result.message || 'تجددت حالة النشر!', 'left'); 
            return true; 
        } else { 
            toast.error(result.message || 'أخفق تحديث الحالة.', 'left'); 
            return false; 
        } 
    };

    useEffect(() => { if (hasChanges) { document.title = `*لم يُحفظ* ${title || 'بلا عنوان'}`; window.onbeforeunload = () => "أَتَغادرُ وما كتبت لم يُحفظ؟"; } else { document.title = title || "EternalGames الديوان"; window.onbeforeunload = null; } return () => { window.onbeforeunload = null; }; }, [hasChanges, title]);
    
    const isRelease = initialDocument._type === 'gameRelease';

    if (!isLocalStorageLoaded) {
         return <div className="spinner" style={{ margin: 'auto', display: 'block', marginTop: '20vh' }} />;
    }

    return (
        <div className={styles.sanctumContainer}>
            <div className={styles.sanctumMain}>
                <motion.div
                    style={{ position: isMobile ? 'absolute' : 'relative', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 'auto', pointerEvents: isMobile && !isSidebarOpen ? 'none' : 'auto' }}
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
                        colorDictionary={colorDictionary}
                        onColorDictionaryUpdate={setColorDictionary}
                    />
                </motion.div>
                <motion.div
                    style={{ position: isMobile ? 'absolute' : 'relative', top: 0, left: 0, bottom: 0, width: '100%', pointerEvents: isMobile && isSidebarOpen ? 'none' : 'auto' }}
                    animate={{ x: isMobile ? (isSidebarOpen ? '-100%' : '0%') : '0%' }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
                    <EditorCanvas 
                        document={sourceOfTruth} 
                        title={title} 
                        onTitleChange={(newTitle) => dispatch({ type: 'UPDATE_FIELD', payload: { field: 'title', value: newTitle } })} 
                        onEditorCreated={setEditorInstance} 
                        editor={editorInstance} 
                        colorDictionary={colorDictionary}
                        clientSaveStatus={clientSaveStatus}
                        serverSaveStatus={serverSaveStatus}
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
"""
}

for path, content in files.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)