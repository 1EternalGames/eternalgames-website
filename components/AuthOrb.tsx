// components/AuthOrb.tsx

import { motion, AnimatePresence } from 'framer-motion';
import styles from './AuthOrb.module.css';

const OrbLoader = () => (
    <motion.svg
        className={styles.loaderExternal}
        viewBox="0 0 60 60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
    >
        <motion.circle
            cx="30"
            cy="30"
            r="28"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="0.75"
            initial={{ rotate: -90 }}
            animate={{ rotate: 270 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
    </motion.svg>
);

interface AuthOrbProps {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    onClick: () => void;
    ariaLabel: string;
    isLarge?: boolean;
    isLoading?: boolean;
    isDisabled?: boolean;
}

export const AuthOrb = ({ Icon, onClick, ariaLabel, isLarge = false, isLoading = false, isDisabled = false }: AuthOrbProps) => {
    return (
        <motion.button
            onClick={onClick}
            aria-label={ariaLabel}
            disabled={isDisabled}
            className={`${styles.authOrb} ${isLarge ? styles.large : ''}`}
            animate={{
                scale: isLoading ? 1.2 : (isDisabled ? 0.8 : 1),
                opacity: isLoading ? 1 : (isDisabled ? 0.4 : 1),
            }}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
            style={{ cursor: isDisabled ? 'default' : 'pointer' }}
        >
            <motion.div
                className={styles.iconWrapper}
                animate={{ opacity: isLoading ? 0.5 : 1 }}
            >
                <Icon className={styles.icon} />
            </motion.div>

            <AnimatePresence>
                {isLoading && <OrbLoader key="loader" />}
            </AnimatePresence>
        </motion.button>
    );
};