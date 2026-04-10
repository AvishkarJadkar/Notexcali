/**
 * Sidebar Component — With page delete, projects, drag & drop
 * Hardened with error handling and debounced rendering.
 */
import { db } from './utils/db.js';
import { EmojiPicker } from './components/emoji-picker.js';
import { showConfirm } from './utils/confirm.js';
import { showToast } from './utils/toast.js';

export class Sidebar {
    constructor(state) {
        this.state = state;
        this.container = document.querySelector('.sidebar-content');
        this.pageListEl = document.getElementById('page-list');
        this.projectListEl = document.getElementById('project-list');
        this.emojiPicker = new EmojiPicker((emoji) => this.handleProjectEmojiSelect(emoji));
        this.activeProjectForEmoji = null;
        this._renderRAF = null; // For debounced rendering
        this.init();
    }

    async init() {
        this.render();
        this.setupListeners();

        // Listen for state changes — debounced via RAF
        this.state.on('change:pages', () => this.scheduleRender());
        this.state.on('change:projects', () => this.scheduleRender());
    }

    /**
     * Coalesce rapid state changes into a single render.
     */
    scheduleRender() {
        if (this._renderRAF) cancelAnimationFrame(this._renderRAF);
        this._renderRAF = requestAnimationFrame(() => this.render());
    }

