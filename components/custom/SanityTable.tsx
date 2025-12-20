// components/custom/SanityTable.tsx
'use client';

import { PortableText } from '@portabletext/react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import styles from './SanityTable.module.css';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const, // THE DEFINITIVE FIX
            stiffness: 150,
            damping: 25,
            staggerChildren: 0.1,
        },
    },
};

const bodyVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.12,
        },
    },
};

const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring' as const, // THE DEFINITIVE FIX
            stiffness: 200,
            damping: 30,
            staggerChildren: 0.07,
        },
    },
};

const cellVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const, // THE DEFINITIVE FIX
            stiffness: 250,
            damping: 20,
        },
    },
};

const CellContent = ({ content }: { content: any[] }) => {
    return (
        <motion.div variants={cellVariants}>
            <PortableText value={content} />
        </motion.div>
    );
};

export default function SanityTable({ value }: { value: any }) {
    const tableRef = useRef(null);
    const isInView = useInView(tableRef, { once: true, amount: 0.3 });

    if (!value || !value.rows || value.rows.length === 0) {
        return null;
    }

    const hasHeaderRow = value.rows[0]?.cells.every((cell: any) => cell.isHeader);
    const bodyRows = hasHeaderRow ? value.rows.slice(1) : value.rows;

    return (
        <motion.div
            ref={tableRef}
            className={styles.tableContainer}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
        >
            <table className={styles.table}>
                {hasHeaderRow && (
                    <motion.thead variants={headerVariants}>
                        <tr>
                            {value.rows[0].cells.map((cell: any) => (
                                <th key={cell._key}>
                                    <CellContent content={cell.content} />
                                </th>
                            ))}
                        </tr>
                    </motion.thead>
                )}
                <motion.tbody variants={bodyVariants}>
                    {bodyRows.map((row: any) => (
                        <motion.tr key={row._key} variants={rowVariants}>
                            {row.cells.map((cell: any) => (
                                <td key={cell._key}>
                                    <CellContent content={cell.content} />
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </motion.tbody>
            </table>
        </motion.div>
    );
}


