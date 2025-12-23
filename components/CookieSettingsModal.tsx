// components/CookieSettingsModal.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/modals/Modal';
import { motion } from 'framer-motion';
import styles from './CookieSettingsModal.module.css';

interface CookieSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (preferences: { analytics: boolean; marketing: boolean }) => void;
}

interface OptionCardProps {
    title: string;
    description: string;
    isActive: boolean;
    isRequired?: boolean;
    onClick?: () => void;
}

const LockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const OptionCard = ({ title, description, isActive, isRequired, onClick }: OptionCardProps) => {
    const [isShaking, setIsShaking] = useState(false);

    const handleClick = () => {
        if (isRequired) {
            // Trigger the "Deny" animation
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } else {
            onClick?.();
        }
    };

    // Animation for "Denied/Locked" state
    const shakeVariants = {
        idle: { x: 0, borderColor: 'var(--border-color)' },
        shake: { 
            x: [0, -6, 6, -6, 6, 0], 
            borderColor: '#DC2626', // Flash Red
            transition: { duration: 0.4 } 
        }
    };

    // Standard styling logic
    const activeClass = isActive ? styles.active : '';
    const disabledClass = isRequired ? styles.disabled : '';
    const requiredClass = isRequired ? styles.required : '';
    // If it's shaking (denied), temporarily remove the 'active' blue/cyan styling to show the red flash clearly
    const appliedClasses = `${styles.preferenceCard} ${isShaking ? '' : activeClass} ${disabledClass} ${requiredClass}`;

    return (
        <motion.div 
            className={appliedClasses}
            onClick={handleClick}
            variants={shakeVariants}
            animate={isShaking ? "shake" : "idle"}
            whileTap={!isRequired ? { scale: 0.98 } : {}}
            style={{ cursor: isRequired ? 'not-allowed' : 'pointer' }}
            role="button"
            aria-pressed={isActive}
            aria-disabled={isRequired}
        >
            <div className={styles.labelContainer}>
                <div className={styles.headerRow}>
                    <h4 className={styles.title}>{title}</h4>
                    {isRequired && (
                        <span className={styles.badge} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <LockIcon /> إلزامي
                        </span>
                    )}
                </div>
                <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.statusIndicator} style={isShaking ? { borderColor: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.1)' } : {}}>
                <div 
                    className={styles.statusDot} 
                    style={isShaking ? { backgroundColor: '#DC2626', boxShadow: '0 0 10px #DC2626' } : {}} 
                />
                <span 
                    className={styles.statusText}
                    style={isShaking ? { color: '#DC2626' } : {}}
                >
                    {isShaking ? 'مقفل' : (isActive ? 'مفعل' : 'معطل')}
                </span>
            </div>
        </motion.div>
    );
};

export default function CookieSettingsModal({ isOpen, onClose, onSave }: CookieSettingsModalProps) {
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);

    const handleSave = () => {
        onSave({ analytics, marketing });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: '600px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', fontSize: '2.4rem' }}>
                    مركز التحكم بالخصوصية
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.4rem' }}>
                    بياناتك، قراراتك. اختر ما تشاركه معنا لتحسين تجربتك.
                </p>
            </div>

            <div className={styles.container}>
                <OptionCard 
                    title="ملفات ضرورية"
                    description="لازمة لعمل الموقع الأساسي (تسجيل الدخول، الأمان، وحفظ هذه التفضيلات). لا يمكن تعطيلها."
                    isActive={true}
                    isRequired={true}
                />

                <OptionCard 
                    title="التحليلات والأداء"
                    description="تساعدنا في فهم الصفحات الأكثر زيارة وإصلاح الأخطاء التقنية."
                    isActive={analytics}
                    onClick={() => setAnalytics(!analytics)}
                />

                <OptionCard 
                    title="التسويق والتخصيص"
                    description="تستخدم لتقديم محتوى أو عروض تناسب اهتماماتك."
                    isActive={marketing}
                    onClick={() => setMarketing(!marketing)}
                />
            </div>

            <div className={styles.actions}>
                <button onClick={onClose} className="outline-button">إلغاء</button>
                <button onClick={handleSave} className={styles.saveButton}>
                    حفظ التغييرات
                </button>
            </div>
        </Modal>
    );
}