// components/ProfileEditForm.tsx
'use client';

import { updateUserAvatar, updateUserProfile, checkUsernameAvailability } from '@/app/actions/userActions';
// THE FIX: Import User but define a looser type for the prop to handle partial selects and schema mismatches
import { User } from '@/lib/generated/client';
import { useRef, useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import AvatarCropperModal from './AvatarCropperModal';
import { motion, AnimatePresence } from 'framer-motion';
import ButtonLoader from '@/components/ui/ButtonLoader';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/lib/toastStore';
import avatarStyles from './ProfileEditForm.module.css';

const UploadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /> </svg> );

const ToggleSwitch = ({ checked, onChange, name }: { checked: boolean, onChange: (checked: boolean) => void, name: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`toggle ${checked ? 'active' : ''}`}
    >
        <motion.div className="toggle-handle" layout transition={{ type: 'spring', stiffness: 700, damping: 30 }} />
        <input type="checkbox" name={name} checked={checked} readOnly style={{ display: 'none' }} />
    </button>
);

// THE FIX: Define a specific type for the user prop that matches what we actually use and fetch.
// This avoids issues where the Prisma User type requires fields (like 'lastRoleChange') that we don't select.
type ProfileUser = {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    bio?: string | null;
    twitterHandle?: string | null;
    instagramHandle?: string | null;
    age?: number | null;
    country?: string | null;
    agePublic: boolean;
    countryPublic: boolean;
}

