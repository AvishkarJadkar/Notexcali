/**
 * Slash Command Menu
 */
export class SlashMenu {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.container = document.createElement('div');
        this.container.className = 'slash-menu glass-panel animate-fade-in';
        this.container.style.display = 'none';
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '1000';
        
        this.items = [
            { id: 'text', label: 'Text', icon: 'align-left', desc: 'Just start writing with plain text.' },
            { id: 'h1', label: 'Heading 1', icon: 'heading-1', desc: 'Large section heading.' },
            { id: 'h2', label: 'Heading 2', icon: 'heading-2', desc: 'Medium section heading.' },
            { id: 'h3', label: 'Heading 3', icon: 'heading-3', desc: 'Small section heading.' },
            { id: 'canvas', label: 'Drawing Canvas', icon: 'pen-tool', desc: 'Embed a sketchy drawing canvas.' },
            { id: 'todo', label: 'To-do List', icon: 'check-square', desc: 'Track tasks with a checklist.' },
            { id: 'code', label: 'Code Block', icon: 'code', desc: 'Capture code snippets.' }
        ];

        this.selectedIndex = 0;
        this.render();
        document.body.appendChild(this.container);
        
        this.setupListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="slash-menu-header">Basic Blocks</div>
            <div class="slash-menu-list">
                ${this.items.map((item, i) => `
                    <div class="slash-item ${i === this.selectedIndex ? 'selected' : ''}" data-id="${item.id}">
                        <div class="slash-icon">
                            <i data-lucide="${item.icon}" size="16"></i>
                        </div>
                        <div class="slash-info">
                            <div class="slash-label">${item.label}</div>
                            <div class="slash-desc">${item.desc}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }

    show(x, y) {
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
        this.container.style.display = 'block';
        this.selectedIndex = 0;
        this.render();
    }

    hide() {
        this.container.style.display = 'none';
    }

    isVisible() {
        return this.container.style.display === 'block';
    }

    setupListeners() {
        this.container.addEventListener('mousedown', (e) => {
            const item = e.target.closest('.slash-item');
            if (item) {
                this.onSelect(item.dataset.id);
                this.hide();
            }
        });
    }

    handleKeyDown(e) {
        if (!this.isVisible()) return false;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
            this.render();
            return true;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
            this.render();
            return true;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            this.onSelect(this.items[this.selectedIndex].id);
            this.hide();
            return true;
        }
        if (e.key === 'Escape') {
            this.hide();
            return true;
        }
        return false;
    }
}
