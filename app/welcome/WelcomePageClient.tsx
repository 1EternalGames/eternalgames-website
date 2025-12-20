// app/welcome/WelcomePageClient.tsx
'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { completeOnboardingAction, checkUsernameAvailability } from '@/app/actions/userActions';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAsyncValidation } from '@/hooks/useAsyncValidation';
import { motion, AnimatePresence } from 'framer-motion';
import ButtonLoader from '@/components/ui/ButtonLoader';
import { useToast } from '@/lib/toastStore';
import { countries } from '@/lib/countries';
import Link from 'next/link';

const InfoTooltip = ({ text }: { text: string }) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem', cursor: 'pointer' }} className="info-tooltip-container">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--text-secondary)"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        <div className="info-tooltip-text">{text}</div>
    </div>
);

export default function WelcomePageClient() {
    const { data: session, status: sessionStatus, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [country, setCountry] = useState('');
    const [countrySearch, setCountrySearch] = useState('');
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [isPending, startTransition] = useTransition();

    const hasInitialUsername = !!(session?.user as any)?.username;

    const usernameValidation = useAsyncValidation(username, checkUsernameAvailability, (session?.user as any)?.username ?? undefined);
    
    const filteredCountries = useMemo(() => 
        countries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch]);
    
    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            if (!(session as any)?.needsOnboarding) {
                const callbackUrl = searchParams.get('callbackUrl') || '/';
                router.replace(callbackUrl);
                return;
            }
            setFullName(session.user?.name ?? '');
            if ((session.user as any)?.username) {
                setUsername((session.user as any).username);
            }
        }
    }, [sessionStatus, session, router, searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isButtonDisabled) return;

        const formData = new FormData(e.target as HTMLFormElement);
        startTransition(async () => {
            const result = await completeOnboardingAction(formData);
            if (result.success) {
                toast.success('اكتمل ملفك. أهلًا بك في EternalGames.');
                await update(); 
                const callbackUrl = searchParams.get('callbackUrl') || '/';
                router.push(callbackUrl);
            } else {
                toast.error(result.message || 'أخفق إكمال الملف.');
            }
        });
    };

    if (sessionStatus === 'loading' || !session || (sessionStatus === 'authenticated' && !(session as any)?.needsOnboarding)) {
        return (
            <div className="container page-container" style={{display: 'flex', alignItems:'center', justifyContent: 'center'}}>
                <div className="spinner" />
            </div>
        );
    }
    
    const isButtonDisabled = isPending || (!hasInitialUsername && usernameValidation.type !== 'valid') || !fullName || !termsAccepted;

    return (
        <div className="container page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '10vh' }}>
            <motion.div 
                style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="page-title">أهلاً بك في رحاب EternalGames!</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.8rem', marginTop: '-2rem', marginBottom: '3rem' }}>خطوةٌ أخيرة تفصلك. أكمل ملفك الشخصي لتدخل مَعيَّتنا.</p>
                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="profile-form-group">
                        <input id="fullName" name="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="profile-input" placeholder=" " required />
                        <label htmlFor="fullName" className="profile-form-label">الاسم الكامل</label>
                    </div>

                    {!hasInitialUsername && (
                        <div className="profile-form-group">
                            <input id="username" name="username" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="profile-input" placeholder=" " autoFocus required />
                            <label htmlFor="username" className="profile-form-label">اختر اسمًا للمستخدم</label>
                            <AnimatePresence>
                                {usernameValidation.type !== 'idle' && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ fontSize: '1.4rem', margin: '0.5rem 0 0 0', color: usernameValidation.type === 'invalid' ? '#DC2626' : (usernameValidation.type === 'valid' ? '#16A34A' : 'var(--text-secondary)') }}>{usernameValidation.message}</motion.p>}
                            </AnimatePresence>
                        </div>
                    )}
                    
                    {hasInitialUsername && (
                        <input type="hidden" name="username" value={username} />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                        <div className="profile-form-group">
                            <input 
                                id="age" 
                                name="age" 
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={age} 
                                onChange={(e) => {
                                    if (e.target.value === '' || /^[0-9]+$/.test(e.target.value)) {
                                        setAge(e.target.value);
                                    }
                                }} 
                                className="profile-input" 
                                placeholder=" " 
                            />
                            <label htmlFor="age" className="profile-form-label">العمر (اختياري)<InfoTooltip text="عمرك سيُعرض علنًا. يمكنك إخفاؤه لاحقًا من الإعدادات." /></label>
                        </div>
                        <div className="profile-form-group" style={{ position: 'relative' }}>
                            <input id="country" name="country" type="text" value={country} onFocus={() => setIsCountryDropdownOpen(true)} onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 150)} onChange={(e) => { setCountry(e.target.value); setCountrySearch(e.target.value); }} className="profile-input" placeholder=" " autoComplete="off" />
                            <label htmlFor="country" className="profile-form-label">البلد (اختياري)<InfoTooltip text="بلدك سيُعرض علنًا. يمكنك إخفاؤه لاحقًا من الإعدادات." /></label>
                            {isCountryDropdownOpen && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 10, marginTop: '0.5rem' }}>
                                    {filteredCountries.map(c => 
                                        <button type="button" key={c} onMouseDown={() => { setCountry(c); setIsCountryDropdownOpen(false); }} 
                                        className="country-picker-button">
                                            {c}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="profile-form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input type="checkbox" id="terms" name="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ width: '1.6rem', height: '1.6rem' }}/>
                        <label htmlFor="terms" style={{ fontSize: '1.4rem', color: 'var(--text-secondary)' }}>أوافق على<Link href="/terms-of-service" target="_blank">شروط الخدمة</Link>.
                        </label>
                    </div>

                    <motion.button type="submit" className="primary-button" style={{ width: '100%', marginTop: '1rem', height: '48px' }} disabled={isButtonDisabled} animate={{ width: isPending ? '48px' : '100%', borderRadius: isPending ? '50%' : '5px' }} transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}>
                        <AnimatePresence mode="wait">{isPending ? <ButtonLoader key="loader" /> : <motion.span key="text" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>إكمال الملف الشخصي</motion.span>}</AnimatePresence>
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}





