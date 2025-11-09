// app/studio/[contentType]/[id]/metadata/ProsConsInput.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ActionButton from '@/components/ActionButton';
import styles from '../Editor.module.css';
import metadataStyles from './Metadata.module.css';

interface ProsConsInputProps { label: 'المحاسن' | 'المساوئ'; items: string[]; setItems: (newItems: string[]) => void; }
const itemVariants = { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }, };
const RemoveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export function ProsConsInput({ label, items, setItems }: ProsConsInputProps) {
    const handleAddItem = () => { setItems([...items, '']); };
    const handleRemoveItem = (index: number) => { setItems(items.filter((_, i) => i !== index)); };
    const handleItemChange = (index: number, value: string) => { const newItems = [...items]; newItems[index] = value; setItems(newItems); };

    const buttonText = label === 'المحاسن' ? '+ إضافة حَسَنة' : '+ إضافة سيئة';
    const ariaLabel = label === 'المحاسن' ? 'إزالة المحسن' : 'إزالة المأخذ';

    return (
        <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>{label}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <AnimatePresence>
                    {items.map((item, index) => (
                        <motion.div key={index} layout variants={itemVariants} initial="hidden" animate="visible" exit="exit" transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }} className={metadataStyles.inputWrapper}>
                            <ActionButton type="button" onClick={() => handleRemoveItem(index)} aria-label={ariaLabel}>
                                <RemoveIcon />
                            </ActionButton>
                            <input type="text" value={item} onChange={(e) => handleItemChange(index, e.target.value)} className={styles.sidebarInput} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <button type="button" onClick={handleAddItem} className="outline-button" style={{ width: '100%', marginTop: '1rem' }}>
                {buttonText}
            </button>
        </div>
    );
}


