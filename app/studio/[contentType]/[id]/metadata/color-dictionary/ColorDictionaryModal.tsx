// app/studio/[contentType]/[id]/metadata/color-dictionary/ColorDictionaryModal.tsx
'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addOrUpdateColorDictionaryAction, removeColorDictionaryAction } from '@/app/studio/actions';
import { useToast } from '@/lib/toastStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import Modal from '@/components/modals/Modal';
import modalStyles from '@/components/modals/Modals.module.css';
import { ColorPicker } from '../../ColorPicker';
import styles from './ColorDictionaryModal.module.css';
import editorStyles from '../../Editor.module.css';

type ColorMapping = {
  _key?: string;
  word: string;
  color: string;
};

interface ColorDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMappings: ColorMapping[];
  onUpdate: (updatedMappings: ColorMapping[]) => void;
}

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export default function ColorDictionaryModal({ isOpen, onClose, initialMappings, onUpdate }: ColorDictionaryModalProps) {
  const [mappings, setMappings] = useState<ColorMapping[]>(initialMappings);
  const [newWord, setNewWord] = useState('');
  const [newColor, setNewColor] = useState('#00E5FF');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(true); // State for the new accordion
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useClickOutside(colorPickerRef, () => setIsColorPickerOpen(false));

  useEffect(() => {
    if (isOpen) {
        setMappings(initialMappings);
    }
  }, [isOpen, initialMappings]);

  const handleAdd = () => {
    if (!newWord.trim() || !newColor.trim()) {
      toast.error('الكلمة واللون مطلوبان.', 'left');
      return;
    }

    startTransition(async () => {
      const newMapping = { word: newWord, color: newColor };
      const result = await addOrUpdateColorDictionaryAction(newMapping);
      if (result.success && result.updatedDictionary) {
        const newMappings = result.updatedDictionary.autoColors || [];
        setMappings(newMappings);
        onUpdate(newMappings);
        setNewWord('');
        toast.success(`أضيفت '${newWord}' إلى القاموس.`, 'left');
      } else {
        toast.error(result.message || 'فشلت إضافة الكلمة.', 'left');
      }
    });
  };

  const handleRemove = (key: string) => {
    startTransition(async () => {
      const removedWord = mappings.find((m) => m._key === key)?.word;
      const result = await removeColorDictionaryAction(key);
      if (result.success && result.updatedDictionary) {
        const newMappings = result.updatedDictionary.autoColors || [];
        setMappings(newMappings);
        onUpdate(newMappings);
        toast.info(`أزيلت '${removedWord}' من القاموس.`, 'left');
      } else {
        toast.error(result.message || 'فشلت إزالة الكلمة.', 'left');
      }
    });
  };
  
  const dummyEditor = {
    chain: () => ({
      focus: () => ({
        setColor: (color: string) => {
          setNewColor(color);
          setIsColorPickerOpen(false);
          return { run: () => {} };
        },
        unsetColor: () => {
          setNewColor('#FFFFFF');
          setIsColorPickerOpen(false);
          return { run: () => {} };
        }
      })
    }),
    getAttributes: () => ({ color: newColor }),
  } as any;

  return (
    <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: '500px' }}>
        <h3 style={{ marginTop: 0 }}>إدارة ألوان الكلمات التلقائية</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '-1rem', marginBottom: '2rem' }}>
            عرّف الكلمات التي يجب تلوينها تلقائيًا عند كتابتها في المحرر.
        </p>
        
        <div className={styles.addForm}>
            <button onClick={handleAdd} className="primary-button" disabled={isPending}>إضافة</button>
            <div ref={colorPickerRef} className={styles.colorPickerTriggerContainer}>
                <button 
                type="button" 
                onClick={() => setIsColorPickerOpen(prev => !prev)} 
                className={styles.colorInputWrapper}
                style={{ backgroundColor: newColor }}
                >
                <span className={styles.colorInputText}>{newColor.toUpperCase()}</span>
                </button>
                <AnimatePresence>
                    {isColorPickerOpen && (
                        <ColorPicker editor={dummyEditor} popoverStyle={{ bottom: 'calc(100% + 8px)', right: '50%', transform: 'translateX(50%)', zIndex: 5001 }} />
                    )}
                </AnimatePresence>
            </div>
            <input
                type="text"
                placeholder="كلمة (مثال: Xbox)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className={editorStyles.sidebarInput}
                disabled={isPending}
            />
        </div>

        <div className={styles.collapsibleSection}>
            <button className={`${styles.collapsibleHeader} ${isListOpen ? styles.open : ''}`} onClick={() => setIsListOpen(!isListOpen)}>
                <div className={styles.headerInfo}>
                    <span>الكلمات الحالية</span>
                    <span style={{color: 'var(--text-secondary)'}}>({mappings.length})</span>
                </div>
                <motion.div animate={{ rotate: isListOpen ? 90 : 0 }} className={styles.arrowIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isListOpen && (
                    <motion.div
                        key="content"
                        className={styles.collapsibleContent}
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className={styles.mappingsList}>
                            {mappings.length > 0 ? mappings.map((mapping) => (
                                mapping._key && (
                                    <motion.div
                                        key={mapping._key}
                                        className={styles.mappingItem}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        layout
                                    >
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemColorPreview} style={{ backgroundColor: mapping.color }} />
                                            <span>{mapping.word}</span>
                                        </div>
                                        <button
                                            className={styles.removeButton}
                                            onClick={() => mapping._key && handleRemove(mapping._key)}
                                            disabled={isPending}
                                            aria-label={`Remove ${mapping.word}`}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </motion.div>
                                )
                            )) : <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem 0'}}>لا توجد كلمات مُعرفة.</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      
        <div className={modalStyles.modalActions} style={{marginTop: '2rem'}}>
            <button onClick={onClose} className="outline-button">إغلاق</button>
        </div>
    </Modal>
  );
}


