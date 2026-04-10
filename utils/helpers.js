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
 * Strategy: Read block data from DOM, build a CLEAN simple HTML doc
 * with pure inline styles. No DOM cloning, no external CSS.
 * This prevents html2canvas from choking on complex app styles.
 */
export async function downloadPageAsPDF() {
    if (typeof html2pdf === 'undefined') {
        showToast('PDF library not loaded. Please refresh the page.', 'error');
        return;
    }

    const pageTitle = (document.getElementById('page-title')?.innerText || 'Untitled').trim();
    const pageEmoji = (document.getElementById('page-emoji')?.innerText || '').trim();
    const safeFilename = pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'export';

    const btn = document.getElementById('btn-download-pdf');
    let btnOriginal = '';
    if (btn) {
        btnOriginal = btn.innerHTML;
        btn.innerHTML = '<span>Exporting...</span>';
        btn.disabled = true;
    }

    let wrapper = null;

    try {
        // 1. Build a totally clean container with ONLY inline styles
        // html2canvas needs: position:absolute (not fixed), no opacity:0, no visibility:hidden
        // We hide it by clipping a parent container to 0x0
        const clipper = document.createElement('div');
        clipper.style.cssText = 'position:absolute; left:0; top:0; width:1px; height:1px; overflow:hidden; z-index:-9999;';

        wrapper = document.createElement('div');
        wrapper.style.cssText = 'width:700px; background:#fff; padding:40px 50px; font-family: Arial, Helvetica, sans-serif; color:#1a1a1a;';

        // 2. Page header
        const headerHtml = `
            <div style="margin-bottom:30px;">
                <div style="font-size:28px; font-weight:bold; margin-bottom:6px;">${pageEmoji} ${pageTitle}</div>
                <div style="font-size:11px; color:#999; margin-bottom:16px;">Exported from Notexcali • ${new Date().toLocaleDateString()}</div>
                <div style="border-top:1px solid #e5e5e5;"></div>
            </div>
        `;
        wrapper.innerHTML = headerHtml;

        // 3. Read blocks from DOM and build simple styled elements
        const blocks = document.querySelectorAll('#editor .block');
        let numberCounter = 0;

        blocks.forEach(blockEl => {
            const type = blockEl.dataset.type;
            const contentEl = blockEl.querySelector('.block-content');
            const htmlContent = contentEl ? contentEl.innerHTML.trim() : '';

            // Skip truly empty text blocks (no content at all), but keep list/canvas/divider
            const hasContent = htmlContent.length > 0 && htmlContent !== '<br>';
            if (!hasContent && !['canvas', 'divider'].includes(type)) return;

            const div = document.createElement('div');
            div.style.cssText = 'margin-bottom:8px; line-height:1.6;';

            switch (type) {
                case 'h1':
                    div.style.cssText += 'font-size:24px; font-weight:bold; margin-top:20px; margin-bottom:12px;';
                    div.innerHTML = htmlContent;
                    break;
                case 'h2':
                    div.style.cssText += 'font-size:20px; font-weight:bold; margin-top:16px; margin-bottom:10px;';
                    div.innerHTML = htmlContent;
                    break;
                case 'h3':
                    div.style.cssText += 'font-size:17px; font-weight:bold; margin-top:12px; margin-bottom:8px;';
                    div.innerHTML = htmlContent;
                    break;
                case 'bullet':
                    numberCounter = 0;
                    div.style.cssText += 'padding-left:24px; font-size:14px;';
                    div.innerHTML = `<span style="position:absolute; margin-left:-18px;">•</span>${htmlContent}`;
                    div.style.position = 'relative';
                    break;
                case 'number':
                    numberCounter++;
                    div.style.cssText += 'padding-left:28px; font-size:14px;';
                    div.innerHTML = `<span style="position:absolute; margin-left:-24px; font-weight:500;">${numberCounter}.</span>${htmlContent}`;
                    div.style.position = 'relative';
                    break;
                case 'todo':
                    numberCounter = 0;
                    const isChecked = blockEl.querySelector('.todo-checkbox')?.checked;
                    const checkMark = isChecked ? '☑' : '☐';
                    const strikeStyle = isChecked ? 'text-decoration:line-through; color:#999;' : '';
                    div.style.cssText += `padding-left:24px; font-size:14px; ${strikeStyle}`;
                    div.innerHTML = `<span style="position:absolute; margin-left:-22px;">${checkMark}</span>${htmlContent}`;
                    div.style.position = 'relative';
                    break;
                case 'code':
                    numberCounter = 0;
                    div.style.cssText += 'background:#f5f5f5; border:1px solid #e0e0e0; border-radius:4px; padding:12px 16px; font-family:monospace; font-size:13px; white-space:pre-wrap; overflow-wrap:break-word;';
                    div.textContent = contentEl ? contentEl.innerText : '';
                    break;
                case 'quote':
                    numberCounter = 0;
                    div.style.cssText += 'border-left:3px solid #ccc; padding-left:16px; color:#555; font-style:italic; font-size:14px;';
                    div.innerHTML = htmlContent;
                    break;
                case 'divider':
                    numberCounter = 0;
                    div.innerHTML = '<hr style="border:0; border-top:1px solid #ddd; margin:16px 0;">';
                    break;
                case 'canvas':
                    numberCounter = 0;
                    const origCanvas = blockEl.querySelector('canvas');
                    if (origCanvas) {
                        try {
                            const dataUrl = origCanvas.toDataURL('image/png');
                            const img = document.createElement('img');
                            img.src = dataUrl;
                            img.style.cssText = 'max-width:100%; height:auto; border:1px solid #eee; border-radius:4px; margin:10px 0;';
                            div.appendChild(img);
                        } catch (e) {
                            div.textContent = '[Drawing - could not export]';
                        }
                    }
                    break;
                default:
                    // Regular text
                    numberCounter = 0;
                    div.style.cssText += 'font-size:14px;';
                    div.innerHTML = htmlContent;
                    break;
            }

            wrapper.appendChild(div);
        });

        // 4. Mount: wrapper inside clipper, clipper on body
        clipper.appendChild(wrapper);
        document.body.appendChild(clipper);

        // Give browser a frame to paint the DOM before html2canvas captures
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // 5. Generate PDF with lightweight settings
        const opt = {
            margin: [12, 12],
            filename: `${safeFilename}.pdf`,
            image: { type: 'jpeg', quality: 0.92 },
            html2canvas: { scale: 1.5, useCORS: false, logging: false, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(wrapper).save();
        showToast('PDF downloaded!', 'success');

    } catch (err) {
        console.error('[PDF] Export error:', err);
        showToast('PDF export failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        const clipperEl = document.querySelector('[style*="z-index:-9999"]');
        if (clipperEl) clipperEl.remove();
        if (btn) {
            btn.innerHTML = btnOriginal;
            btn.disabled = false;
            if (window.lucide) window.lucide.createIcons();
        }
    }
}
