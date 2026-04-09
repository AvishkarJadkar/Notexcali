/**
 * Slash Command Menu — With filter-as-you-type
 */
export class SlashMenu {
    constructor(onSelect) {
        this.onSelect = onSelect;
        this.container = document.createElement('div');
        this.container.className = 'slash-menu';
        this.container.style.display = 'none';
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '1000';

        this.allItems = [
            { id: 'text', label: 'Text', icon: 'align-left', desc: 'Plain text block.' },
            { id: 'h1', label: 'Heading 1', icon: 'heading-1', desc: 'Large section heading.' },
            { id: 'h2', label: 'Heading 2', icon: 'heading-2', desc: 'Medium section heading.' },
            { id: 'h3', label: 'Heading 3', icon: 'heading-3', desc: 'Small section heading.' },
            { id: 'canvas', label: 'Drawing Canvas', icon: 'pen-tool', desc: 'Sketchy drawing canvas.' },
            { id: 'todo', label: 'To-do List', icon: 'check-square', desc: 'Track tasks with a checklist.' },
            { id: 'code', label: 'Code Block', icon: 'code', desc: 'Capture code snippets.' }
        ];

        this.filteredItems = [...this.allItems];
        this.selectedIndex = 0;
        this.filterQuery = '';

        this.render();
        document.body.appendChild(this.container);
        this.setupListeners();
    }

    render() {
        const itemsHtml = this.filteredItems.length > 0
            ? this.filteredItems.map((item, i) => `
                <div class="slash-item ${i === this.selectedIndex ? 'selected' : ''}" data-id="${item.id}">
                    <div class="slash-icon">
                        <i data-lucide="${item.icon}" size="14"></i>
                    </div>
                    <div class="slash-info">
                        <div class="slash-label">${item.label}</div>
                        <div class="slash-desc">${item.desc}</div>
                    </div>
                </div>
            `).join('')
            : '<div class="slash-no-results">No blocks found</div>';

        this.container.innerHTML = `
            <div class="slash-menu-header">Basic Blocks</div>
            <div class="slash-menu-list">${itemsHtml}</div>
        `;

        if (window.lucide) window.lucide.createIcons();
    }

    show(x, y) {
        // Viewport boundary detection
        const menuWidth = 300;
        const menuHeight = 360;
        let finalX = x;
        let finalY = y;

        if (x + menuWidth > window.innerWidth) {
            finalX = window.innerWidth - menuWidth - 16;
        }
        if (y + menuHeight > window.innerHeight) {
            finalY = y - menuHeight - 20; // Show above
        }
        finalX = Math.max(8, finalX);
        finalY = Math.max(8, finalY);

        this.container.style.left = `${finalX}px`;
        this.container.style.top = `${finalY}px`;
        this.container.style.display = 'block';
        this.selectedIndex = 0;
        this.filterQuery = '';
        this.filteredItems = [...this.allItems];
        this.render();
    }

    hide() {
        this.container.style.display = 'none';
        this.filterQuery = '';
        this.filteredItems = [...this.allItems];
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

    /**
     * Filter items as user types after '/'
     */
    applyFilter(query) {
        this.filterQuery = query.toLowerCase();
        if (!this.filterQuery) {
            this.filteredItems = [...this.allItems];
        } else {
            this.filteredItems = this.allItems.filter(item =>
                item.label.toLowerCase().includes(this.filterQuery) ||
                item.id.includes(this.filterQuery)
            );
        }
        this.selectedIndex = 0;
        this.render();
    }

    handleKeyDown(e) {
        if (!this.isVisible()) return false;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.filteredItems.length > 0) {
                this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
            }
            this.render();
            return true;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.filteredItems.length > 0) {
                this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
            }
            this.render();
            return true;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.filteredItems.length > 0) {
                this.onSelect(this.filteredItems[this.selectedIndex].id);
            }
            this.hide();
            return true;
        }
        if (e.key === 'Escape') {
            this.hide();
            return true;
        }

        // Filter-as-you-type: if it's a character key, update filter
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.key !== '/') {
            // We let the character through to the content, but also filter
            setTimeout(() => {
                // Read the current block content to find the text after "/"
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const node = selection.focusNode;
                    if (node) {
                        const text = node.textContent || '';
                        const slashIdx = text.lastIndexOf('/');
                        if (slashIdx !== -1) {
                            const query = text.substring(slashIdx + 1);
                            this.applyFilter(query);
                        }
                    }
                }
            }, 0);
            return false; // Let the character go through
        }

        if (e.key === 'Backspace') {
            // Re-filter after backspace
            setTimeout(() => {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const node = selection.focusNode;
                    if (node) {
                        const text = node.textContent || '';
                        const slashIdx = text.lastIndexOf('/');
                        if (slashIdx !== -1) {
                            const query = text.substring(slashIdx + 1);
                            this.applyFilter(query);
                        } else {
                            this.hide();
                        }
                    }
                }
            }, 0);
            return false;
        }

        return false;
    }
}
