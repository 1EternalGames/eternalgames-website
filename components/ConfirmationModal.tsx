'use client';

import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }) {
return (
<AnimatePresence>
{isOpen && (
<motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
<motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeOut' as const }} onClick={(e) => e.stopPropagation()}>
<h3>{title}</h3><p>{message}</p>
<div className="modal-actions">
<button onClick={onClose} className="outline-button">إلغاء</button>
<button onClick={onConfirm} className="primary-button">تأكيد</button>
</div>
</motion.div>
</motion.div>
)}
</AnimatePresence>
);
}


