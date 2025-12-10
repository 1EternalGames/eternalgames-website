// components/studio/social/SocialNewsBodyEditor.tsx
'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextStrokeMark } from './extensions/TextStrokeMark';
import { RandomEnglishStyleExtension } from './extensions/RandomEnglishStyleExtension';
import { SocialDeactivateMarks } from './extensions/SocialDeactivateMarks'; 
import { FirstWordCyanExtension } from './extensions/FirstWordCyanExtension';
import { useEffect, useState } from 'react';
import styles from './SocialEditor.module.css';
import { motion } from 'framer-motion';

// Icons for Bubble Menu
const WhiteIcon = () => (
    <div style={{width: 16, height: 16, background: '#FFFFFF', borderRadius: '4px', border: '1px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{color: '#000', fontSize: '10px', fontWeight: 900}}>A</span>
    </div>
);
const CyanIcon = () => (
    <div style={{width: 16, height: 16, background: '#00FFF0', borderRadius: '4px', border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{color: '#000', fontSize: '10px', fontWeight: 900}}>A</span>
    </div>
);
const ClearIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

type StylingVariant = 'none' | 'hero' | 'card';

interface SocialNewsBodyEditorProps {
    content: string;
    onChange: (html: string) => void;
    fontSize?: number; 
    isEditing: boolean;
    setEditing: (val: boolean) => void;
    customStyle?: React.CSSProperties;
    disableAutoEnglish?: boolean;
    textAlign?: 'left' | 'right' | 'center' | 'justify';
    autoHeight?: boolean;
    enableFirstWordCyan?: boolean;
    stylingVariant?: StylingVariant; 
}

export default function SocialNewsBodyEditor({ 
    content, 
    onChange, 
    fontSize = 24, 
    isEditing, 
    setEditing,
    customStyle = {},
    disableAutoEnglish = false,
    textAlign = 'right',
    autoHeight = false,
    enableFirstWordCyan = false,
    stylingVariant = 'none'
}: SocialNewsBodyEditorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const extensions = [
        StarterKit.configure({ 
            heading: false, 
            bulletList: false, 
            orderedList: false, 
            blockquote: false, 
            bold: false,
        }),
        TextStyle,
        Color,
        // Include DeactivateMarks only for 'none' variant to allow flow in others if needed, 
        // though for auto-wrap variants simple typing is all that matters.
        SocialDeactivateMarks, 
    ];

    if (!disableAutoEnglish) {
        extensions.push(RandomEnglishStyleExtension);
    }
    
    if (enableFirstWordCyan) {
        extensions.push(FirstWordCyanExtension);
    }

    const editor = useEditor({
        extensions: extensions,
        content: content,
        editorProps: {
            attributes: {
                class: `social-editor-content variant-${stylingVariant}`,
                style: `outline: none; width: 100%; overflow: hidden; ${autoHeight ? 'min-height: 0;' : 'height: 100%;'}` 
            }
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
             if (!editor.isFocused) {
                 editor.commands.setContent(content);
             }
        }
    }, [content, editor]);

    useEffect(() => {
        if (isEditing && editor && !editor.isFocused) {
            editor.commands.focus();
        }
    }, [isEditing, editor]);

    if (!editor) return null;

    const combinedStyle: React.CSSProperties = {
        fontSize: `${fontSize}px`,
        lineHeight: 1.2,
        fontWeight: 700,
        textAlign: textAlign,
        textAlignLast: textAlign === 'justify' ? 'right' : undefined,
        direction: 'rtl',
        fontFamily: "'Cairo', sans-serif",
        color: '#A0AEC0', 
        ...customStyle
    };

    return (
        <div 
            style={{ position: 'relative', width: '100%', height: '100%', ...combinedStyle }} 
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        >
            <style jsx global>{`
                /* 
                   LOGIC: 
                   The BASE style applies to the whole paragraph (lines 2, 3, etc.).
                   The ::first-line style overrides it for the top line.
                */

                /* HERO VARIANT */
                .variant-hero p {
                    margin: 0;
                    /* Base style (Subtitle): Small, Cyan */
                    font-size: 0.55em !important; 
                    color: #00FFF0 !important;
                    line-height: 1.4 !important;
                    font-weight: 700;
                }
                .variant-hero p::first-line {
                    /* First Line (Title): Large (1em = editor fontSize), White */
                    font-size: 1.81em !important; /* Invert 0.55 to get back to 1.0 (approx 1/0.55) */
                    color: #FFFFFF !important;
                    line-height: 1.1 !important;
                    font-weight: 900;
                }

                /* CARD VARIANT */
                .variant-card p {
                    margin: 0;
                    /* Base style: Smaller */
                    font-size: 0.85em !important;
                    color: #FFFFFF !important;
                    opacity: 0.9;
                    font-weight: 500;
                    line-height: 1.3 !important;
                }
                .variant-card p::first-line {
                    /* First Line: Normal Size, Full Opacity */
                    font-size: 1.17em !important; /* Invert 0.85 to get back to 1.0 */
                    color: #FFFFFF !important;
                    opacity: 1;
                    font-weight: 700;
                    line-height: 1.2 !important;
                }
            `}</style>

            {mounted && (
                <BubbleMenu 
                    editor={editor} 
                    tippyOptions={{ 
                        duration: 100, 
                        appendTo: document.body,
                        zIndex: 99999,
                        maxWidth: 'none'
                    }} 
                    shouldShow={({ state }) => !state.selection.empty}
                    className={styles.formattingToolbar}
                >
                    <motion.button 
                        onClick={() => editor.chain().focus().setColor('#FFFFFF').run()} 
                        className={`${styles.bubbleMenuButton} ${editor.isActive('textStyle', { color: '#FFFFFF' }) ? styles.active : ''}`} 
                        whileTap={{ scale: 0.9 }}
                        title="White"
                    >
                        <WhiteIcon />
                    </motion.button>
                    <motion.button 
                        onClick={() => editor.chain().focus().setColor('#00FFF0').run()} 
                        className={`${styles.bubbleMenuButton} ${editor.isActive('textStyle', { color: '#00FFF0' }) ? styles.active : ''}`} 
                        whileTap={{ scale: 0.9 }}
                        title="Cyan"
                    >
                        <CyanIcon />
                    </motion.button>
                    <motion.button 
                        onClick={() => editor.chain().focus().unsetAllMarks().run()} 
                        className={styles.bubbleMenuButton} 
                        whileTap={{ scale: 0.9 }} 
                        title="Reset Color"
                    >
                        <ClearIcon />
                    </motion.button>
                </BubbleMenu>
            )}
            <EditorContent editor={editor} style={{ width: '100%', height: autoHeight ? 'auto' : '100%' }} />
        </div>
    );
}