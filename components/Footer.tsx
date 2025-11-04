'use client';

import React from 'react';
import styles from './Footer.module.css';

//  Dedicated, Correctly Scaled Icon Components
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 1200 1227" fill="currentColor" {...props}>
<g transform="scale(0.8) translate(150, 150)">
<path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.924L144.011 79.6944H306.615L611.412 515.685L658.88 583.589L1058.05 1150.3H895.452L569.165 687.854V687.828Z" />
</g>
</svg>
);
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg viewBox="80 80 320 320" fill="currentColor" {...props}>
<path d="M207.26,200.54c3.77,0,7.48.28,11.1.81v43.65c-3.47-1.22-7.21-1.88-11.1-1.88-18.55,0-33.59,15.04-33.59,33.59s15.04,33.59,33.59,33.59,33.59-15.04,33.59-33.59V113.28h42.83c-.06,1.09-.1,2.19-.1,3.3,0,30.64,24.84,55.48,55.48,55.48v40.79c-20.73,0-39.92-6.55-55.63-17.7v81.57c0,42.07-34.11,76.17-76.17,76.17s-76.17-34.11-76.17-76.17,34.1-76.17,76.17-76.17"/>
</svg>
);
const YouTubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
<path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42a2.5 2.5 0 0 0-1.76 1.77A26.12 26.12 0 0 0 2 12s0 4.25.42 5.81a2.5 2.5 0 0 0 1.76 1.77C5.75 20 12 20 12 20s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.12 26.12 0 0 0 22 12s0-4.25-.42-4.81zM9.75 15.5v-7l6 3.5-6 3.5z"/>
</svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
<path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
</svg>
);
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
</svg>
);

const Footer = () => {
return (
<footer className={`${styles.footer} ${styles.newFooterLayout}`}>
<div className={`container ${styles.footerContainer}`}>
<div className={`${styles.footerSocialsWrapper}`}>
<a href="https://x.com/1EternalGames" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="no-underline">
<div className={styles.socialLinkFrame}><XIcon className={styles.socialIconSvg} /></div>
</a>
<a href="https://www.tiktok.com/@1eternalgames" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="no-underline">
<div className={styles.socialLinkFrame}><TikTokIcon className={styles.socialIconSvg} /></div>
</a>
<a href="https://www.youtube.com/@1eternalgames" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="no-underline">
<div className={styles.socialLinkFrame}><YouTubeIcon className={styles.socialIconSvg} /></div>
</a>
<a href="https://www.instagram.com/1eternalgames" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="no-underline">
<div className={styles.socialLinkFrame}><InstagramIcon className={styles.socialIconSvg} /></div>
</a>
<a href="https://www.facebook.com/people/Eternal-Games/61574132488834/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="no-underline">
<div className={styles.socialLinkFrame}><FacebookIcon className={styles.socialIconSvg} /></div>
</a>
</div>

<div className={styles.footerDivider}></div>

<div className={styles.footerInfo}>
<p className={styles.footerCopyright}>&copy; {new Date().getFullYear()} EternalGames</p>
<span className={styles.infoSeparator}>•</span>
<a href="https://x.com/MoVisionX" target="_blank" rel="noopener noreferrer" className={`${styles.designerCredit} no-underline`}>
<span>صاغه محمد السعد - @MoVisionX</span>
<XIcon className={styles.designerIcon} />
</a>
</div>
</div>
</footer>
);
};

export default Footer;