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
import { useContentStore } from '@/lib/contentStore'; 
import styles from './Editor.module.css';
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import type { SaveStatus } from './SaveStatusIcons';

type EditorDocument = {
    _id: string; 
    _type: string; 
    _updatedAt: string; 
    title: string; 
    slug?: string | { current: string } | null;
    score?: number; 
    verdict?: string; 
    pros?: string[]; 
    cons?: string[]; 
    game?: { _id: string; title: string } | null; 
    publishedAt?: string | null; 
    mainImage?: { asset?: { _ref?: string }; _ref?: string; url?: string | null; metadata?: any }; 
    mainImageVertical?: { asset?: { _ref?: string }; _ref?: string; url?: string | null; metadata?: any }; 
    authors?: any[]; reporters?: any[]; designers?: any[]; tags?: any[]; 
    releaseDate?: string; platforms?: string[]; synopsis?: string; 
    tiptapContent?: any; content?: any; 
    category?: { _id: string; title: string } | null;
    newsType?: 'official' | 'rumor' | 'leak';
    price?: string; 
    developer?: { _id: string, title: string } | null; 
    publisher?: { _id: string, title: string } | null; 
    isTBA?: boolean; 
    trailer?: string; 
    isPinned?: boolean; 
    onGamePass?: boolean; 
    onPSPlus?: boolean; 
    datePrecision?: 'day' | 'month' | 'year';
};

type ColorMapping = {
  _key?: string;
  word: string;
  color: string;
}

