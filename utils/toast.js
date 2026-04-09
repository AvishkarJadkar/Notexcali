/**
 * Toast Notification System
 * Lightweight, stackable toasts with auto-dismiss.
 */
let containerEl = null;

function ensureContainer() {
    if (!containerEl) {
        containerEl = document.getElementById('toast-container');
        if (!containerEl) {
            containerEl = document.createElement('div');
            containerEl.id = 'toast-container';
            containerEl.className = 'toast-container';
            document.body.appendChild(containerEl);
        }
    }
    return containerEl;
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - Auto-dismiss in ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);

    // Click to dismiss early
    toast.addEventListener('click', () => {
        clearTimeout(timer);
        dismissToast(toast);
    });
}

function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
        toast.remove();
    }, { once: true });
}
