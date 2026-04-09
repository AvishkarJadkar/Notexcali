/**
 * Sidebar Component
 */
import { db } from './utils/db.js';

export class Sidebar {
    constructor(state) {
        this.state = state;
        this.container = document.querySelector('.sidebar-content');
        this.pageListEl = document.getElementById('page-list');
        this.init();
    }

    async init() {
        this.render();
        this.setupListeners();
        
        // Listen for state changes
        this.state.on('change:pages', () => this.render());
    }

    async render() {
        const pageIds = await db.getIndex() || [];
        const pages = await Promise.all(pageIds.map(id => db.getPage(id)));
        
        this.pageListEl.innerHTML = pages.map(page => `
            <div class="nav-item ${this.state.get('currentPageId') === page.id ? 'active' : ''}" data-id="${page.id}">
                <span class="page-emoji">${page.emoji || '📄'}</span>
                <span>${page.title || 'Untitled'}</span>
            </div>
        `).join('');

        // Re-initialize icons if needed (though we're using emojis for now)
    }

    setupListeners() {
        this.pageListEl.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (item) {
                const id = item.dataset.id;
                this.state.set('currentPageId', id);
                this.render(); // Update active state
            }
        });

        // "New Page" button
        const newPageBtn = document.getElementById('btn-new-page');
        if (newPageBtn) {
            newPageBtn.addEventListener('click', () => this.createNewPage());
        }
    }

    async createNewPage() {
        const id = 'page-' + Math.random().toString(36).substr(2, 9);
        const newPage = {
            id,
            title: 'Untitled',
            emoji: '📄',
            createdAt: Date.now(),
            blocks: [{ id: 'b1', type: 'text', content: '' }]
        };

        await db.savePage(newPage);
        const index = await db.getIndex() || [];
        index.push(id);
        await db.saveIndex(index);

        this.state.set('currentPageId', id);
        this.render();
    }
}
