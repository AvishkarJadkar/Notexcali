/**
 * Emoji Picker Component
 * Clean, positioned, with click-away dismiss.
 */
export class EmojiPicker {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.container = document.createElement('div');
        this.container.className = 'emoji-picker';
        this.container.style.display = 'none';
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '1000';

        // Curated set of popular emojis
        this.emojis = [
            '🚀', '✨', '📝', '💡', '🎨', '🧠', '📅', '✅',
            '🔥', '🎯', '🛠️', '💻', '🔒', '📦', '📊', '🌐',
            '📁', '📎', '📌', '📖', '🔍', '⚙️', '🔔', '💬',
            '👤', '🏠', '🌍', '⚡', '🌟', '💎', '🌈', '🍀',
            '🍎', '☕', '🍕', '🍰', '🏃', '🧘', '🎧', '📸'
        ];

        this.render();
        document.body.appendChild(this.container);
        this.setupListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="emoji-picker-header">Quick Picks</div>
            <div class="emoji-grid">
                ${this.emojis.map(emoji => `
                    <div class="emoji-item" data-emoji="${emoji}">${emoji}</div>
                `).join('')}
            </div>
        `;
    }

    show(x, y) {
        const pickerWidth = 280;
        const pickerHeight = 280;

        let finalX = Math.max(8, x);
        let finalY = y;

        if (x + pickerWidth > window.innerWidth) {
            finalX = window.innerWidth - pickerWidth - 16;
        }
        if (y + pickerHeight > window.innerHeight) {
            finalY = window.innerHeight - pickerHeight - 16;
        }

        this.container.style.left = `${finalX}px`;
        this.container.style.top = `${finalY}px`;
        this.container.style.display = 'block';

        // Click-away listener
        this.bindClickAway = (e) => {
            if (!this.container.contains(e.target)) {
                this.hide();
            }
        };
        setTimeout(() => {
            window.addEventListener('click', this.bindClickAway);
        }, 10);
    }

    hide() {
        this.container.style.display = 'none';
        if (this.bindClickAway) {
            window.removeEventListener('click', this.bindClickAway);
        }
    }

    isVisible() {
        return this.container.style.display === 'block';
    }

    setupListeners() {
        this.container.addEventListener('click', (e) => {
            const item = e.target.closest('.emoji-item');
            if (item) {
                const emoji = item.dataset.emoji;
                this.onSelect(emoji);
                this.hide();
            }
        });
    }
}
