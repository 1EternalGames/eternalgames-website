// lib/toastStore.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info';
export type ToastPosition = 'right' | 'left'; // <-- NEW TYPE

interface ToastMessage {
id: string;
message: string;
type: ToastType;
position?: ToastPosition; // <-- NEW PROPERTY
}

interface ToastState {
toasts: ToastMessage[];
addToast: (message: string, type: ToastType, position?: ToastPosition) => void; // <-- MODIFIED
dismissToast: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
toasts: [],
addToast: (message, type, position = 'right') => { // <-- SET DEFAULT TO RIGHT
const id = uuidv4();
set((state) => ({ toasts: [...state.toasts, { id, message, type, position }] }));
},
dismissToast: (id) => {
set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
},
}));

// This is the public hook that components will use.
export const useToast = () => {
const { addToast } = useToastStore();
return {
success: (message: string, position?: ToastPosition) => addToast(message, 'success', position),
error: (message: string, position?: ToastPosition) => addToast(message, 'error', position),
info: (message: string, position?: ToastPosition) => addToast(message, 'info', position),
};
};

export default useToastStore;






