    async render() {
        try {
            // 1. Render Root Pages
            const pageIds = await db.getIndex() || [];
            const pages = (await Promise.all(pageIds.map(id => db.getPage(id)))).filter(Boolean);

            this.pageListEl.innerHTML = pages.map(page => `
                <div class="nav-item ${this.state.get('currentPageId') === page.id ? 'active' : ''}" 
                     data-id="${page.id}" draggable="true">
                    <span class="page-emoji">${page.emoji || '📄'}</span>
                    <span class="page-title-text">${page.title || 'Untitled'}</span>
                    <div class="nav-item-actions">
                        <button class="nav-item-action-btn delete-page-btn" data-id="${page.id}" title="Delete page">
                            <i data-lucide="trash-2" size="12"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // 2. Render Projects
            const projectIds = await db.getProjectsIndex() || [];
            const projects = (await Promise.all(projectIds.map(id => db.getProject(id)))).filter(Boolean);

            this.projectListEl.innerHTML = (await Promise.all(projects.map(async project => {
                const projectPages = (await Promise.all(
                    project.pages.map(p => db.getPage(p.id))
                )).filter(Boolean);
                const isActive = project.pages.some(p => p.id === this.state.get('currentPageId'));

                return `
                    <div class="project-group ${isActive ? 'expanded' : ''}" data-project-id="${project.id}">
                        <div class="nav-item project-header" data-id="${project.id}">
                            <i data-lucide="chevron-right" class="chevron"></i>
                            <span class="page-emoji project-emoji-trigger" data-project-id="${project.id}">${project.emoji || '📁'}</span>
                            <span class="project-title-edit" contenteditable="true" spellcheck="false" data-project-id="${project.id}">${project.title || 'New Project'}</span>
                        </div>
                        <div class="project-pages">
                            ${projectPages.map(page => `
                                <div class="nav-item nested ${this.state.get('currentPageId') === page.id ? 'active' : ''}" 
                                     data-id="${page.id}" draggable="true">
                                    <span class="page-emoji">${page.emoji || '📄'}</span>
                                    <span class="page-title-text">${page.title || 'Untitled'}</span>
                                    <div class="nav-item-actions">
                                        <button class="nav-item-action-btn delete-page-btn" data-id="${page.id}" title="Delete page">
                                            <i data-lucide="trash-2" size="12"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }))).join('');

            if (window.lucide) window.lucide.createIcons();
            this.setupDragEvents();
        } catch (err) {
            console.error('[Sidebar] Render failed:', err);
        }
    }

    setupListeners() {
        // Click handling for pages (event delegation)
        document.addEventListener('click', (e) => {
            // Delete page button
            const deleteBtn = e.target.closest('.delete-page-btn');
            if (deleteBtn) {
                e.stopPropagation();
                this.deletePage(deleteBtn.dataset.id);
                return;
            }

            const item = e.target.closest('.nav-item');
            if (item && !item.classList.contains('project-header')) {
                const id = item.dataset.id;
                if (id && (id.startsWith('page-') || id === 'welcome-page')) {
                    this.state.set('currentPageId', id);
                    this.scheduleRender();
                }
            }

            // Toggle project expansion
            const projectHeader = e.target.closest('.project-header');
            if (projectHeader && !e.target.classList.contains('project-title-edit') && !e.target.classList.contains('project-emoji-trigger')) {
                const group = projectHeader.closest('.project-group');
                group.classList.toggle('expanded');
            }

            // Project Emoji Click
            const emojiTrigger = e.target.closest('.project-emoji-trigger');
            if (emojiTrigger) {
                e.stopPropagation();
                this.activeProjectForEmoji = emojiTrigger.dataset.projectId;
                const rect = emojiTrigger.getBoundingClientRect();
                this.emojiPicker.show(rect.left, rect.bottom + 8);
            }
        });

        // Project Title Change
        this.projectListEl.addEventListener('input', (e) => {
            if (e.target.classList.contains('project-title-edit')) {
                this.handleProjectTitleChange(e.target.dataset.projectId, e.target.innerText);
            }
        });

        // Prevent Enter in project title
        this.projectListEl.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('project-title-edit') && e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });

        // "New Page" button
        const newPageBtn = document.getElementById('btn-new-page');
        if (newPageBtn) {
            newPageBtn.addEventListener('click', () => this.createNewPage());
        }

        // "New Project" button
        const newProjectBtn = document.getElementById('btn-new-project');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.createNewProject();
            });
        }
    }

    setupDragEvents() {
        const items = this.container.querySelectorAll('.nav-item[draggable="true"]');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('pageId', item.dataset.id);
                item.classList.add('dragging-sidebar');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging-sidebar');
            });
        });

        const projects = this.container.querySelectorAll('.project-group');
        projects.forEach(project => {
            project.addEventListener('dragover', (e) => {
                e.preventDefault();
                project.classList.add('drag-over');
            });
            project.addEventListener('dragleave', () => {
                project.classList.remove('drag-over');
            });
            project.addEventListener('drop', async (e) => {
                e.preventDefault();
                project.classList.remove('drag-over');
                const pageId = e.dataTransfer.getData('pageId');
                const projectId = project.dataset.projectId;
                if (pageId && projectId) {
                    await this.movePageToProject(pageId, projectId);
                }
            });
        });
    }

    async createNewPage() {
        try {
            const id = 'page-' + Math.random().toString(36).substr(2, 9);
            const newPage = {
                id,
                title: 'Untitled',
                emoji: '📄',
                createdAt: Date.now(),
                blocks: [{ id: 'b-' + Math.random().toString(36).substr(2, 9), type: 'text', content: '' }]
            };

            await db.savePage(newPage);
            const index = await db.getIndex() || [];
            index.push(id);
            await db.saveIndex(index);

            this.state.set('currentPageId', id);
            this.scheduleRender();
            setTimeout(() => this.state.emit('request:emoji-picker'), 100);
        } catch (err) {
            console.error('[Sidebar] Create page failed:', err);
            showToast('Failed to create page', 'error');
        }
    }

    async deletePage(pageId) {
        try {
            const page = await db.getPage(pageId);
            const title = page ? page.title : 'this page';

            const confirmed = await showConfirm({
                title: 'Delete page?',
                message: `"${title}" will be permanently deleted. This cannot be undone.`,
                confirmText: 'Delete',
                danger: true
            });

            if (!confirmed) return;

            // Remove from root index
            let rootIndex = await db.getIndex();
            rootIndex = rootIndex.filter(id => id !== pageId);
            await db.saveIndex(rootIndex);

            // Remove from all projects
            const projectIds = await db.getProjectsIndex();
            for (const pId of projectIds) {
                try {
                    const proj = await db.getProject(pId);
                    if (proj) {
                        const idx = proj.pages.findIndex(p => p.id === pageId);
                        if (idx !== -1) {
                            proj.pages.splice(idx, 1);
                            await db.saveProject(proj);
                        }
                    }
                } catch (_) { /* skip corrupted project */ }
            }

            // Delete the page data
            await db.deletePage(pageId);

            // If the deleted page was active, switch to another
            if (this.state.get('currentPageId') === pageId) {
                const newIndex = await db.getIndex();
                if (newIndex.length > 0) {
                    this.state.set('currentPageId', newIndex[0]);
                } else {
                    // Create a fresh page if none left
                    await this.createNewPage();
                    return;
                }
            }

            showToast('Page deleted', 'success');
            this.scheduleRender();
        } catch (err) {
            console.error('[Sidebar] Delete page failed:', err);
            showToast('Failed to delete page', 'error');
        }
    }

    async createNewProject() {
        try {
            const id = 'project-' + Math.random().toString(36).substr(2, 9);
            const newProject = {
                id,
                title: 'New Project',
                emoji: '📁',
                pages: []
            };

            await db.saveProject(newProject);
            const index = await db.getProjectsIndex() || [];
            index.push(id);
            await db.saveProjectsIndex(index);

            this.state.emit('change:projects');
            showToast('Project created', 'success');
        } catch (err) {
            console.error('[Sidebar] Create project failed:', err);
            showToast('Failed to create project', 'error');
        }
    }

    async movePageToProject(pageId, projectId) {
        try {
            const project = await db.getProject(projectId);
            if (!project) return;

            // Remove from all other projects
            const projectIds = await db.getProjectsIndex();
            for (const id of projectIds) {
                try {
                    const p = await db.getProject(id);
                    if (p) {
                        const idx = p.pages.findIndex(page => page.id === pageId);
                        if (idx !== -1) {
                            p.pages.splice(idx, 1);
                            await db.saveProject(p);
                        }
                    }
                } catch (_) { /* skip */ }
            }

            // Remove from root index
            let rootIndex = await db.getIndex();
            rootIndex = rootIndex.filter(id => id !== pageId);
            await db.saveIndex(rootIndex);

            // Add to target project
            project.pages.push({ id: pageId, movedAt: Date.now() });
            await db.saveProject(project);

            this.scheduleRender();
        } catch (err) {
            console.error('[Sidebar] Move page failed:', err);
            showToast('Failed to move page', 'error');
        }
    }

    async handleProjectTitleChange(projectId, newTitle) {
        try {
            const project = await db.getProject(projectId);
            if (project) {
                project.title = newTitle;
                await db.saveProject(project);
            }
        } catch (err) {
            console.error('[Sidebar] Project title change failed:', err);
        }
    }

    async handleProjectEmojiSelect(emoji) {
        try {
            if (!this.activeProjectForEmoji) return;
            const project = await db.getProject(this.activeProjectForEmoji);
            if (project) {
                project.emoji = emoji;
                await db.saveProject(project);
                this.scheduleRender();
            }
        } catch (err) {
            console.error('[Sidebar] Project emoji change failed:', err);
        }
    }
}
