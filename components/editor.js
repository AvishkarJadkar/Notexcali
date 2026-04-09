/**
 * Block-based Editor Engine
 * Premium: debounced save, page transitions, smart focus, empty states.
 */
import { db } from '../utils/db.js';
import { SlashMenu } from './menu.js';
import { DrawingCanvas } from './canvas.js';
import { EmojiPicker } from './emoji-picker.js';
import { showToast } from '../utils/toast.js';

export class Editor {
    constructor(state) {
        this.state = state;
        this.container = document.getElementById('editor');
        this.editorWrapper = document.getElementById('editor-wrapper');
        this.titleEl = document.getElementById('page-title');
        this.emojiEl = document.getElementById('page-emoji');
        this.saveStatusEl = document.getElementById('save-status');

        this.slashMenu = new SlashMenu((type) => this.transformBlock(this.currentBlockId, type));
        this.emojiPicker = new EmojiPicker((emoji) => this.updateEmoji(emoji));

        this.currentBlockId = null;
        this.canvases = new Map();

        // Debounced save
        this._saveTimer = null;
        this._saveDelay = 400;

        this.init();
    }

    init() {
        this.setupListeners();
        this.state.on('change:currentPageId', (id) => this.loadPage(id));
        this.state.on('request:emoji-picker', () => this.openEmojiPicker());

        // Load initial page
        this.loadPage(this.state.get('currentPageId'));
    }