const clientSlugify = (text: string): string => { if (!text) return ''; return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-'); };

const getId = (item: any): string | null => {
    if (!item) return null;
    if (typeof item === 'string') return item;
    return item._id || item._ref || null;
};

const getSlugString = (slug: any): string => {
    if (!slug) return '';
    if (typeof slug === 'string') return slug;
    if (typeof slug === 'object' && slug.current) return slug.current;
    return '';
};

const cleanForComparison = (val: any): any => {
    if (val === null || val === undefined) return undefined;
    if (val === '') return undefined;
    if (val === false) return undefined; 
    if (Array.isArray(val) && val.length === 0) return undefined;
    
    if (typeof val === 'number') return val;
    if (val === true) return true;
    if (typeof val === 'string') return val;

    if (Array.isArray(val)) {
        const cleaned = val.map(item => {
            const id = getId(item);
            if (id) return id; 
            return cleanForComparison(item);
        }).filter(v => v !== undefined);
        return cleaned.length > 0 ? cleaned : undefined;
    }

    if (typeof val === 'object') {
        if (val._type === 'image' || (val.asset && (val.asset._ref || val.asset._id))) {
            return val.asset?._ref || val.asset?._id || val._ref || undefined;
        }
        if (val._type === 'slug' && val.current) return val.current;
        if (val._type === 'reference' && val._ref) return val._ref;

        const newObj: any = {};
        const keys = Object.keys(val).sort();
        
        for (const key of keys) {
            if (['_key', '_type', '_weak', '_strengthenOnPublish', '_createdAt', '_updatedAt', '_rev', 'markDefs', 'asset'].includes(key)) continue;
            const cleanedVal = cleanForComparison(val[key]);
            if (cleanedVal !== undefined) {
                newObj[key] = cleanedVal;
            }
        }
        
        if (Object.keys(newObj).length === 0) return undefined;
        return newObj;
    }

    return val;
};

const isEquivalent = (a: any, b: any) => {
    const cleanA = JSON.stringify(cleanForComparison(a));
    const cleanB = JSON.stringify(cleanForComparison(b));
    return cleanA === cleanB;
};

const getInitialEditorState = (doc: EditorDocument) => {
    const currentSlug = getSlugString(doc.slug);
    
    const getMainImageRef = (img: any) => img?.asset?._ref || img?._ref || null;
    const getMainImageUrl = (img: any) => img?.url || (img?.asset?.url) || null;

    return {
        _id: doc._id,
        _type: doc._type,
        _updatedAt: doc._updatedAt,
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
            assetId: getMainImageRef(doc.mainImage),
            assetUrl: getMainImageUrl(doc.mainImage)
        },
        mainImageVertical: {
            assetId: getMainImageRef(doc.mainImageVertical),
            assetUrl: getMainImageUrl(doc.mainImageVertical)
        },
        authors: (doc.authors || []).filter(Boolean),
        reporters: (doc.reporters || []).filter(Boolean),
        designers: (doc.designers || []).filter(Boolean),
        tags: (doc.tags || []).filter(Boolean),
        releaseDate: doc.releaseDate || '',
        platforms: doc.platforms || [],
        synopsis: doc.synopsis || '',
        category: doc.category || null,
        newsType: doc.newsType || 'official',
        price: doc.price || '', 
        developer: doc.developer || null,
        publisher: doc.publisher || null, 
        isTBA: doc.isTBA || false, 
        trailer: doc.trailer || '', 
        isPinned: doc.isPinned || false, 
        onGamePass: doc.onGamePass || false, 
        onPSPlus: doc.onPSPlus || false,
        datePrecision: doc.datePrecision || 'day'
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

const generateDiffPatch = (currentState: any, sourceOfTruth: any, editorContentJson: string) => {
    const patch: Record<string, any> = {};

    const check = (key: string, stateVal: any, sotVal: any) => {
        if (!isEquivalent(stateVal, sotVal)) {
            if (key === 'slug' && stateVal) patch[key] = { _type: 'slug', current: stateVal };
            else if (key === 'category' && stateVal) patch[key] = { _type: 'reference', _ref: getId(stateVal) };
            else if (['game', 'developer', 'publisher'].includes(key) && stateVal) patch[key] = { _type: 'reference', _ref: getId(stateVal) };
            else if (['tags', 'authors', 'reporters', 'designers'].includes(key)) {
                patch[key] = (stateVal || []).map((i: any) => ({ _type: 'reference', _ref: getId(i), _key: getId(i) }));
            }
            else if (['mainImage', 'mainImageVertical'].includes(key)) {
                if (stateVal?.assetId) patch[key] = { _type: 'image', asset: { _type: 'reference', _ref: stateVal.assetId } };
                else patch[key] = undefined; 
            }
            else {
                patch[key] = stateVal;
            }
        }
    };

    check('title', currentState.title, sourceOfTruth.title);
    
    if (sourceOfTruth._type !== 'gameRelease') {
        check('slug', currentState.slug, getSlugString(sourceOfTruth.slug));
    }
    
    check('score', currentState.score, sourceOfTruth.score);
    check('verdict', currentState.verdict, sourceOfTruth.verdict);
    check('pros', currentState.pros, sourceOfTruth.pros);
    check('cons', currentState.cons, sourceOfTruth.cons);
    
    check('releaseDate', currentState.releaseDate, sourceOfTruth.releaseDate);
    check('datePrecision', currentState.datePrecision, sourceOfTruth.datePrecision);
    check('synopsis', currentState.synopsis, sourceOfTruth.synopsis);
    check('newsType', currentState.newsType, sourceOfTruth.newsType);
    check('price', currentState.price, sourceOfTruth.price);
    check('trailer', currentState.trailer, sourceOfTruth.trailer);
    check('isTBA', currentState.isTBA, sourceOfTruth.isTBA);
    check('isPinned', currentState.isPinned, sourceOfTruth.isPinned);
    check('onGamePass', currentState.onGamePass, sourceOfTruth.onGamePass);
    check('onPSPlus', currentState.onPSPlus, sourceOfTruth.onPSPlus);
    check('platforms', currentState.platforms, sourceOfTruth.platforms);

    check('category', currentState.category, sourceOfTruth.category);
    check('game', currentState.game, sourceOfTruth.game);
    check('developer', currentState.developer, sourceOfTruth.developer);
    check('publisher', currentState.publisher, sourceOfTruth.publisher);
    
    check('tags', currentState.tags, sourceOfTruth.tags);
    check('authors', currentState.authors, sourceOfTruth.authors);
    check('reporters', currentState.reporters, sourceOfTruth.reporters);
    check('designers', currentState.designers, sourceOfTruth.designers);

    const sotMainImageState = { assetId: getId(sourceOfTruth.mainImage?.asset || sourceOfTruth.mainImage) };
    const sotVertImageState = { assetId: getId(sourceOfTruth.mainImageVertical?.asset || sourceOfTruth.mainImageVertical) };
    
    if (currentState.mainImage.assetId !== sotMainImageState.assetId) {
        check('mainImage', currentState.mainImage, null); 
    }
    if (currentState.mainImageVertical.assetId !== sotVertImageState.assetId) {
        check('mainImageVertical', currentState.mainImageVertical, null);
    }

    if (sourceOfTruth._type !== 'gameRelease') {
        const currentContentPortableText = tiptapToPortableText(JSON.parse(editorContentJson));
        if (!isEquivalent(currentContentPortableText, sourceOfTruth.content)) {
            patch.content = currentContentPortableText;
        }
    }

    return patch;
};

export function EditorClient({ 
    document: initialDocument, 
    colorDictionary: initialColorDictionary,
    studioMetadata 
}: { 
    document: EditorDocument, 
    colorDictionary: ColorMapping[],
    studioMetadata: any 
}) {
    const { isOverlayOpen } = useContentStore();

    const [sourceOfTruth, setSourceOfTruth] = useState<EditorDocument>(initialDocument);
    const [state, dispatch] = useReducer(editorReducer, getInitialEditorState(initialDocument));
    const { title, slug, isSlugManual } = state;
    const toast = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [mainImageUploadQuality, setMainImageUploadQuality] = useState<UploadQuality>('1080p');
    const { blockUploadQuality, setBlockUploadQuality, setEditorActive, setLiveUrl } = useEditorStore();

    const initialSlug = getSlugString(initialDocument.slug);
    const [slugValidationStatus, setSlugValidationStatus] = useState<'pending' | 'valid' | 'invalid'>(
        initialSlug ? 'valid' : 'pending'
    );
    const [slugValidationMessage, setSlugValidationMessage] = useState(
        initialSlug ? 'المُعرِّفُ صالح.' : 'جارٍ التحقق...'
    );

    const debouncedSlug = useDebounce(slug, 500);
    const [editorContentJson, setEditorContentJson] = useState(JSON.stringify(initialDocument.tiptapContent || {}));
    const [colorDictionary, setColorDictionary] = useState<ColorMapping[]>(initialColorDictionary);
    
    const [clientSaveStatus, setClientSaveStatus] = useState<SaveStatus>('saved');
    const [serverSaveStatus, setServerSaveStatus] = useState<SaveStatus>('saved');
    const serverSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [hasHydratedFromLocal, setHasHydratedFromLocal] = useState(false);
    const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);

    const stateRef = useRef(state);
    const contentJsonRef = useRef(editorContentJson);
    const needsClientSaveRef = useRef(false);

    useBodyClass('sidebar-open', isSidebarOpen && isMobile);
    
    useEffect(() => {
        setEditorActive(true);
        document.body.classList.add('editor-active');
        return () => {
            const isStillEditor = window.location.pathname.match(/^\/studio\/(reviews|articles|news|releases)\//);
            if (!isStillEditor) {
                setEditorActive(false);
                setLiveUrl(null);
                document.body.classList.remove('editor-active');
            }
        };
    }, [setEditorActive, setLiveUrl]);

    useEffect(() => {
        const docSlug = getSlugString(sourceOfTruth.slug);
        const { _type, publishedAt } = sourceOfTruth;
        const isPublished = publishedAt && new Date(publishedAt) <= new Date();
        
        if (isPublished && docSlug && _type !== 'gameRelease') {
            const contentTypePlural = _type === 'review' ? 'reviews' : _type === 'article' ? 'articles' : 'news';
            const url = `/${contentTypePlural}/${docSlug}`;
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
    
    // --- SAFE HYDRATION ---
    useEffect(() => {
        if (!editorInstance || hasHydratedFromLocal) return;

        const key = `eternal-draft-${initialDocument._id}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const localData = JSON.parse(saved);
                
                // SAFETY CHECK: Only hydrate if local data is NEWER than server data
                const serverTime = new Date(initialDocument._updatedAt).getTime();
                const localTime = localData.updatedAt ? new Date(localData.updatedAt).getTime() : 0;
                
                if (localTime > serverTime) {
                    if (localData.state && localData.contentJson) {
                        dispatch({ type: 'INITIALIZE_STATE', payload: localData.state });
                        setEditorContentJson(localData.contentJson);
                        const contentObj = JSON.parse(localData.contentJson);
                        editorInstance.commands.setContent(contentObj, false); 
                        toast.info('تم استعادة مسودة غير محفوظة من جهازك.', 'left');
                    }
                } else {
                    // Local storage is stale, clear it
                    localStorage.removeItem(key);
                }
            } catch (e) {
                localStorage.removeItem(key);
            }
        }
        setHasHydratedFromLocal(true);
    }, [editorInstance, initialDocument._id, initialDocument._updatedAt, hasHydratedFromLocal, toast]);

    const patch = useMemo(() => generateDiffPatch(state, sourceOfTruth, editorContentJson), [state, sourceOfTruth, editorContentJson]);
    const hasChanges = Object.keys(patch).length > 0;

    useEffect(() => {
        stateRef.current = state;
        contentJsonRef.current = editorContentJson;
        
        if (hasChanges) {
            needsClientSaveRef.current = true;
            setClientSaveStatus('saving'); 
            setServerSaveStatus('pending'); 
        } else {
            needsClientSaveRef.current = false;
            setClientSaveStatus('saved');
            setServerSaveStatus('saved');
        }
    }, [state, editorContentJson, hasChanges]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (needsClientSaveRef.current) {
                const key = `eternal-draft-${sourceOfTruth._id}`;
                const payload = {
                    state: stateRef.current,
                    contentJson: contentJsonRef.current,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(key, JSON.stringify(payload));
                needsClientSaveRef.current = false;
                setClientSaveStatus('saved');
            }
        }, 300);

        return () => clearInterval(intervalId);
    }, [sourceOfTruth._id]);

    useEffect(() => { if (editorInstance) editorInstance.storage.uploadQuality = blockUploadQuality; }, [blockUploadQuality, editorInstance]);
    
    useEffect(() => { 
        // If SOT updates (after save), refresh state
        if (sourceOfTruth._updatedAt !== state._updatedAt) {
            const newState = getInitialEditorState(sourceOfTruth);
            dispatch({ type: 'INITIALIZE_STATE', payload: newState }); 
            
            if (editorInstance) { 
                const freshTiptapContent = portableTextToTiptap(sourceOfTruth.content || []);
                // Only reset editor content if we don't have pending local changes
                if (!hasChanges) { 
                    editorInstance.commands.setContent(freshTiptapContent, false); 
                } 
            }
        }
    }, [sourceOfTruth._updatedAt, editorInstance]); // Removed sourceOfTruth to avoid loop

    useEffect(() => { if (editorInstance) { const updateJson = () => setEditorContentJson(JSON.stringify(editorInstance.getJSON())); editorInstance.on('update', updateJson); return () => { editorInstance.off('update', updateJson); }; } }, [editorInstance]);
    
    useEffect(() => { 
        if (!isSlugManual && title !== sourceOfTruth.title) { 
            dispatch({ type: 'UPDATE_SLUG', payload: { slug: clientSlugify(title), isManual: false } }); 
        } 
    }, [title, isSlugManual, sourceOfTruth.title]);
    
    useEffect(() => {
        if (state._type === 'gameRelease') { setSlugValidationStatus('valid'); setSlugValidationMessage(''); return; }
        if (!state._id || !debouncedSlug) { 
             if (debouncedSlug === '') {
                 setSlugValidationStatus('invalid'); 
                 setSlugValidationMessage('لا يكُن المُعرِّفُ خاويًا.');
             }
             return; 
        } 
        
        const sotSlugStr = getSlugString(sourceOfTruth.slug);
        if (debouncedSlug === sotSlugStr) {
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
    }, [debouncedSlug, state._id, state._type, sourceOfTruth.slug]);

    const isDocumentValid = useMemo(() => { const { title, slug, mainImage, game, score, verdict, authors, reporters, releaseDate, platforms, synopsis, category, isTBA } = state; const type = sourceOfTruth._type; const baseValid = title.trim() && mainImage.assetId; if (!baseValid) return false; if (type !== 'gameRelease' && !slug.trim()) return false; if (type === 'review') return game?._id && (authors || []).length > 0 && score > 0 && verdict.trim(); if (type === 'article') return game?._id && (authors || []).length > 0; if (type === 'news') return (reporters || []).length > 0 && category; if (type === 'gameRelease') return game?._id && (isTBA || releaseDate.trim()) && synopsis.trim() && (platforms || []).length > 0; return false; }, [state, sourceOfTruth._type]);
    
    const saveWorkingCopy = useCallback(async (): Promise<boolean> => { 
        const currentPatch = generateDiffPatch(state, sourceOfTruth, editorContentJson);
        const currentHasChanges = Object.keys(currentPatch).length > 0;

        if (!currentHasChanges) {
             needsClientSaveRef.current = false;
             setClientSaveStatus('saved');
             return true; 
        }

        if (sourceOfTruth._type !== 'gameRelease' && slugValidationStatus !== 'valid') { 
            toast.error('لا يمكن الحفظ بمُعرِّف غير صالح.', 'left'); 
            return false; 
        } 

        const result = await updateDocumentAction(sourceOfTruth._id, currentPatch); 
        
        if (result.success && result.updatedDocument) { 
            setSourceOfTruth(result.updatedDocument);
            
            // CRITICAL: Clear local storage immediately after successful server save
            const key = `eternal-draft-${sourceOfTruth._id}`;
            localStorage.removeItem(key);
            
            return true; 
        } else { 
            toast.error(result.message || 'أخفق حفظ التغييرات.', 'left'); 
            return false; 
        } 
    }, [state, sourceOfTruth, editorContentJson, slugValidationStatus, toast]);
    
    useEffect(() => {
        if (hasChanges && isAutoSaveEnabled) {
            if (serverSaveTimeoutRef.current) clearTimeout(serverSaveTimeoutRef.current);
            serverSaveTimeoutRef.current = setTimeout(async () => {
                setServerSaveStatus('saving');
                await saveWorkingCopy();
                setServerSaveStatus('saved'); 
            }, 10000); 
        }
    }, [hasChanges, saveWorkingCopy, isAutoSaveEnabled]); 

    const handlePublish = async (publishTime?: string | null): Promise<boolean> => { 
        if (!isDocumentValid) {
            toast.error('يرجى ملء الحقول الإلزامية قبل النشر.', 'left');
            return false;
        }
        const didSave = await saveWorkingCopy(); 
        if (!didSave) return false; 
        
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
    if (isOverlayOpen) return null;

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
                        colorDictionary={colorDictionary}
                        onColorDictionaryUpdate={setColorDictionary}
                        studioMetadata={studioMetadata} 
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
                        isAutoSaveEnabled={isAutoSaveEnabled}
                        onToggleAutoSave={() => setIsAutoSaveEnabled(prev => !prev)}
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