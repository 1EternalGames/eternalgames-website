// components/SignInModal.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useUserStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { AuthOrb } from './AuthOrb';
import { requestPasswordReset } from '@/app/actions/authActions';
import ButtonLoader from './ui/ButtonLoader';
import styles from './SignInModal.module.css';
import modalStyles from './modals/Modals.module.css';

const GitHubIcon = dynamic(() => import('@/components/icons/GitHubIcon'));
const GoogleIcon = dynamic(() => import('@/components/icons/GoogleIcon'));
const XIcon = dynamic(() => import('@/components/icons/XIcon'));
const EternalGamesIcon = dynamic(() => import('@/components/icons/EternalGamesIcon'));

const formContentVariants = {
    hidden: { opacity: 0, transition: { duration: 0.1 } },
    visible: { opacity: 1, transition: { delay: 0.2, duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
};

// THE DEFINITIVE FIX: A specific 'exit' variant is defined to ensure a clean retreat.
const satelliteVariants = {
    initial: { y: -50, opacity: 0, scale: 0.5 },
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
    },
    exit: {
        y: 150, // Move down to tuck under the expanding panel
        x: 0,   // Converge towards the center
        scale: 0, // Shrink to nothing
        opacity: 0, // Fade out completely
        rotate: 360, // Add a final spin
        transition: { duration: 0.4, ease: 'easeIn' as const }
    }
};

const CredentialsForm = ({ onBack, onAuthSuccess, onForgotPassword, callbackUrl }: { onBack: () => void, onAuthSuccess: () => void, onForgotPassword: () => void, callbackUrl: string }) => {
    const [view, setView] = useState<'signin' | 'signup'>('signin');
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
            const result = await signIn('credentials', {
                redirect: false,
                ...Object.fromEntries(formData),
            });

            if (result?.error) {
                setMessage({ type: 'error', text: result.error });
            } else if (result?.url) {
                router.push(result.url);
                onAuthSuccess();
            } else {
                 setMessage({ type: 'error', text: 'طرأ خطأ غير متوقع.' });
            }
        });
    };
    
    const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result = await signIn('signup', {
                redirect: false,
                ...Object.fromEntries(formData),
            });

            if (result?.error) {
                setMessage({ type: 'error', text: result.error });
            } else if (result?.url) {
                router.push(result.url);
                onAuthSuccess();
            } else {
                setMessage({ type: 'error', text: 'An unexpected error occurred during sign up.' });
            }
        });
    };

    return (
        <motion.div className={styles.authCredentialsContent} variants={formContentVariants} initial="hidden" animate="visible" exit="hidden">
            <button onClick={onBack} className={styles.authBackButton}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{transform: 'scaleX(-1)'}}><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
            </button>
            <div className={styles.formHeader}><h2 className={styles.formTitle}>{view === 'signup' ? 'إنشاء حساب' : 'Sign In with Email'}</h2></div>
            
            {view === 'signin' ? (
                <form onSubmit={handleSignIn} className={styles.credentialsForm}>
                    <input type="hidden" name="returnTo" value={callbackUrl} />
                    <input type="email" name="email" placeholder="البريد الإلكتروني" required className={styles.authInput} autoFocus value={email} onChange={e => setEmail(e.target.value)} />
                    <input type="password" name="password" placeholder="كلمة السر" required className={styles.authInput} value={password} onChange={e => setPassword(e.target.value)} />
                    <motion.button type="submit" className={styles.authSubmitButton} disabled={isPending} animate={{ width: isPending ? '48px' : '100%', borderRadius: isPending ? '50%' : '8px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                        <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>ولوج</motion.span>}</AnimatePresence>
                    </motion.button>
                </form>
            ) : (
                <form onSubmit={handleSignUp} className={styles.credentialsForm}>
                    <input type="hidden" name="returnTo" value={callbackUrl} />
                    <input type="email" name="email" placeholder="البريد الإلكتروني" required value={email} onChange={e => setEmail(e.target.value)} className={styles.authInput} />
                    <input type="password" name="password" placeholder="كلمة السر (8 أحرف على الأقل)" required value={password} onChange={e => setPassword(e.target.value)} className={styles.authInput} />
                    <motion.button type="submit" className={styles.authSubmitButton} disabled={isPending} animate={{ width: isPending ? '48px' : '100%', borderRadius: isPending ? '50%' : '8px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                        <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>أنشئ حسابًا</motion.span>}</AnimatePresence>
                    </motion.button>
                </form>
            )}

            {message && <p className={`${styles.authMessage} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}
            <p className={styles.authViewSwitcher}>
                {view === 'signup' ? (
                    <>لديك حساب بالفعل؟ <button type="button" onClick={() => {setView('signin'); setMessage(null);}} className={styles.linkButton}>ولوج</button></>
                ) : (
                    <>جديدٌ في EternalGames؟ <button type="button" onClick={() => {setView('signup'); setMessage(null);}} className={styles.linkButton}>أنشئ حسابًا</button></>
                )}
            </p>
            {view === 'signin' && <button type="button" onClick={onForgotPassword} className={styles.linkButton} style={{textAlign: 'center', fontSize: '1.4rem', color: 'var(--text-secondary)', display: 'block', margin: '1rem auto 0'}}>هل نسيت كلمة السر؟</button>}
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
            if(result.success) {
                setMessage({type: 'success', text: result.message});
            } else {
                setMessage({type: 'error', text: result.message});
            }
        });
    };

    return (
        <motion.div className={styles.authCredentialsContent} variants={formContentVariants} initial="hidden" animate="visible" exit="hidden">
            <button onClick={onBack} className={styles.authBackButton}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{transform: 'scaleX(-1)'}}><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg></button>
            <div className={styles.formHeader}><h2 className={styles.formTitle}>إعادة تعيين كلمة السر</h2><p style={{color: 'var(--text-secondary)', fontSize: '1.5rem'}}>أدخل بريدك لتلقي رابط إعادة التعيين.</p></div>
            <form onSubmit={handleSubmit} className={styles.credentialsForm}>
                <input type="email" name="email" placeholder="البريد الإلكتروني" required className={styles.authInput} autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
                <motion.button type="submit" className={styles.authSubmitButton} disabled={isPending} animate={{ width: isPending ? '48px' : '100%', height: '48px', borderRadius: isPending ? '50%' : '8px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                    <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>إرسال الرابط</motion.span>}</AnimatePresence>
                </motion.button>
            </form>
            {message && <p className={`${styles.authMessage} ${message.type === 'error' ? styles.error : styles.success}`}>{message.text}</p>}
        </motion.div>
    );
};

const authProviders = [
    { id: 'github', Icon: GitHubIcon, label: 'GitHub' },
    { id: 'google', Icon: GoogleIcon, label: 'Google' },
    { id: 'twitter', Icon: XIcon, label: 'X/Twitter' },
];

export default function SignInModal() {
    const { isSignInModalOpen, setSignInModalOpen } = useUserStore();
    const [view, setView] = useState<'orbs' | 'credentials' | 'forgotPassword'>('orbs');
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
                                    {view === 'orbs' && authProviders.map((provider) => (
                                        <motion.div
                                            key={provider.id}
                                            variants={satelliteVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                        >
                                            <AuthOrb 
                                                Icon={provider.Icon} 
                                                onClick={() => handleProviderSignIn(provider.id)} 
                                                ariaLabel={`الولوج عبر ${provider.label}`} 
                                                isLoading={loadingProvider === provider.id} 
                                                isDisabled={!!loadingProvider} 
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            <AnimatePresence>
                                {view === 'orbs' && (
                                    <motion.p 
                                        className={styles.authFooterText}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                    >
                                        انضم إلى EternalGames عبر مزود خدمة أو تابع بالبريد.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className={styles.authMorphWrapper} style={{ zIndex: 10 }}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                {view === 'orbs' ? (
                                    <motion.div key="orbs" layoutId="auth-panel" style={{ zIndex: loadingProvider ? 0 : 'auto' }}>
                                        <AuthOrb Icon={EternalGamesIcon} onClick={() => setView('credentials')} ariaLabel="الولوج بالبريد" isLarge isDisabled={!!loadingProvider} />
                                    </motion.div>
                                ) : view === 'credentials' ? (
                                    <motion.div key="credentials" layoutId="auth-panel" className={styles.authCredentialsPanel}>
                                        <CredentialsForm onBack={() => setView('orbs')} onAuthSuccess={handleClose} onForgotPassword={() => setView('forgotPassword')} callbackUrl={pathname} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="forgot-password" layoutId="auth-panel" className={styles.authCredentialsPanel}>
                                        <ForgotPasswordForm onBack={() => setView('credentials')} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!isMounted) { return null; }
    return createPortal(modalContent, document.body);
}