// components/SignInModal.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { AuthOrb } from './AuthOrb';
import { requestPasswordReset } from '@/app/actions/authActions';
import ButtonLoader from './ui/ButtonLoader';
// MODIFIED: Replaced dynamic imports with a single static import
import { GitHubIcon, GoogleIcon, XIcon, EternalGamesIcon } from '@/components/icons/AuthIcons';
import styles from './SignInModal.module.css';
import modalStyles from './modals/Modals.module.css';

const formContentVariants = {
    hidden: { opacity: 0, transition: { duration: 0.15, ease: 'easeOut' as const } },
    visible: { opacity: 1, transition: { delay: 0.25, duration: 0.3, ease: 'easeIn' as const } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeOut' as const } }
};

const satelliteVariants = {
    hidden: (direction: number) => ({
        y: 80, x: direction * 20, scale: 0, opacity: 0, rotate: 360,
        transition: { duration: 0.4, ease: 'easeIn' as const }
    }),
    visible: {
        y: 0, x: 0, scale: 1, opacity: 1, rotate: 0,
        // MODIFIED: Slightly adjusted spring for a snappier feel
        transition: { type: 'spring' as const, stiffness: 350, damping: 25, delay: 0.1 }
    }
};

// --- START: Refactored Form Components (No changes within these) ---

const SignInForm = ({ onSwitchToSignUp, onForgotPassword, onAuthSuccess, onBack, callbackUrl }: { onSwitchToSignUp: () => void, onForgotPassword: () => void, onAuthSuccess: () => void, onBack: () => void, callbackUrl: string }) => {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        
        startTransition(async () => {
            const result = await signIn('credentials', { redirect: false, ...Object.fromEntries(formData) });
            if (result?.error) setMessage({ type: 'error', text: result.error });
            else if (result?.url) { router.push(result.url); onAuthSuccess(); } 
            else setMessage({ type: 'error', text: 'طرأ خطبٌ ما.' });
        });
    };

    return (
        <motion.div className={styles.authCredentialsContent} variants={formContentVariants} initial="hidden" animate="visible" exit="hidden">
            <button onClick={onBack} className={styles.authBackButton}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{transform: 'scaleX(-1)'}}><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg></button>
            <div className={styles.formHeader}><h2 className={styles.formTitle}>الدخول بالبريد الإلكتروني</h2></div>
            <form onSubmit={handleSignIn} className={styles.credentialsForm}>
                <input type="hidden" name="returnTo" value={callbackUrl} />
                <div className={styles.authFormGroup}>
                    <input id="signin-email" type="email" name="email" required className={styles.authInput} value={email} onChange={e => setEmail(e.target.value)} placeholder=" " />
                    <label htmlFor="signin-email" className={styles.authFormLabel}>البريد</label>
                </div>
                <div className={styles.authFormGroup}>
                    <input id="signin-password" type="password" name="password" required className={styles.authInput} value={password} onChange={e => setPassword(e.target.value)} placeholder=" " />
                    <label htmlFor="signin-password" className={styles.authFormLabel}>كلمة السر</label>
                </div>
                <motion.button type="submit" className={styles.authSubmitButton} disabled={isPending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} animate={{ width: isPending ? '48px' : '100%', borderRadius: isPending ? '50%' : '8px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                    <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>تسجيل الدخول</motion.span>}</AnimatePresence>
                </motion.button>
            </form>
            {message && <p className={`${styles.authMessage} ${styles.error}`}>{message.text}</p>}
            <p className={styles.authViewSwitcher}>جديدٌ في رحابنا؟ <button type="button" onClick={() => {onSwitchToSignUp(); setMessage(null);}} className={styles.linkButton}>أنشئ حسابًا</button></p>
            <button type="button" onClick={onForgotPassword} className={styles.linkButton} style={{textAlign: 'center', fontSize: '1.4rem', color: 'var(--text-secondary)', display: 'block', margin: '1rem auto 0'}}>أنسيت كلمة السر؟</button>
        </motion.div>
    );
};

const SignUpForm = ({ onSwitchToSignIn, onAuthSuccess, onBack, callbackUrl }: { onSwitchToSignIn: () => void, onAuthSuccess: () => void, onBack: () => void, callbackUrl: string }) => {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await signIn('signup', { redirect: false, ...Object.fromEntries(formData) });
            if (result?.error) setMessage({ type: 'error', text: result.error });
            else if (result?.url) { router.push(result.url); onAuthSuccess(); } 
            else setMessage({ type: 'error', text: 'طرأ خطبٌ ما.' });
        });
    };
    
    return (
        <motion.div className={styles.authCredentialsContent} variants={formContentVariants} initial="hidden" animate="visible" exit="hidden">
            <button onClick={onBack} className={styles.authBackButton}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{transform: 'scaleX(-1)'}}><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg></button>
            <div className={styles.formHeader}><h2 className={styles.formTitle}>إنشاء حساب</h2></div>
             <form onSubmit={handleSignUp} className={styles.credentialsForm}>
                <input type="hidden" name="returnTo" value={callbackUrl} />
                <div className={styles.authFormGroup}>
                    <input id="signup-email" type="email" name="email" required value={email} onChange={e => setEmail(e.target.value)} className={styles.authInput} placeholder=" " />
                    <label htmlFor="signup-email" className={styles.authFormLabel}>البريد</label>
                </div>
                <div className={styles.authFormGroup}>
                    <input id="signup-password" type="password" name="password" required value={password} onChange={e => setPassword(e.target.value)} className={styles.authInput} placeholder=" " />
                    <label htmlFor="signup-password" className={styles.authFormLabel}>كلمة السر (8 حروف على الأقل)</label>
                </div>
                <motion.button type="submit" className={styles.authSubmitButton} disabled={isPending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} animate={{ width: isPending ? '48px' : '100%', borderRadius: isPending ? '50%' : '8px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                    <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>أنشئ حسابًا</motion.span>}</AnimatePresence>
                </motion.button>
            </form>
            {message && <p className={`${styles.authMessage} ${styles.error}`}>{message.text}</p>}
            <p className={styles.authViewSwitcher}>لديك حساب؟ <button type="button" onClick={() => {onSwitchToSignIn(); setMessage(null);}} className={styles.linkButton}>تسجيل الدخول</button></p>
        </motion.div>
    );
};

