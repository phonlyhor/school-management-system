export const enableInspectProtection = () => {
    // Allow Inspect Element during local development (npm run dev / localhost)
    if (import.meta.env.DEV) {
        return;
    }

    // Disable Right Click context menu in Production / Hosting
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U in Production / Hosting
    document.addEventListener('keydown', (e) => {
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U (View Source)
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // Security warning in devtools if opened in Production
    console.log('%c⚠️ ព្រមានសុវត្ថិភាព (Security Warning)', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cប្រព័ន្ធត្រូវបានការពារដោយសុវត្ថិភាព។ (Developer tools disabled on live server).', 'color: orange; font-size: 14px;');
};


