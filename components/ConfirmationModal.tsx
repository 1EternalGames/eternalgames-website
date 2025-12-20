'use client';

import Modal from './modals/Modal';
import modalStyles from './modals/Modals.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export default function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message 
}: ConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ padding: '2rem', maxWidth: '450px' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-main)', fontSize: '2rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>{message}</p>
            <div className={modalStyles.modalActions}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={onConfirm} className="primary-button delete-forever">
                    تأكيد
                </button>
            </div>
        </Modal>
    );
}