export default function ProfileEditForm({ user }: { user: ProfileUser }) {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const { update: updateSession } = useSession();
    const toast = useToast();
    const [isSaving, startSaveTransition] = useTransition();
    const [isCheckingUsername, startUsernameCheckTransition] = useTransition();
    
    const [avatarPreview, setAvatarPreview] = useState(user.image ?? '/default-avatar.svg');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [name, setName] = useState(user.name ?? '');
    const [username, setUsername] = useState(user.username ?? '');
    const [bio, setBio] = useState(user.bio ?? '');
    const [twitterHandle, setTwitterHandle] = useState(user.twitterHandle ?? '');
    const [instagramHandle, setInstagramHandle] = useState(user.instagramHandle ?? '');
    const [agePublic, setAgePublic] = useState(user.agePublic);
    const [countryPublic, setCountryPublic] = useState(user.countryPublic);

    const [usernameStatus, setUsernameStatus] = useState<{ type: 'idle' | 'checking' | 'valid' | 'invalid', message: string }>({ type: 'idle', message: '' });
    const debouncedUsername = useDebounce(username, 500);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
    
    const hasTextChanged = 
        name !== (user.name ?? '') ||
        username !== (user.username ?? '') ||
        bio !== (user.bio ?? '') ||
        twitterHandle !== (user.twitterHandle ?? '') ||
        instagramHandle !== (user.instagramHandle ?? '') ||
        agePublic !== user.agePublic ||
        countryPublic !== user.countryPublic;

    const hasChanges = !!avatarFile || hasTextChanged;
    const isSaveDisabled = isSaving || !hasChanges || usernameStatus.type === 'invalid' || usernameStatus.type === 'checking';

    useEffect(() => {
        if (debouncedUsername && debouncedUsername !== user.username) {
            setUsernameStatus({ type: 'checking', message: 'Checking...' });
            startUsernameCheckTransition(async () => {
                const result = await checkUsernameAvailability(debouncedUsername);
                setUsernameStatus({ type: result.available ? 'valid' : 'invalid', message: result.message });
            });
        } else {
            setUsernameStatus({ type: 'idle', message: '' });
        }
    }, [debouncedUsername, user.username]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { setCropperImageSrc(reader.result as string); setIsCropperOpen(true); };
        reader.readAsDataURL(file);
        if(inputFileRef.current) inputFileRef.current.value = "";
    };
    const handleCropComplete = (croppedFile: File) => {
        setAvatarFile(croppedFile);
        setAvatarPreview(URL.createObjectURL(croppedFile));
        setIsCropperOpen(false);
    };
    async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isSaveDisabled) return;
        startSaveTransition(async () => {
            try {
                if (avatarFile) {
                    const avatarFormData = new FormData();
                    avatarFormData.append('avatar', avatarFile);
                    const avatarResult = await updateUserAvatar(avatarFormData);
                    if (!avatarResult.success) throw new Error(avatarResult.message);
                }
                if (hasTextChanged) {
                    const profileFormData = new FormData(event.currentTarget);
                    const profileResult = await updateUserProfile(profileFormData);
                    if (!profileResult.success) throw new Error(profileResult.message);
                }
                await updateSession();
                toast.success('حُدِّثَ الملف بنجاح!');
                setAvatarFile(null);
            } catch (error: any) {
                toast.error(error.message || 'أخفق تحديث الملف.');
            }
        });
    }

    const hasContent = (value: string) => value ? 'has-content' : '';

    return (
        <>
            <AvatarCropperModal isOpen={isCropperOpen} onClose={() => setIsCropperOpen(false)} imageSrc={cropperImageSrc || ''} onCropComplete={handleCropComplete} />
            <form onSubmit={handleProfileSave} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className={avatarStyles.avatarFormGroup}>
                    <label className="profile-form-label" style={{position: 'static', transform: 'none', marginBottom: '0.5rem', fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: '600'}}>صورتك الرمزية</label>
                    <div className={avatarStyles.avatarInputContainer}>
                        <button type="button" className={avatarStyles.avatarPreviewButton} onClick={() => inputFileRef.current?.click()}>
                            <div className={avatarStyles.avatarUploadPrompt}><UploadIcon /><span>تغيير</span></div>
                            <Image src={avatarPreview} alt="Avatar preview" width={80} height={80} className={avatarStyles.profileAvatarPreview} />
                        </button>
                        <p className={avatarStyles.formDescription}>انقر لرفع صورة جديدة (أقصاه 4.5 ميجابايت).</p>
                        <input ref={inputFileRef} type="file" name="avatar_source" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} disabled={isSaving} />
                    </div>
                </div>
                <div className={`profile-form-group ${hasContent(name)}`}>
                    <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} className="profile-input" required placeholder=" " />
                    <label htmlFor="name" className="profile-form-label">الاسم المعروض</label>
                </div>
                <div className={`profile-form-group ${hasContent(username)}`}>
                    <input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="profile-input" required placeholder=" " />
                    <label htmlFor="username" className="profile-form-label">اسم المستخدم</label>
                    <AnimatePresence>
                        {usernameStatus.message && ( <motion.p initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} style={{ fontSize: '1.3rem', margin: '0.5rem 0 0 0', color: usernameStatus.type === 'invalid' ? '#DC2626' : (usernameStatus.type === 'valid' ? '#16A34A' : 'var(--text-secondary)') }}>{usernameStatus.message}</motion.p> )}
                    </AnimatePresence>
                </div>
                <div className={`profile-form-group ${hasContent(bio)}`}>
                    <textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="profile-input" maxLength={500} placeholder=" " />
                    <label htmlFor="bio" className="profile-form-label">النبذة التعريفية</label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className={`profile-form-group ${hasContent(twitterHandle)}`}>
                        <input id="twitterHandle" name="twitterHandle" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} className="profile-input" placeholder=" " />
                         <label htmlFor="twitterHandle" className="profile-form-label">حساب تويتر</label>
                    </div>
                    <div className={`profile-form-group ${hasContent(instagramHandle)}`}>
                        <input id="instagramHandle" name="instagramHandle" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} className="profile-input" placeholder=" "/>
                        <label htmlFor="instagramHandle" className="profile-form-label">حساب إنستغرام</label>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <label htmlFor="agePublic" style={{fontFamily: 'var(--font-ui)', fontWeight: 500}}>إظهار العمر علنًا</label>
                        <ToggleSwitch name="agePublic" checked={agePublic} onChange={setAgePublic} />
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <label htmlFor="countryPublic" style={{fontFamily: 'var(--font-ui)', fontWeight: 500}}>إظهار البلد علنًا</label>
                        <ToggleSwitch name="countryPublic" checked={countryPublic} onChange={setCountryPublic} />
                    </div>
                </div>

                <motion.button
                    type="submit"
                    className="primary-button"
                    disabled={isSaveDisabled}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                    animate={{
                        width: isSaving ? '48px' : '100%',
                        height: '48px',
                        borderRadius: isSaving ? '50%' : '5px',
                        paddingLeft: isSaving ? '0rem' : '2.4rem',
                        paddingRight: isSaving ? '0rem' : '2.4rem',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <AnimatePresence mode="wait">
                        {isSaving ? (
                            <ButtonLoader key="loader" />
                        ) : (
                            <motion.span
                                key="text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                حفظ التغييرات
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </form>
        </>
    );
}


