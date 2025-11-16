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

    // THE DEFINITIVE FIX: Detect table type based on the presence of a header cell in the first column of the body.
    const isVertical = value.rows.some((row: any, index: number) => index > 0 && row.cells[0]?.isHeader);
    const isHorizontal = value.rows[0]?.cells.every((cell: any) => cell.isHeader);
    
    const tableType = isVertical ? 'vertical' : 'horizontal';

    return (
        <div className={styles.tableWrapper}>
            <table className={`${styles.table} ${styles[tableType]}`}>
                {isHorizontal ? (
                    <thead>
                        <tr>
                            {value.rows[0].cells.map((cell: any, index: number) => (
                                <th key={cell._key || index}>
                                    <CellContent content={cell.content} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                ) : null}
                <tbody>
                    {value.rows.slice(isHorizontal ? 1 : 0).map((row: any, rowIndex: number) => (
                        <tr key={row._key || rowIndex}>
                            {row.cells.map((cell: any, cellIndex: number) => {
                                // Render as `th` if the `isHeader` flag is true, otherwise `td`.
                                const Tag = cell.isHeader ? 'th' : 'td';
                                return (
                                    <Tag key={cell._key || cellIndex}>
                                        <CellContent content={cell.content} />
                                    </Tag>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}