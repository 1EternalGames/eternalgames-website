// components/comments/SignInPrompt.tsx
'use client';

import { useUserStore } from "@/lib/store";
import { motion } from "framer-motion";
import styles from './SignInPrompt.module.css'; // <-- IMPORTED MODULE

export default function SignInPrompt() {
    const { setSignInModalOpen } = useUserStore();

    return (
        <div className={styles.signInPrompt}>
            <h3>شارك في النقاش</h3>
            <p>لتترك تعليقًا، سجِّل دخولك.</p>
            <motion.button
                onClick={() => setSignInModalOpen(true)}
                className={styles.signInButton} // <-- UPDATED CLASS
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >تسجيل الدخول</motion.button>
        </div>
    );
}








