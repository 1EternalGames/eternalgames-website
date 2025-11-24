// app/studio/[contentType]/[id]/EditorCanvas.tsx
'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Editor } from '@tiptap/react';
import React, { useRef, useLayoutEffect } from 'react';
import styles from './Editor.module.css';
import { SaveStatusIcons, SaveStatus } from './SaveStatusIcons';

type ColorMapping = {
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
    colorDictionary: ColorMapping[];
    clientSaveStatus?: SaveStatus;
    serverSaveStatus?: SaveStatus;
    // NEW PROPS
    isAutoSaveEnabled: boolean;
    onToggleAutoSave: () => void;
}

export function EditorCanvas({ 
    document, 
    title, 
    onTitleChange, 
    onEditorCreated, 
    editor, 
    colorDictionary,
    clientSaveStatus = 'saved',
    serverSaveStatus = 'saved',
    isAutoSaveEnabled,
    onToggleAutoSave
}: EditorCanvasProps) {
    const isRelease = document._type === 'gameRelease';
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; 
            textarea.style.height = `${textarea.scrollHeight}px`; 
        }
    }, [title]);

    return (
        <motion.div className={styles.sanctumCanvas} style={{position: 'relative'}} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
            <div className={styles.canvasContent}>
                {/* Passed new props to SaveStatusIcons */}
                <SaveStatusIcons 
                    clientState={clientSaveStatus} 
                    serverState={serverSaveStatus} 
                    isAutoSaveEnabled={isAutoSaveEnabled}
                    onToggleAutoSave={onToggleAutoSave}
                />
                
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