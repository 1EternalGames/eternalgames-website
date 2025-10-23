// components/AnimatedNumber.tsx
'use client';

import { motion, useAnimate } from 'framer-motion';
import { useEffect } from 'react';

const DIGIT_MAP: { [key: string]: number } = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, };

const Digit = ({ digit, isInView }: { digit: string; isInView: boolean }) => {
    const [scope, animate] = useAnimate();
    const digitHeight = 90;

    useEffect(() => {
        if (isInView) {
            animate(scope.current, { y: -DIGIT_MAP[digit] * digitHeight }, { duration: 1.5, ease: [0.22, 1, 0.36, 1] });
        }
    }, [digit, isInView, animate, scope, digitHeight]);

    return (
        <div style={{ height: `${digitHeight}px`, overflow: 'hidden' }}>
            <motion.div ref={scope} style={{ y: 0 }}>
                {Object.keys(DIGIT_MAP).map(d => <div key={d} style={{ height: `${digitHeight}px` }}>{d}</div>)}
            </motion.div>
        </div>
    );
};

export const AnimatedNumber = ({ value, isInView, className }: { value: number; isInView: boolean; className: string; }) => {
    const [scope, animate] = useAnimate();

    useEffect(() => {
        if (isInView) {
            const popAnimation = animate(scope.current, { scale: [1, 1.15, 1], }, { duration: 0.4, delay: 1.5, ease: "easeOut", });
            return () => { popAnimation.stop(); };
        }
    }, [isInView, animate, scope]);

    const stringValue = value.toFixed(1);
    const [integerPart, decimalPart] = stringValue.split('.');
    const integerDigits = Array.from(integerPart);

    return (
        <div ref={scope} className={className} style={{ display: 'flex', justifyContent: 'center' }}>
            {/* THE DEFINITIVE FIX:
                Render decimal part FIRST in the code, so RTL layout places it on the LEFT.
                Render integer part LAST in the code, so RTL layout places it on the RIGHT.
                Removed `flexDirection: 'row-reverse'`.
            */}
            <Digit digit={decimalPart} isInView={isInView} />
            <div style={{ lineHeight: '8rem' }}>.</div>
            {integerDigits.map((digit, i) => <Digit key={i} digit={digit} isInView={isInView} />)}
        </div>
    );
};


