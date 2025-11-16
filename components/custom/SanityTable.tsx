// components/custom/SanityTable.tsx
import { PortableText } from '@portabletext/react';
import styles from './SanityTable.module.css';

const CellContent = ({ content }: { content: any[] }) => {
    return <PortableText value={content} />;
};

export default function SanityTable({ value }: { value: any }) {
    if (!value || !value.rows || value.rows.length === 0) {
        return null;
    }

    const hasHeaderRow = value.rows[0]?.cells.every((cell: any) => cell.isHeader);
    const bodyRows = hasHeaderRow ? value.rows.slice(1) : value.rows;

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                {hasHeaderRow && (
                    <thead>
                        <tr>
                            {value.rows[0].cells.map((cell: any) => (
                                <th key={cell._key}>
                                    <CellContent content={cell.content} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {bodyRows.map((row: any) => (
                        <tr key={row._key}>
                            {row.cells.map((cell: any) => (
                                <td key={cell._key}>
                                    <CellContent content={cell.content} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}