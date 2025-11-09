// app/studio/[contentType]/[id]/EditorCanvas.tsx
'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Editor } from '@tiptap/react';
// BlockToolbar is no longer imported or rendered here
import styles from './Editor.module.css';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false, loading: () => <div className={styles.canvasBodyPlaceholder}><p>جارٍ تحميل المحرر...</p></div> });

interface EditorCanvasProps { document: any; title: string; onTitleChange: (newTitle: string) => void; onEditorCreated: (editor: Editor) => void; editor: Editor | null; }

export function EditorCanvas({ document, title, onTitleChange, onEditorCreated, editor }: EditorCanvasProps) {
    const isRelease = document._type === 'gameRelease';
    return (
        <motion.div className={styles.sanctumCanvas} style={{position: 'relative'}} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
            <div className={styles.canvasContent}>
                <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="إصدارٌ بلا عنوان" className={styles.canvasTitleInput} />
                
                <div className={styles.canvasEditorWrapper}>
                    {isRelease ? (
                        <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            <p>لا نصَّ للإصدارات.<br />تُحرَّرُ البياناتُ من الشريط الجانبي.</p>
                        </div>
                    ) : (
                        <RichTextEditor onEditorCreated={onEditorCreated} initialContent={document.tiptapContent} />
                    )}
                </div>
            </div>
            
            {/* BlockToolbar has been moved to the parent EditorClient */}
        </motion.div>
    );
}





