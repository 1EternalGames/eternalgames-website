// app/studio/[contentType]/[id]/StatefulSaveButton.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/lib/toastStore';
import ButtonLoader from '@/components/ui/ButtonLoader';
import styles from '@/components/ui/StatefulButton.module.css';

const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const CheckIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function StatefulSaveButton({ onSave, hasChanges }: { onSave: () => Promise<boolean>; hasChanges: boolean }) {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const toast = useToast();

    const handleSave = async () => {
        if (saveStatus === 'saving') return;
        setSaveStatus('saving');
        const success = await onSave();
        if (success) {
            setSaveStatus('success');
            toast.success('حُفظت التغييرات!', 'left'); // Position toast on the left for studio
            setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
            setSaveStatus('error');
            toast.error('أخفق حفظ التغييرات.', 'left');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const isSaving = saveStatus === 'saving';

    return (
        <motion.button
            onClick={handleSave}
            className={`primary-button ${styles.statefulButton} ${styles.saveButton} ${styles[saveStatus]}`}
            disabled={isSaving || !hasChanges}
            animate={{
                width: isSaving || saveStatus === 'success' ? '48px' : '100%',
                height: '48px',
                borderRadius: isSaving || saveStatus === 'success' ? '50%' : '5px',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <AnimatePresence mode="wait">
                {saveStatus === 'saving' && <ButtonLoader key="loader" />}
                {saveStatus === 'success' && <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CheckIcon /></motion.div>}
                {saveStatus === 'idle' && <motion.span key="idle" className={styles.saveButtonContent} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SaveIcon /><span>حفظ التغييرات</span></motion.span>}
                {saveStatus === 'error' && <motion.span key="error" className={styles.saveButtonContent} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SaveIcon /><span>حفظ التغييرات</span></motion.span>}
            </AnimatePresence>
        </motion.button>
    );
}











