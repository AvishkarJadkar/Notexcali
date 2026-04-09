/**
 * Confirm Dialog System
 * Promise-based replacement for native confirm().
 * Returns a Promise<boolean>.
 */

/**
 * Show a styled confirm dialog
 * @param {Object} options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message/description
 * @param {string} [options.confirmText='Confirm'] - Confirm button label
 * @param {string} [options.cancelText='Cancel'] - Cancel button label
 * @param {boolean} [options.danger=false] - Use red/danger styling for confirm
 * @returns {Promise<boolean>}
 */
export function showConfirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-title">${title}</div>
            <div class="confirm-message">${message}</div>
            <div class="confirm-actions">
                <button class="btn btn-ghost confirm-cancel">${cancelText}</button>
                <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} confirm-ok">${confirmText}</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function cleanup(result) {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
            resolve(result);
        }

        function keyHandler(e) {
            if (e.key === 'Escape') cleanup(false);
            if (e.key === 'Enter') cleanup(true);
        }

        document.addEventListener('keydown', keyHandler);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });
        dialog.querySelector('.confirm-cancel').addEventListener('click', () => cleanup(false));
        dialog.querySelector('.confirm-ok').addEventListener('click', () => cleanup(true));

        // Auto-focus the confirm button
        requestAnimationFrame(() => {
            dialog.querySelector('.confirm-ok').focus();
        });
    });
}