const ForgotPasswordForm = ({ onBack }: { onBack: () => void }) => {
    const [email, setEmail] = useState('');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
            const result = await requestPasswordReset(email);
            setMessage({type: result.success ? 'success' : 'error', text: result.message});
        });
    };

    return (
        <motion.div className={styles.authCredentialsContent} variants={formContentVariants} initial="hidden" animate="visible" exit="hidden">
            <button onClick={onBack} className={styles.authBackButton}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{transform: 'scaleX(-1)'}}><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg></button>
            <div className={styles.formHeader}><h2 className={styles.formTitle}>إعادة تعيين كلمة السر</h2><p style={{color: 'var(--text-secondary)', fontSize: '1.5rem'}}>أدخل بريدك ليصلك رابط التعيين.</p></div>
            <form onSubmit={handleSubmit} className={styles.credentialsForm}>
                <div className={styles.authFormGroup}>
                    <input id="reset-email" type="email" name="email" required className={styles.authInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " />
                    <label htmlFor="reset-email" className={styles.authFormLabel}>البريد</label>
                </div>
                <motion.button type="submit" className={styles.authSubmitButton} disabled={isPending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} animate={{ width: isPending ? '48px' : '100%', height: '48px', borderRadius: isPending ? '50%' : '8px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                    <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>إرسال الرابط</motion.span>}</AnimatePresence>
                </motion.button>
            </form>
            {message && <p className={`${styles.authMessage} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}
        </motion.div>
    );
};

// --- END: Refactored Form Components ---

const authProviders = [
    { id: 'github', Icon: GitHubIcon, label: 'GitHub' },
    { id: 'google', Icon: GoogleIcon, label: 'Google' },
    { id: 'twitter', Icon: XIcon, label: 'X/Twitter' },
];

export default function SignInModal() {
    const { isSignInModalOpen, setSignInModalOpen } = useUserStore();
    const [view, setView] = useState<'orbs' | 'signin' | 'signup' | 'forgotPassword'>('orbs');
    const [isMounted, setIsMounted] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => { setIsMounted(true); }, []);

    const handleClose = () => {
        if (loadingProvider) return;
        setSignInModalOpen(false);
        setTimeout(() => { setView('orbs'); setLoadingProvider(null); }, 350);
    };

    const handleProviderSignIn = (provider: string) => {
        setLoadingProvider(provider);
        signIn(provider, { callbackUrl: pathname });
    };

    const modalContent = (
        <AnimatePresence>
            {isSignInModalOpen && (
                <motion.div className={modalStyles.modalOverlay} onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className={styles.authModalPanelContainer} onClick={(e) => e.stopPropagation()} initial="hidden" animate="visible" >
                        <div className={styles.authSatelliteContainer}>
                            <div className={styles.authOrbRowTop}>
                                <AnimatePresence>
                                    {view === 'orbs' && authProviders.map((provider, i) => {
                                        const direction = i - 1;
                                        return (
                                            <motion.div key={provider.id} custom={direction} variants={satelliteVariants} initial="hidden" animate="visible" exit="hidden">
                                                <AuthOrb Icon={provider.Icon} onClick={() => handleProviderSignIn(provider.id)} ariaLabel={`الدخول عبر ${provider.label}`} isLoading={loadingProvider === provider.id} isDisabled={!!loadingProvider} />
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                            <AnimatePresence>
                                {view === 'orbs' && (
                                    <motion.p className={styles.authFooterText} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                                        انضم إلى EternalGames عبر مزود خدمة أو تابع بالبريد.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className={styles.authMorphWrapper} style={{ zIndex: 10 }}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                {view === 'orbs' && (
                                    <motion.div key="orbs" layoutId="auth-panel" style={{ zIndex: loadingProvider ? 0 : 'auto' }}>
                                        <AuthOrb Icon={EternalGamesIcon} onClick={() => setView('signin')} ariaLabel="الدخول بالبريد" isLarge isDisabled={!!loadingProvider} />
                                    </motion.div>
                                )}
                                {view === 'signin' && (
                                    <motion.div key="signin" layoutId="auth-panel" className={styles.authCredentialsPanel}>
                                        <SignInForm onSwitchToSignUp={() => setView('signup')} onForgotPassword={() => setView('forgotPassword')} onAuthSuccess={handleClose} onBack={() => setView('orbs')} callbackUrl={pathname} />
                                    </motion.div>
                                )}
                                {view === 'signup' && (
                                    <motion.div key="signup" layoutId="auth-panel" className={styles.authCredentialsPanel}>
                                        <SignUpForm onSwitchToSignIn={() => setView('signin')} onAuthSuccess={handleClose} onBack={() => setView('orbs')} callbackUrl={pathname} />
                                    </motion.div>
                                )}
                                {view === 'forgotPassword' && (
                                    <motion.div key="forgot-password" layoutId="auth-panel" className={styles.authCredentialsPanel}>
                                        <ForgotPasswordForm onBack={() => setView('signin')} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!isMounted) return null;
    return createPortal(modalContent, document.body);
}


