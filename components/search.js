/**
 * Quick Find / Search Component (Ctrl+K)
 * Searches across all page titles and content.
 */
import { db } from '../utils/db.js';

export class SearchModal {
    constructor(state) {
        this.state = state;
        this.overlay = null;
        this.selectedIndex = 0;
        this.results = [];
        this.allPages = [];
        this.isOpen = false;

        this.setupShortcut();
    }

    setupShortcut() {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    async open() {
        this.isOpen = true;
        this.selectedIndex = 0;

        // Load all pages
        try {
            const index = await db.getIndex() || [];
            const projectIds = await db.getProjectsIndex() || [];

            // Gather all page IDs (root + inside projects)
            const allIds = new Set(index);
            for (const pId of projectIds) {
                try {
                    const proj = await db.getProject(pId);
                    if (proj && proj.pages) {
                        proj.pages.forEach(p => allIds.add(p.id));
                    }
                } catch (_) { /* skip corrupt project */ }
            }

            this.allPages = (await Promise.all(
                [...allIds].map(async id => {
                    try {
                        const page = await db.getPage(id);
                        return page || null;
                    } catch (_) { return null; }
                })
            )).filter(Boolean);
        } catch (err) {
            console.error('Search: failed to load pages', err);
            this.allPages = [];
        }

        this.results = [...this.allPages];
        this.renderOverlay();
    }

    close() {
        this.isOpen = false;
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    renderOverlay() {
        if (this.overlay) this.overlay.remove();

        this.overlay = document.createElement('div');
        this.overlay.className = 'search-overlay';

        const modal = document.createElement('div');
        modal.className = 'search-modal';
        modal.innerHTML = `
            <div class="search-input-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input class="search-input" type="text" placeholder="Search pages..." autofocus />
            </div>
            <div class="search-results"></div>
            <div class="search-footer">
                <span><kbd>↑↓</kbd> Navigate</span>
                <span><kbd>↵</kbd> Open</span>
                <span><kbd>Esc</kbd> Close</span>
            </div>
        `;

        this.overlay.appendChild(modal);
        document.body.appendChild(this.overlay);

        const input = modal.querySelector('.search-input');
        const resultsContainer = modal.querySelector('.search-results');

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Input handler
        input.addEventListener('input', () => {
            const query = input.value.trim().toLowerCase();
            if (!query) {
                this.results = [...this.allPages];
            } else {
                this.results = this.allPages.filter(page => {
                    const titleMatch = (page.title || '').toLowerCase().includes(query);
                    const contentMatch = (page.blocks || []).some(b =>
                        (b.content || '').toLowerCase().includes(query)
                    );
                    return titleMatch || contentMatch;
                });
            }
            this.selectedIndex = 0;
            this.renderResults(resultsContainer);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                this.renderResults(resultsContainer);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.renderResults(resultsContainer);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.selectResult();
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        this.renderResults(resultsContainer);
        requestAnimationFrame(() => input.focus());
    }

    renderResults(container) {
        if (this.results.length === 0) {
            container.innerHTML = '<div class="search-empty">No pages found</div>';
            return;
        }

        container.innerHTML = this.results.map((page, i) => {
            const preview = this.getPreview(page);
            return `
                <div class="search-result-item ${i === this.selectedIndex ? 'selected' : ''}" data-id="${page.id}">
                    <span class="search-result-emoji">${page.emoji || '📄'}</span>
                    <div>
                        <div class="search-result-title">${page.title || 'Untitled'}</div>
                        ${preview ? `<div class="search-result-preview">${preview}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Click handler
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.state.set('currentPageId', item.dataset.id);
                this.close();
            });
        });

        // Scroll selected into view
        const selected = container.querySelector('.selected');
        if (selected) selected.scrollIntoView({ block: 'nearest' });
    }

    getPreview(page) {
        if (!page.blocks || page.blocks.length === 0) return '';
        for (const block of page.blocks) {
            const text = (block.content || '').replace(/<[^>]*>/g, '').trim();
            if (text && text.length > 0) {
                return text.length > 80 ? text.substring(0, 80) + '...' : text;
            }
        }
        return '';
    }

    selectResult() {
        const page = this.results[this.selectedIndex];
        if (page) {
            this.state.set('currentPageId', page.id);
            this.close();
        }
    }
}
