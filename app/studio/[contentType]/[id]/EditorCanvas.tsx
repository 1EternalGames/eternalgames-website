// app/studio/[contentType]/[id]/EditorCanvas.tsx
'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Editor } from '@tiptap/react';
import React, { useRef, useLayoutEffect } from 'react';
import styles from './Editor.module.css';

type ColorMapping = { // ADDED TYPE
  _key?: string;
  word: string;
  color: string;
}

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false, loading: () => <div className={styles.canvasBodyPlaceholder}><p>جارٍ تحميل المحرر...</p></div> });

interface EditorCanvasProps { 
    document: any; 
    title: string; 
    onTitleChange: (newTitle: string) => void; 
    onEditorCreated: (editor: Editor) => void; 
    editor: Editor | null;
    colorDictionary: ColorMapping[]; // ADDED PROP
}

export function EditorCanvas({ document, title, onTitleChange, onEditorCreated, editor, colorDictionary }: EditorCanvasProps) {
    const isRelease = document._type === 'gameRelease';
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize the textarea height based on content
    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
        }
    }, [title]);

    return (
        <motion.div className={styles.sanctumCanvas} style={{position: 'relative'}} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
            <div className={styles.canvasContent}>
                <textarea
                    ref={textareaRef}
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="عنوان بلا عنوان"
                    className={styles.canvasTitleInput}
                    rows={1}
                />
                
                <div className={styles.canvasEditorWrapper}>
                    {isRelease ? (
                        <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            <p>لا نصَّ للإصدارات.<br />تُحرَّرُ البياناتُ من الشريط الجانبي.</p>
                        </div>
                    ) : (
                        <RichTextEditor onEditorCreated={onEditorCreated} initialContent={document.tiptapContent} colorDictionary={colorDictionary} />
                    )}
                </div>
            </div>
        </motion.div>
    );
}