    async loadPage(id) {
        if (!id) return;

        try {
            // Page transition — fade out
            this.editorWrapper.classList.add('page-entering');

            const page = await db.getPage(id);
            if (!page) {
                this.container.innerHTML = '';
                showToast('Page not found', 'error');
                return;
            }

            // Update UI
            this.titleEl.innerText = page.title || 'Untitled';
            this.emojiEl.innerText = page.emoji || '📄';

            const crumbs = document.getElementById('current-page-crumbs');
            if (crumbs) {
                crumbs.innerText = `Workspace / ${page.title || 'Untitled'}`;
            }

            this.renderBlocks(page.blocks);

            // Page transition — fade in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.editorWrapper.classList.remove('page-entering');
                });
            });
        } catch (err) {
            console.error('[Editor] Failed to load page:', err);
            showToast('Failed to load page', 'error');
        }
    }

    renderBlocks(blocks) {
        this.container.innerHTML = '';
        this.canvases.clear();

        if (!blocks || blocks.length === 0) {
            this.addBlockAfter(null);
            return;
        }

        const fragment = document.createDocumentFragment();

        blocks.forEach(block => {
            const blockEl = this.createBlockElement(block);
            fragment.appendChild(blockEl);
        });

        // Clickable area at the bottom
        const addArea = document.createElement('div');
        addArea.className = 'editor-click-area';
        addArea.addEventListener('click', () => {
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock) {
                this.addBlockAfter(lastBlock.id);
            }
        });
        fragment.appendChild(addArea);

        this.container.appendChild(fragment);

        // Single Lucide pass for all blocks
        if (window.lucide) window.lucide.createIcons();
    }

    createBlockElement(block) {
        const div = document.createElement('div');
        div.className = `block block-${block.type}`;
        div.dataset.id = block.id;
        div.dataset.type = block.type;

        if (block.checked) div.classList.add('checked');

        // Block Controls
        const controls = document.createElement('div');
        controls.className = 'block-controls';
        controls.innerHTML = `
            <div class="block-action-btn drag-handle" draggable="true" title="Drag to reorder"><i data-lucide="grip-vertical" size="12"></i></div>
        `;

        const handle = controls.querySelector('.drag-handle');

        // Prevent SVG from stealing drag
        setTimeout(() => {
            const icon = handle.querySelector('svg');
            if (icon) icon.style.pointerEvents = 'none';
        }, 50);

        // Drag engine
        handle.addEventListener('dragstart', (e) => {
            div.classList.add('dragging');
            if (e.dataTransfer.setDragImage) {
                e.dataTransfer.setDragImage(div, 10, 10);
            }
            e.dataTransfer.setData('blockId', block.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        handle.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            this.container.querySelectorAll('.block').forEach(b => {
                b.classList.remove('drop-target-above');
            });
        });

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            div.classList.add('drop-target-above');
        });

        div.addEventListener('dragleave', () => {
            div.classList.remove('drop-target-above');
        });

        div.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('blockId');
            if (draggedId === block.id) return;

            try {
                const page = await db.getPage(this.state.get('currentPageId'));
                if (!page) return;
                const draggedIdx = page.blocks.findIndex(b => b.id === draggedId);

                if (draggedIdx !== -1) {
                    const [draggedBlock] = page.blocks.splice(draggedIdx, 1);
                    const newTargetIdx = page.blocks.findIndex(b => b.id === block.id);
                    page.blocks.splice(newTargetIdx, 0, draggedBlock);

                    await db.savePage(page);
                    this.renderBlocks(page.blocks);
                }
            } catch (err) {
                console.error('[Editor] Block drop failed:', err);
            }
        });

        div.appendChild(controls);

        const content = document.createElement('div');
        content.className = 'block-content';
        content.contentEditable = block.type !== 'canvas';
        content.spellcheck = false;
        content.innerHTML = block.content || '';
        content.dataset.placeholder = this.getPlaceholder(block.type);

        // Todo
        if (block.type === 'todo') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = block.checked || false;
            checkbox.addEventListener('change', (e) => {
                div.classList.toggle('checked', e.target.checked);
                this.debouncedSave();
            });
            div.appendChild(checkbox);
        }

        // Code
        if (block.type === 'code') {
            content.classList.add('language-javascript');
        }

        div.appendChild(content);

        // Canvas
        if (block.type === 'canvas') {
            content.style.display = 'none';
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'canvas-wrapper-inner';
            canvasWrapper.style.width = '100%';
            canvasWrapper.style.minHeight = '440px';
            div.appendChild(canvasWrapper);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'canvas-delete-btn';
            deleteBtn.title = 'Delete this drawing';
            deleteBtn.innerHTML = '<i data-lucide="x" size="14"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBlock(block.id);
            });
            div.appendChild(deleteBtn);

            const canvas = new DrawingCanvas(canvasWrapper, block, () => this.debouncedSave());
            this.canvases.set(block.id, canvas);
            requestAnimationFrame(() => canvas.resize());
        }

        // Keyboard Events (non-canvas)
        if (block.type !== 'canvas') {
            content.addEventListener('keydown', (e) => {
                if (this.slashMenu.handleKeyDown(e)) return;

                // Rapid Delete (Ctrl+Shift+Backspace)
                if (e.ctrlKey && e.shiftKey && e.key === 'Backspace') {
                    e.preventDefault();
                    this.removeBlock(block.id);
                    return;
                }

                // Arrow Up navigation
                if (e.key === 'ArrowUp') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        if (range.startOffset < 2) {
                            const prev = div.previousElementSibling;
                            if (prev) {
                                e.preventDefault();
                                const target = prev.querySelector('.block-content');
                                if (target) target.focus();
                            }
                        }
                    }
                }

                // Arrow Down navigation
                if (e.key === 'ArrowDown') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const contentLen = content.innerText.length;
                        if (range.startOffset >= contentLen - 1) {
                            const next = div.nextElementSibling;
                            if (next) {
                                e.preventDefault();
                                const target = next.querySelector('.block-content');
                                if (target) target.focus();
                            }
                        }
                    }
                }

                // Enter — new block
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addBlockAfter(block.id);
                }

                // Slash command
                if (e.key === '/') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        this.slashMenu.show(rect.left, rect.bottom + 8);
                    }
                } else {
                    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') {
                        this.slashMenu.hide();
                    }
                }

                // Backspace
                if (e.key === 'Backspace') {
                    const isEmpty = content.innerText.trim() === '';
                    if (isEmpty) {
                        e.preventDefault();
                        if (block.type !== 'text') {
                            this.transformBlock(block.id, 'text');
                        } else {
                            this.removeBlock(block.id);
                        }
                    }
                }
            });
        }

        content.addEventListener('input', () => this.handleInput(block, content));
        content.addEventListener('focus', () => {
            this.currentBlockId = block.id;
        });

        // Highlight code
        if (block.type === 'code' && window.Prism) {
            setTimeout(() => window.Prism.highlightElement(content), 0);
        }

        return div;
    }

    getPlaceholder(type) {
        switch (type) {
            case 'h1': return 'Heading 1';
            case 'h2': return 'Heading 2';
            case 'h3': return 'Heading 3';
            default: return "Type '/' for commands...";
        }
    }

    handleInput(block, el) {
        block.content = el.innerHTML;
        this.debouncedSave();
    }

    /**
     * Debounced save — waits 400ms after last keystroke before writing to DB.
     */
    debouncedSave() {
        // Update status indicator immediately
        if (this.saveStatusEl) {
            this.saveStatusEl.textContent = 'Saving...';
            this.saveStatusEl.classList.add('saving');
        }

        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.savePage(), this._saveDelay);
    }

    async transformBlock(blockId, newType) {
        try {
            const page = await db.getPage(this.state.get('currentPageId'));
            if (!page) return;
            const index = page.blocks.findIndex(b => b.id === blockId);

            if (index !== -1) {
                const block = page.blocks[index];
                block.type = newType;
                if (block.content === '/') block.content = '';

                await db.savePage(page);
                this.renderBlocks(page.blocks);

                setTimeout(() => {
                    const el = this.container.querySelector(`[data-id="${blockId}"] .block-content`);
                    if (el) el.focus();
                }, 0);
            }
        } catch (err) {
            console.error('[Editor] Transform block failed:', err);
        }
    }

    async addBlockAfter(afterId) {
        try {
            const pageId = this.state.get('currentPageId');
            const page = await db.getPage(pageId);
            if (!page) return;

            const index = afterId ? page.blocks.findIndex(b => b.id === afterId) : -1;
            const newBlock = {
                id: 'b-' + Math.random().toString(36).substr(2, 9),
                type: 'text',
                content: ''
            };

            page.blocks.splice(index + 1, 0, newBlock);
            await db.savePage(page);
            this.renderBlocks(page.blocks);

            setTimeout(() => {
                const el = this.container.querySelector(`[data-id="${newBlock.id}"] .block-content`);
                if (el) el.focus();
            }, 0);
        } catch (err) {
            console.error('[Editor] Add block failed:', err);
        }
    }

    async removeBlock(id) {
        try {
            const page = await db.getPage(this.state.get('currentPageId'));
            if (!page) return;
            const index = page.blocks.findIndex(b => b.id === id);

            if (index !== -1) {
                const prevId = index > 0 ? page.blocks[index - 1].id : null;
                page.blocks.splice(index, 1);

                if (page.blocks.length === 0) {
                    page.blocks.push({ id: 'b-' + Math.random().toString(36).substr(2, 9), type: 'text', content: '' });
                }

                await db.savePage(page);
                this.renderBlocks(page.blocks);

                if (prevId) {
                    setTimeout(() => {
                        const el = this.container.querySelector(`[data-id="${prevId}"] .block-content`);
                        if (el) {
                            el.focus();
                            const range = document.createRange();
                            const selection = window.getSelection();
                            range.selectNodeContents(el);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }, 0);
                }
            }
        } catch (err) {
            console.error('[Editor] Remove block failed:', err);
        }
    }

    async savePage() {
        if (!this.state.get('currentPageId')) return;

        try {
            const blocks = Array.from(this.container.querySelectorAll('.block')).map(el => {
                const type = el.dataset.type;
                const contentEl = el.querySelector('.block-content');
                const content = contentEl ? contentEl.innerHTML : '';
                const checkbox = el.querySelector('.todo-checkbox');

                const blockData = {
                    id: el.dataset.id,
                    type,
                    content
                };

                if (type === 'todo' && checkbox) {
                    blockData.checked = checkbox.checked;
                }

                if (type === 'canvas' && this.canvases.has(el.dataset.id)) {
                    blockData.elements = this.canvases.get(el.dataset.id).elements;
                }

                return blockData;
            });

            const page = await db.getPage(this.state.get('currentPageId'));
            if (!page) return;

            page.title = this.titleEl.innerText;
            page.emoji = this.emojiEl.innerText;
            page.blocks = blocks;

            const success = await db.savePage(page);

            // Update status
            if (this.saveStatusEl) {
                this.saveStatusEl.textContent = success ? 'Saved' : 'Save failed';
                this.saveStatusEl.classList.remove('saving');
            }

            this.state.emit('change:pages');
        } catch (err) {
            console.error('[Editor] Save failed:', err);
            if (this.saveStatusEl) {
                this.saveStatusEl.textContent = 'Save failed';
                this.saveStatusEl.classList.remove('saving');
            }
        }
    }

    setupListeners() {
        this.titleEl.addEventListener('input', () => this.debouncedSave());

        this.emojiEl.addEventListener('click', () => {
            const rect = this.emojiEl.getBoundingClientRect();
            this.emojiPicker.show(rect.left, rect.bottom + 8);
        });

        // Header scroll shadow
        const contentWrapper = document.getElementById('content-wrapper');
        const header = document.getElementById('main-header');
        if (contentWrapper && header) {
            contentWrapper.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', contentWrapper.scrollTop > 10);
            });
        }
    }

    updateEmoji(emoji) {
        this.emojiEl.innerText = emoji;
        this.debouncedSave();
    }

    openEmojiPicker() {
        const rect = this.emojiEl.getBoundingClientRect();
        this.emojiPicker.show(rect.left, rect.bottom + 8);
    }
}
