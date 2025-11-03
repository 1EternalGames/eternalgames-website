// components/ToastProvider.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import useToastStore from '@/lib/toastStore';
import { Toast } from './ui/Toast';

const ToastContainer = ({ toasts, dismissToast, position }: { toasts: any[], dismissToast: (id: string) => void, position: 'left' | 'right' }) => (
<div
className="toast-container-global"
style={{
position: 'fixed',
bottom: '2rem',
[position]: '2rem',
zIndex: 9999,
display: 'flex',
flexDirection: 'column',
gap: '1rem',
[position === 'right' ? 'left' : 'right']: 'auto',
}}
>
<AnimatePresence>
{toasts.map((toast) => (
<Toast
key={toast.id}
id={toast.id}
message={toast.message}
type={toast.type}
onDismiss={dismissToast}
/>
))}
</AnimatePresence>
</div>
);

export default function ToastProvider() {
const { toasts, dismissToast } = useToastStore();
const [isMounted, setIsMounted] = useState(false); // Must be top-level hook

//  DEFINITIVE FIX FOR HOOKS ORDER
// Hooks must be executed unconditionally at the top level.
const { leftToasts, rightToasts } = useMemo(() => {
return {
leftToasts: toasts.filter(t => t.position === 'left'),
rightToasts: toasts.filter(t => t.position === 'right'),
};
}, [toasts]); // Unconditional hook execution

// Effect to set mount status runs only on client
useEffect(() => {
setIsMounted(true);
}, []);

//  Conditionally return null only if mounting fails or on server
if (!isMounted) {
// We return null here. The internal useToastStore hooks (and useMemo above)
// are still executed, preserving the hooks order between renders.
return null;
}

// After mounting, create the portal into document.body.
return createPortal(
<>
<ToastContainer toasts={rightToasts} dismissToast={dismissToast} position="right" />
<ToastContainer toasts={leftToasts} dismissToast={dismissToast} position="left" />
</>,
document.body
);
}






























