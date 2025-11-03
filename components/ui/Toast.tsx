// components/ui/Toast.tsx

'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import React from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
id: string;
message: string;
type: ToastType;
onDismiss: (id: string) => void;
duration?: number;
}

const icons: Record<ToastType, React.JSX.Element> = {
success: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>,
error: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
};

//  DEFINITIVE FIX FOR COLORS
// 'success' now uses the brand's accent color.
const bgColors: Record<ToastType, string> = {
success: 'var(--accent)',
error: '#DC2626',
info: '#6B7280', // Using a neutral secondary text color for info
};

const toastVariants = {
initial: { opacity: 0, y: 50, scale: 0.8 },
animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 200 } },
exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

export const Toast = ({ id, message, type, onDismiss, duration = 5000 }: ToastProps) => {
useEffect(() => {
const timer = setTimeout(() => {
onDismiss(id);
}, duration);

return () => clearTimeout(timer);
}, [id, duration, onDismiss]);

return (
<motion.div
layout
variants={toastVariants}
initial="initial"
animate="animate"
exit="exit"
style={{
display: 'flex',
alignItems: 'center',
gap: '1rem',
padding: '1.25rem 1.5rem',
borderRadius: '8px',
color: '#fff',
backgroundColor: bgColors[type],
boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
width: '100%',
maxWidth: '380px',
}}
>
<div style={{ flexShrink: 0 }}>{icons[type]}</div>
<p style={{ margin: 0, flexGrow: 1, fontWeight: 500 }}>{message}</p>
<button onClick={() => onDismiss(id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.25rem', marginLeft: 'auto' }}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
</button>
</motion.div>
);
};


