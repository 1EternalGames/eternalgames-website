
// app/studio/[contentType]/[id]/SaveStatusIcons.tsx
'use client';

import React from 'react';
import styles from './SaveStatusIcons.module.css';

export type SaveStatus = 'saved' | 'pending' | 'saving';

const ClientSaveIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <path d="M20 4.23052V4C20 2.89543 19.1046 2 18 2H6C4.89543 2 4 2.89543 4 4V4.23052C4 5.3575 4.47541 6.43219 5.30931 7.19028L8.76006 10.3273C9.23133 10.7558 9.5 11.3631 9.5 12C9.5 12.6369 9.23133 13.2442 8.76006 13.6727L5.30931 16.8097C4.47541 17.5678 4 18.6425 4 19.7695V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V19.7695C20 18.6425 19.5246 17.5678 18.6907 16.8097L15.2399 13.6727C14.7687 13.2442 14.5 12.6369 14.5 12C14.5 11.3631 14.7687 10.7558 15.2399 10.3273L18.6907 7.19028C19.5246 6.43219 20 5.3575 20 4.23052Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M9 21.6381C9 21.1962 9 20.9752 9.0876 20.7821C9.10151 20.7514 9.11699 20.7214 9.13399 20.6923C9.24101 20.509 9.42211 20.3796 9.78432 20.1208C10.7905 19.4021 11.2935 19.0427 11.8652 19.0045C11.955 18.9985 12.045 18.9985 12.1348 19.0045C12.7065 19.0427 13.2095 19.4021 14.2157 20.1208C14.5779 20.3796 14.759 20.509 14.866 20.6923C14.883 20.7214 14.8985 20.7514 14.9124 20.7821C15 20.9752 15 21.1962 15 21.6381V22H9V21.6381Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
    </svg>
);

const ServerSaveIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" role="img" color="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M18 1.25C19.5188 1.25 20.75 2.48122 20.75 4V4.23047C20.75 5.5687 20.1855 6.84489 19.1953 7.74512L15.7441 10.8818C15.4292 11.1681 15.25 11.5744 15.25 12C15.25 12.4256 15.4292 12.8319 15.7441 13.1182L19.1953 16.2549C20.1855 17.1551 20.75 18.4313 20.75 19.7695V20C20.75 21.5188 19.5188 22.75 18 22.75H6C4.48122 22.75 3.25 21.5188 3.25 20V19.7695C3.25 18.4313 3.81451 17.1551 4.80469 16.2549L8.25586 13.1182C8.57077 12.8319 8.75 12.4256 8.75 12C8.75 11.5744 8.57077 11.1681 8.25586 10.8818L4.80469 7.74512C3.81451 6.84489 3.25 5.5687 3.25 4.23047V4C3.25 2.48122 4.48122 1.25 6 1.25H18ZM11.8154 17.2559C11.3751 17.2853 10.9939 17.4406 10.6162 17.6562C10.2526 17.864 9.83914 18.1603 9.34863 18.5107C9.0423 18.7296 8.69345 18.9598 8.48633 19.3145C8.45654 19.3655 8.42873 19.4188 8.4043 19.4727C8.27683 19.7541 8.25355 20.0594 8.25 20.3516V20.7959H15.75V20.3516C15.7464 20.0594 15.7232 19.7541 15.5957 19.4727C15.5713 19.4188 15.5435 19.3655 15.5137 19.3145C15.3065 18.9598 14.9577 18.7296 14.6514 18.5107L14.6221 18.4902C14.1443 18.1489 13.7402 17.8598 13.3838 17.6562C13.0061 17.4406 12.6249 17.2853 12.1846 17.2559C12.0617 17.2477 11.9383 17.2477 11.8154 17.2559Z" fill="currentColor"></path>
    </svg>
);

interface SaveStatusIconsProps {
    clientState: SaveStatus;
    serverState: SaveStatus;
}

export const SaveStatusIcons = ({ clientState, serverState }: SaveStatusIconsProps) => {
    const clientClass = styles[clientState];
    const serverClass = styles[serverState];

    return (
        <div className={styles.container}>
            <div className={`${styles.iconWrapper} ${clientClass}`}>
                <ClientSaveIconSvg />
                <div className={styles.tooltip}>
                    {clientState === 'saved' ? 'المسودة المحلية متزامنة' : 'جارٍ المزامنة محليًا...'}
                </div>
            </div>
            <div className={`${styles.iconWrapper} ${serverClass}`}>
                <ServerSaveIconSvg />
                <div className={styles.tooltip}>
                    {serverState === 'saved' ? 'تم الحفظ في السحابة' : (serverState === 'saving' ? 'جارٍ الحفظ في السحابة...' : 'بانتظار الحفظ التلقائي')}
                </div>
            </div>
        </div>
    );
};
