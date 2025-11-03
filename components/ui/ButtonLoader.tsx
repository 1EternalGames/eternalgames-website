'use client';

import { motion } from 'framer-motion';

export default function ButtonLoader() {
return (
<motion.svg
className="stateful-button-loader"
viewBox="0 0 50 50"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
>
<motion.circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
</motion.svg>
);
}






























