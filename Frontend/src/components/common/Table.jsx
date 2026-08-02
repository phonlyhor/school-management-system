import styles from './Table.module.css';

const Table = ({ columns, data, keyField = 'id', onRowClick }) => {
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className={styles.th}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? (
                        data.map((row) => (
                            <tr 
                                key={row[keyField]} 
                                className={styles.tr}
                                onClick={() => onRowClick && onRowClick(row)}
                                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                            >
                                {columns.map((col, index) => (
                                    <td key={index} className={styles.td}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyState}>
                                No data available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
