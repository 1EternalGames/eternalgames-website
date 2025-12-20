// app/studio/[contentType]/[id]/SaveStatusIcons.tsx
'use client';

import React from 'react';
import styles from './SaveStatusIcons.module.css';

export type SaveStatus = 'saved' | 'pending' | 'saving';

// --- Client Icons ---

const ClientLoadingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <g>
            <path d="M14 21H16M14 21C13.1716 21 12.5 20.3284 12.5 19.5V17L12 17M14 21H10M10 21H8M10 21C10.8284 21 11.5 20.3284 11.5 19.5V17L12 17M12 17V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M20 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H20C21.1046 17 22 16.1046 22 15V5C22 3.89543 21.1046 3 20 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path className={styles.arrow} d="M9 10L12 13L15 10M12 12.5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </g>
    </svg>
);

const ClientSavedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <path d="M14 21H16M14 21C13.1716 21 12.5 20.3284 12.5 19.5V17L12 17M14 21H10M10 21H8M10 21C10.8284 21 11.5 20.3284 11.5 19.5V17L12 17M12 17V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M20 3H4C2.89543 3 2 3.89543 2 5V15C2 16.1046 2.89543 17 4 17H20C21.1046 17 22 16.1046 22 15V5C22 3.89543 21.1046 3 20 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M8.5 10.5L10.5 12.5L15.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
);

// --- Server Icons ---

const ServerLoadingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <g>
            <path d="M17.4776 9.01106C17.485 9.01102 17.4925 9.01101 17.5 9.01101C19.9853 9.01101 22 11.0294 22 13.5193C22 15.8398 20.25 17.7508 18 18M17.4776 9.01106C17.4924 8.84606 17.5 8.67896 17.5 8.51009C17.5 5.46695 15.0376 3 12 3C9.12324 3 6.76233 5.21267 6.52042 8.03192M17.4776 9.01106C17.3753 10.1476 16.9286 11.1846 16.2428 12.0165M6.52042 8.03192C3.98398 8.27373 2 10.4139 2 13.0183C2 15.4417 3.71776 17.4632 6 17.9273M6.52042 8.03192C6.67826 8.01687 6.83823 8.00917 7 8.00917C8.12582 8.00917 9.16474 8.38194 10.0005 9.01101" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path className={styles.arrow} d="M9.5 18.5L12 21L14.5 18.5M12 13.5V20.3912" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </g>
    </svg>
);

const ServerSavedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <path d="M17.4776 9.00005C17.4924 8.83536 17.5 8.66856 17.5 8.5C17.5 5.46243 15.0376 3 12 3C9.12324 3 6.76233 5.20862 6.52042 8.0227M17.4776 9.00005C17.3753 10.1345 16.9286 11.1696 16.2428 12M17.4776 9.00005C19.9675 8.98791 22 11.0072 22 13.5C22 15.8163 20.25 17.7513 18 18M6.52042 8.0227C3.98398 8.26407 2 10.4003 2 13C2 15.5927 3.97334 17.7491 6.5 18M6.52042 8.0227C6.67826 8.00768 6.83823 8 7 8C8.12582 8 9.16474 8.37209 10.0005 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M9 19L11 21L15.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
);

// NEW ICON: Server Paused
const ServerPausedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <path d="M17.4776 9.01106C17.485 9.01102 17.4925 9.01101 17.5 9.01101C19.9853 9.01101 22 11.0294 22 13.5193C22 15.8398 20.25 17.7508 18 18M17.4776 9.01106C17.4924 8.84606 17.5 8.67896 17.5 8.51009C17.5 5.46695 15.0376 3 12 3C9.12324 3 6.76233 5.21267 6.52042 8.03192M17.4776 9.01106C17.3753 10.1476 16.9286 11.1846 16.2428 12.0165M6.52042 8.03192C3.98398 8.27373 2 10.4139 2 13.0183C2 15.4417 3.71776 17.4632 6 17.9273M6.52042 8.03192C6.67826 8.01687 6.83823 8.00917 7 8.00917C8.12582 8.00917 9.16474 8.38194 10.0005 9.01101" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        {/* Play Triangle */}
        <path d="M13.5 17L10.5 18.5V15.5L13.5 17Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
    </svg>
);

interface SaveStatusIconsProps {
    clientState: SaveStatus;
    serverState: SaveStatus;
    isAutoSaveEnabled: boolean;
    onToggleAutoSave: () => void;
}

export const SaveStatusIcons = ({ clientState, serverState, isAutoSaveEnabled, onToggleAutoSave }: SaveStatusIconsProps) => {
    const clientClass = styles[clientState];
    const serverClass = isAutoSaveEnabled ? styles[serverState] : styles.paused;

    const renderServerIcon = () => {
        if (!isAutoSaveEnabled) return <ServerPausedIcon />;
        return serverState === 'saved' ? <ServerSavedIcon /> : <ServerLoadingIcon />;
    };

    const serverTooltipText = !isAutoSaveEnabled 
        ? 'الحفظ التلقائي متوقف (انقر للتفعيل)' 
        : (serverState === 'saved' ? 'تم الحفظ في السحابة' : (serverState === 'saving' ? 'جارٍ الحفظ في السحابة...' : 'بانتظار الحفظ التلقائي'));

    return (
        <div className={styles.container}>
            <div className={`${styles.iconWrapper} ${clientClass}`}>
                {clientState === 'saved' ? <ClientSavedIcon /> : <ClientLoadingIcon />}
                <div className={styles.tooltip}>
                    {clientState === 'saved' ? 'المسودة المحلية متزامنة' : 'جارٍ المزامنة محليًا...'}
                </div>
            </div>
            {/* Made server icon a button */}
            <button 
                onClick={onToggleAutoSave} 
                className={`${styles.iconWrapper} ${styles.iconButton} ${serverClass}`}
                aria-label={isAutoSaveEnabled ? "Pause Auto-save" : "Enable Auto-save"}
            >
                {renderServerIcon()}
                <div className={styles.tooltip}>
                    {serverTooltipText}
                </div>
            </button>
        </div>
    );
};


