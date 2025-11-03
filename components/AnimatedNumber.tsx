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
            animate(scope.current, { y: -DIGIT_MAP[digit] * digitHeight }, { duration: 1.5, ease: [0.22, 1, 0.36, 1] as const });
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
            const popAnimation = animate(scope.current, { scale: [1, 1.15, 1], }, { duration: 0.4, delay: 1.5, ease: "easeOut" as const, });
            return () => { popAnimation.stop(); };
        }
    }, [isInView, animate, scope]);

    const stringValue = value.toFixed(1);
    const [integerPart, decimalPart] = stringValue.split('.');
    const integerDigits = Array.from(integerPart);

    return (
        // --- THE DEFINITIVE FIX ---
        // Numbers are always displayed Left-to-Right, even in an RTL context.
        // By adding `direction: 'ltr'`, we isolate the number component from the global
        // RTL styling, ensuring its parts (integer, decimal) are laid out correctly.
        // We then write the JSX in the natural LTR order.
        <div ref={scope} className={className} style={{ display: 'flex', justifyContent: 'center', direction: 'ltr' }}>
            {integerDigits.map((digit, i) => <Digit key={i} digit={digit} isInView={isInView} />)}
            <div style={{ lineHeight: '8rem' }}>.</div>
            <Digit digit={decimalPart} isInView={isInView} />
        </div>
    );
};


