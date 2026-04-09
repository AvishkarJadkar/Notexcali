/**
 * Keyboard Shortcuts & Utility Helpers
 * Hardened with error handling and toast feedback.
 */
import { showToast } from './toast.js';

export function setupShortcuts(state) {
    window.addEventListener('keydown', (e) => {
        // Ctrl + S: Prevent default (auto-saves)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showToast('Auto-saved', 'info', 1500);
        }

        // Ctrl + N: New Page
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const btn = document.getElementById('btn-new-page');
            if (btn) btn.click();
        }

        // Ctrl + \: Toggle Sidebar
        if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
            e.preventDefault();
            document.getElementById('toggle-sidebar')?.click();
        }
    });
}

/**
 * Data Export
 */
export async function exportData() {
    try {
        const { db } = await import('./db.js');
        const index = await db.getIndex();
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            pages: {}
        };

        for (const id of index) {
            const page = await db.getPage(id);
            if (page) data.pages[id] = page;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notexcali-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Data exported successfully', 'success');
    } catch (err) {
        console.error('[Export] Failed:', err);
        showToast('Export failed. Please try again.', 'error');
    }
}

/**
 * PDF Export for current page
 */
export async function downloadPageAsPDF() {
    const element = document.getElementById('editor');
    const pageTitle = document.getElementById('page-title')?.innerText || 'Untitled';
    const pageEmoji = document.getElementById('page-emoji')?.innerText || '';

    const opt = {
        margin: [15, 15],
        filename: `${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const btn = document.getElementById('btn-download-pdf');
    let originalContent = '';
    if (btn) {
        originalContent = btn.innerHTML;
        btn.innerHTML = '<span>Generating...</span>';
        btn.disabled = true;
    }

    try {
        // Build a styled container for light-mode PDF
        const container = document.createElement('div');
        container.style.cssText = `
            padding: 40px;
            background: #ffffff;
            color: #000000;
            --text-primary: #000000;
            --text-secondary: #333333;
            --text-muted: #666666;
            --bg-primary: #ffffff;
            --bg-secondary: #f9f9f9;
            --border: #eeeeee;
        `;

        // Header
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="font-size: 36px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 15px;">
                <span>${pageEmoji}</span>
                <span>${pageTitle}</span>
            </div>
            <div style="font-size: 14px; color: #888; margin-bottom: 24px;">Generated on ${new Date().toLocaleDateString()}</div>
            <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 40px;" />
        `;
        container.appendChild(header);

        // Clone and clean editor
        const editorClone = element.cloneNode(true);
        editorClone.querySelectorAll('.canvas-toolbar, .canvas-delete-btn, .block-controls, .editor-click-area').forEach(el => el.remove());
        editorClone.querySelectorAll('.block').forEach(b => {
            b.style.backgroundColor = 'transparent';
            b.style.color = '#000000';
            b.style.paddingLeft = '0';
        });
        editorClone.querySelectorAll('.block-code').forEach(b => {
            b.style.background = '#f8f8f8';
            b.style.color = '#333';
            b.style.border = '1px solid #eee';
            const content = b.querySelector('.block-content');
            if (content) content.style.color = '#333';
        });

        container.appendChild(editorClone);

        // Sync canvas pixel data
        const originalCanvases = element.querySelectorAll('canvas');
        const clonedCanvases = editorClone.querySelectorAll('canvas');
        originalCanvases.forEach((orig, idx) => {
            const clone = clonedCanvases[idx];
            if (clone) {
                clone.width = orig.width;
                clone.height = orig.height;
                clone.style.backgroundColor = 'transparent';
                clone.style.border = 'none';
                const cloneCtx = clone.getContext('2d');
                cloneCtx.drawImage(orig, 0, 0);
            }
        });

        await html2pdf().set(opt).from(container).save();
        showToast('PDF downloaded', 'success');
    } catch (err) {
        console.error('[PDF] Export failed:', err);
        showToast('PDF generation failed. Please try again.', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            if (window.lucide) window.lucide.createIcons();
        }
    }
}
