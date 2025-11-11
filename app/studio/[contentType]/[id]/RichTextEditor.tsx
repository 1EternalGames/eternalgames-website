// app/studio/[contentType]/[id]/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent, Editor, ReactNodeViewRenderer, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Bold from '@tiptap/extension-bold';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { InputRule, Node, mergeAttributes, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { slugify } from 'transliteration';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/lib/toastStore';
import { optimizeImageForUpload, UploadQuality } from '@/lib/image-optimizer';
import { uploadSanityAssetAction } from '../../actions';
import { FormattingToolbar } from './FormattingToolbar';
import { LinkEditorModal } from './LinkEditorModal';
import { ImageResizeComponent } from './ImageResizeComponent';
import { ImageCompareComponent } from './ImageCompareComponent';
import { TwoImageGridComponent } from './editor-components/TwoImageGridComponent';
import { FourImageGridComponent } from './editor-components/FourImageGridComponent';
import styles from './Editor.module.css';


const formatFileSize = (bytes: number): string => { 
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

export const uploadFile = async (file: File, editor: Editor, toast: ReturnType<typeof useToast>, quality: UploadQuality) => {
    try {
        toast.info('جارٍ تهيئة الصورة للرفع...', 'left');
        const { file: optimizedFile, finalQuality } = await optimizeImageForUpload(file, quality);
        
        const reader = new FileReader();
        reader.readAsDataURL(optimizedFile);
        reader.onload = async () => {
            const { tr } = editor.state;
            const node = editor.state.schema.nodes.image.create({ src: reader.result as string });
            const transaction = tr.replaceSelectionWith(node);
            editor.view.dispatch(transaction);
            
            toast.info(`جارٍ رفع الصورة (${formatFileSize(optimizedFile.size)} @ ${Math.round(finalQuality * 100)}%)...`, 'left');
            
            const formData = new FormData();
            formData.append('file', optimizedFile);
            const result = await uploadSanityAssetAction(formData);

            let imagePos: number | null = null;
            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src.startsWith('data:')) {
                    imagePos = pos;
                    return false;
                }
                return true;
            });
            
            if (imagePos !== null) {
                if (result.success && result.asset) {
                    const finalTransaction = editor.state.tr.setNodeMarkup(imagePos, undefined, {
                        ...editor.state.doc.nodeAt(imagePos)?.attrs,
                        src: result.asset.url,
                        assetId: result.asset._id,
                    });
                    editor.view.dispatch(finalTransaction);
                    toast.success('رُفِعت الصورة.', 'left');
                } else {
                    throw new Error(result.error || 'أخفق رفع أصل الصورة.');
                }
            }
        };
    } catch (error: any) {
        toast.error(error.message || 'أخفق رفع الصورة.', 'left');
        let imagePos: number | null = null;
        editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'image' && node.attrs.src.startsWith('data:')) {
                imagePos = pos; return false;
            } return true;
        });
        if(imagePos !== null) {
            const failedTransaction = editor.state.tr.delete(imagePos, imagePos + 1);
            editor.view.dispatch(failedTransaction);
        }
    }
};

const TrailingNode = Extension.create({
    name: 'trailingNode',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('trailingNode'),
                appendTransaction: (transactions, oldState, newState) => {
                    const { doc, tr } = newState;
                    const shouldInsertNodeAtEnd = transactions.some(transaction => transaction.docChanged);
                    if (!shouldInsertNodeAtEnd) return;

                    const endPosition = doc.content.size;
                    const lastNode = doc.lastChild;

                    const nodeTypesThatNeedTrailingNode = ['image', 'imageCompare', 'twoImageGrid', 'fourImageGrid', 'heading', 'blockquote'];

                    if (lastNode && nodeTypesThatNeedTrailingNode.includes(lastNode.type.name)) {
                        const paragraph = newState.schema.nodes.paragraph.create();
                        return tr.insert(endPosition, paragraph);
                    }
                    return;
                },
            }),
        ];
    },
});

const ImageCompareNode = Node.create({ name: 'imageCompare', group: 'block', atom: true, addAttributes() { return { src1: { default: null }, assetId1: { default: null }, src2: { default: null }, assetId2: { default: null }, 'data-size': { default: 'large' } }; }, parseHTML() { return [{ tag: 'div[data-type="image-compare"]' }]; }, renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes({ 'data-type': 'image-compare' }, HTMLAttributes)]; }, addNodeView() { return ReactNodeViewRenderer(ImageCompareComponent); }, });
const CustomImage = Node.create({ name: 'image', group: 'block', atom: true, draggable: true, addAttributes() { return { src: { default: null }, alt: { default: null }, title: { default: null }, assetId: { default: null } }; }, parseHTML() { return [{ tag: 'img[src]' }]; }, renderHTML({ HTMLAttributes }) { return ['div', { 'data-type': 'custom-image' }, ['img', HTMLAttributes]]; }, addNodeView() { return ReactNodeViewRenderer(ImageResizeComponent); }, });
const TwoImageGridNode = Node.create({ name: 'twoImageGrid', group: 'block', atom: true, addAttributes() { return { src1: null, assetId1: null, src2: null, assetId2: null }; }, parseHTML() { return [{ tag: 'div[data-type="two-image-grid"]' }]; }, renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes({ 'data-type': 'two-image-grid' }, HTMLAttributes)]; }, addNodeView() { return ReactNodeViewRenderer(TwoImageGridComponent); }, });
const FourImageGridNode = Node.create({ name: 'fourImageGrid', group: 'block', atom: true, addAttributes() { return { src1: null, assetId1: null, src2: null, assetId2: null, src3: null, assetId3: null, src4: null, assetId4: null }; }, parseHTML() { return [{ tag: 'div[data-type="four-image-grid"]' }]; }, renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes({ 'data-type': 'four-image-grid' }, HTMLAttributes)]; }, addNodeView() { return ReactNodeViewRenderer(FourImageGridComponent); }, });

