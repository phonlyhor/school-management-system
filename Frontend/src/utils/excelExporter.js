/**
 * Utility for exporting JSON data to CSV/Excel files with full UTF-8 BOM support (for Khmer script in Microsoft Excel).
 */

/**
 * Clean string value for CSV format (escape quotes and commas)
 */
const formatCSVCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
};

/**
 * Export data array to CSV file
 * @param {string} filename - Output filename (e.g. 'Student_List.csv')
 * @param {Array<{header: string, accessor: string|function}>} columns - Column configurations
 * @param {Array<Object>} data - Array of data objects
 */
export const exportToCSV = (filename = 'export.csv', columns = [], data = []) => {
    if (!data || data.length === 0) {
        alert("មិនមានទិន្នន័យសម្រាប់ទាញយកទេ! (No data available to export)");
        return;
    }

    try {
        // Build Headers Row
        const headers = columns.map(col => formatCSVCell(col.header)).join(',');
        
        // Build Data Rows
        const rows = data.map(row => {
            return columns.map(col => {
                let value = '';
                if (typeof col.renderText === 'function') {
                    value = col.renderText(row);
                } else if (typeof col.render === 'function') {
                    const res = col.render(row);
                    value = typeof res === 'string' || typeof res === 'number' ? res : (row[col.accessor] || '');
                } else if (col.accessor) {
                    value = row[col.accessor];
                }
                return formatCSVCell(value);
            }).join(',');
        });

        // Combine header + rows with UTF-8 BOM (\uFEFF) for Microsoft Excel Khmer script compatibility
        const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
        
        // Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Export CSV Error:', err);
        alert('មានបញ្ហាក្នុងការទាញយក File Excel: ' + err.message);
    }
};

export default { exportToCSV };
