// components/studio/social/SocialNewsBodyEditor.tsx
'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextStrokeMark } from './extensions/TextStrokeMark';
import { RandomEnglishStyleExtension } from './extensions/RandomEnglishStyleExtension';
import { SocialDeactivateMarks } from './extensions/SocialDeactivateMarks'; // IMPORTED
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

interface SocialNewsBodyEditorProps {
    content: string;
    onChange: (html: string) => void;
    fontSize: number;
    isEditing: boolean;
    setEditing: (val: boolean) => void;
}

export default function SocialNewsBodyEditor({ content, onChange, fontSize, isEditing, setEditing }: SocialNewsBodyEditorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, bulletList: false, orderedList: false, blockquote: false, bold: false }),
            TextStyle,
            Color,
            RandomEnglishStyleExtension, // Auto-apply White/Cyan to English Sequences
            SocialDeactivateMarks, // Breaks formatting on Space/Enter
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'social-editor-content',
                // Base text is Gray (#A0AEC0) and Bold (700)
                style: `font-size: ${fontSize}px; line-height: 1.6; font-weight: 700; text-align: right; direction: rtl; font-family: 'Cairo', sans-serif; color: #A0AEC0; outline: none; height: 100%; overflow: hidden;`
            }
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        }
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
             if (!editor.isFocused) {
                 editor.commands.setContent(content);
             }
        }
    }, [content, editor]);

    useEffect(() => {
        if (isEditing && editor) {
            editor.commands.focus();
        }
    }, [isEditing, editor]);

    if (!editor) return null;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
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
                        title="Reset to Gray"
                    >
                        <ClearIcon />
                    </motion.button>
                </BubbleMenu>
            )}
            <EditorContent editor={editor} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}