interface RichTextEditorProps { onEditorCreated: (editor: Editor) => void; initialContent?: any; }

export default function RichTextEditor({ onEditorCreated, initialContent }: RichTextEditorProps) {
    const toast = useToast();
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [currentLinkUrl, setCurrentLinkUrl] = useState<string | undefined>(undefined);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, bulletList: false, listItem: false, bold: false }),
            TextStyle,
            Color,
            Bold.extend({ addInputRules() { return [ new InputRule({ find: /(?:^|\s)(\*\*(?!\s+\*\*).+\*\*(?!\s+\*\*))$/, handler: ({ state, range, match }) => { const { tr } = state; const text = match[1]; const start = range.from; const end = range.to; tr.delete(start, end); tr.insertText(text.slice(2, -2), start); tr.addMark(start, start + text.length - 4, this.type.create()); }, }), ]; }, }),
            Heading.configure({ levels: [2] }).extend({
                onCreate() {
                    const editor = this.editor;
                    const transaction = editor.state.tr;
                    editor.state.doc.descendants((node, pos) => {
                        if (node.type.name === 'heading' && !node.attrs.id) {
                            const id = slugify(node.textContent);
                            transaction.setNodeMarkup(pos, undefined, { ...node.attrs, id });
                        }
                    });
                    transaction.setMeta('addToHistory', false);
                    editor.view.dispatch(transaction);
                },
                addAttributes() {
                    return { ...this.parent?.(), id: { default: null, parseHTML: element => element.getAttribute('id'), renderHTML: attributes => { if (!attributes.id) { return {}; } return { id: attributes.id }; }, }, };
                },
            }),
            Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'editor-link' }, }),
            Placeholder.configure({ placeholder: 'خُطَّ ما في نفسِكَ هنا...' }),
            CustomImage, BulletList, ListItem, ImageCompareNode, TwoImageGridNode, FourImageGridNode,
            TrailingNode,
        ],
        editorProps: {
            attributes: { class: styles.tiptap },
            handlePaste(view, event, slice) { if (!editor) return false; const items = Array.from(event.clipboardData?.items || []); const imageItem = items.find(item => item.type.startsWith('image/')); if (imageItem) { const file = imageItem.getAsFile(); if (file) { uploadFile(file, editor, toast, editor.storage.uploadQuality || '1080p'); return true; } } return false; },
            handleDrop(view, event, slice, moved) { if (!editor || moved) return false; const file = event.dataTransfer?.files[0]; if (file && file.type.startsWith('image/')) { uploadFile(file, editor, toast, editor.storage.uploadQuality || '1080p'); return true; } return false; },
        },
        immediatelyRender: false,
        content: initialContent || '',
        onSelectionUpdate: ({ editor }) => {
            if (editor.isActive('link')) { setCurrentLinkUrl(editor.getAttributes('link').href); } 
            else { setCurrentLinkUrl(undefined); }
        },
    });

    const handleOpenLinkModal = useCallback(() => { setIsLinkModalOpen(true); }, []);
    const handleCloseLinkModal = useCallback(() => { setIsLinkModalOpen(false); setCurrentLinkUrl(undefined); editor?.chain().focus().run(); }, [editor]);
    const handleSetLink = useCallback((url: string) => { if (editor) { editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); } handleCloseLinkModal(); }, [editor, handleCloseLinkModal]);
    const handleRemoveLink = useCallback(() => { if (editor) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); } handleCloseLinkModal(); }, [editor, handleCloseLinkModal]);
    useEffect(() => { if (editor) { onEditorCreated(editor); } }, [editor, onEditorCreated]);
    if (!editor) { return null; }

    return (
        <div onClick={(e) => { const target = e.target as HTMLElement; if (target.tagName === 'A' && target.classList.contains('editor-link')) { e.preventDefault(); } }}>
            <style jsx global>{`.tiptap a.editor-link { color: var(--accent); text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--accent) 50%, transparent); cursor: default; }`}</style>
            
            <BubbleMenu 
                editor={editor} 
                tippyOptions={{ 
                    duration: 100, 
                    placement: isMobile ? 'bottom-start' : 'top-end',
                    offset: [0, 8] 
                }} 
                shouldShow={({ editor, state }) => { 
                    const { from, to } = state.selection; 
                    const isTextSelection = from !== to; 
                    const isBlockNodeSelection = editor.isActive('image') || editor.isActive('imageCompare') || editor.isActive('twoImageGrid') || editor.isActive('fourImageGrid'); 
                    return isTextSelection && !isBlockNodeSelection; 
                }}
            >
                 <FormattingToolbar editor={editor} onLinkClick={handleOpenLinkModal} />
            </BubbleMenu>

            <LinkEditorModal isOpen={isLinkModalOpen} onClose={handleCloseLinkModal} onSubmit={handleSetLink} onRemove={handleRemoveLink} initialUrl={currentLinkUrl} />
            <EditorContent editor={editor} />
        </div>
    );
}