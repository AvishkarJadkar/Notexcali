/**
 * Keyboard Shortcuts Manager
 */
export function setupShortcuts(state) {
    window.addEventListener('keydown', (e) => {
        // Ctrl + S: Prevent default (app auto-saves anyway)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            console.log('Saved (Auto)');
        }

        // Ctrl + N: New Page
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const btn = document.querySelector('.nav-group:last-child .nav-item:first-child');
            if (btn) btn.click();
        }

        // Ctrl + \: Toggle Sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
            e.preventDefault();
            document.getElementById('toggle-sidebar').click();
        }
    });
}

/**
 * Data Export/Import
 */
export async function exportData() {
    const { db } = await import('./db.js');
    const index = await db.getIndex();
    const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        pages: {}
    };

    for (const id of index) {
        data.pages[id] = await db.getPage(id);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notexcali-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}
