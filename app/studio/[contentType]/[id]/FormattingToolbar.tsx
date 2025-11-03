// app/studio/[contentType]/[id]/FormattingToolbar.tsx
'use client';

import { Editor } from '@tiptap/react';
import { motion } from 'framer-motion';
import styles from './Editor.module.css';
import { TwoImageIcon, FourImageIcon, CompareIcon } from '../../StudioIcons';

const BoldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>;
const ItalicIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>;
const LinkIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const H2Icon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12h8m-8 6h8M4 6h8m4 0v12m4-12v12"/></svg>;
const ListIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;


interface FormattingToolbarProps { editor: Editor; onLinkClick: () => void; }

export function FormattingToolbar({ editor, onLinkClick }: FormattingToolbarProps) {
    return (
        <div className={styles.formattingToolbar} onMouseDown={(e) => e.preventDefault()}>
            <motion.button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${styles.bubbleMenuButton} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><H2Icon /></motion.button>
            <motion.button onClick={() => editor.chain().focus().toggleBold().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('bold') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><BoldIcon /></motion.button>
            <motion.button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('italic') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ItalicIcon /></motion.button>
            <motion.button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${styles.bubbleMenuButton} ${editor.isActive('bulletList') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ListIcon /></motion.button>
            <motion.button onClick={onLinkClick} className={`${styles.bubbleMenuButton} ${editor.isActive('link') ? styles.active : ''}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><LinkIcon /></motion.button>
        </div>
    );
}





