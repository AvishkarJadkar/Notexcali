/**
 * Block-based Editor Engine
 */
import { db } from '../utils/db.js';
import { SlashMenu } from './menu.js';
import { DrawingCanvas } from './canvas.js';

export class Editor {
    constructor(state) {
        this.state = state;
        this.container = document.getElementById('editor');
        this.titleEl = document.getElementById('page-title');
        this.emojiEl = document.getElementById('page-emoji');
        
        this.slashMenu = new SlashMenu((type) => this.transformBlock(this.currentBlockId, type));
        this.currentBlockId = null;
        this.canvases = new Map(); // Store canvas instances
        
        this.init();
    }

    init() {
        this.setupListeners();
        this.state.on('change:currentPageId', (id) => this.loadPage(id));
        
        // Load initial page
        this.loadPage(this.state.get('currentPageId'));
    }

    async loadPage(id) {
        if (!id) return;
        
        const page = await db.getPage(id);
        if (!page) return;

        // Update UI
        this.titleEl.innerText = page.title || 'Untitled';
        this.emojiEl.innerText = page.emoji || '📄';
        
        const crumbs = document.getElementById('current-page-crumbs');
        if (crumbs) {
            crumbs.innerText = `Workspace / ${page.title || 'Untitled'}`;
        }

        this.renderBlocks(page.blocks);
    }

    renderBlocks(blocks) {
        this.container.innerHTML = '';
        if (!blocks || blocks.length === 0) {
            this.addBlockAfter(null);
            return;
        }

        blocks.forEach(block => {
            const blockEl = this.createBlockElement(block);
            this.container.appendChild(blockEl);
        });

        // Add a clickable area at the bottom so users can always add new blocks
        const addArea = document.createElement('div');
        addArea.className = 'editor-click-area';
        addArea.style.minHeight = '200px';
        addArea.style.cursor = 'text';
        addArea.addEventListener('click', () => {
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock) {
                this.addBlockAfter(lastBlock.id);
            }
        });
        this.container.appendChild(addArea);

        // Render all Lucide icons (block controls + canvas toolbar)
        if (window.lucide) window.lucide.createIcons();
    }

    createBlockElement(block) {
        const div = document.createElement('div');
        div.className = `block block-${block.type}`;
        div.dataset.id = block.id;
        div.dataset.type = block.type;
        
        if (block.checked) div.classList.add('checked');

        // Block Controls (Only hover handle)
        const controls = document.createElement('div');
        controls.className = 'block-controls';
        // Make the handle ITSELF draggable
        controls.innerHTML = `
            <div class="block-action-btn drag-handle" draggable="true" title="Drag to reorder"><i data-lucide="grip-vertical" size="11"></i></div>
        `;

        const handle = controls.querySelector('.drag-handle');
        
        // Ensure Lucide icons inside handles don't catch the drag
        setTimeout(() => {
            const icon = handle.querySelector('svg');
            if (icon) icon.style.pointerEvents = 'none';
        }, 100);

        // DRAG ENGINE: Handle-initiated dragging
        handle.addEventListener('dragstart', (e) => {
            div.classList.add('dragging');
            
            // Set the whole block as the drag image
            if (e.dataTransfer.setDragImage) {
                // Adjust offsets so the ghost aligns with the mouse
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

            const page = await db.getPage(this.state.get('currentPageId'));
            const draggedIdx = page.blocks.findIndex(b => b.id === draggedId);
            
            if (draggedIdx !== -1) {
                const [draggedBlock] = page.blocks.splice(draggedIdx, 1);
                const newTargetIdx = page.blocks.findIndex(b => b.id === block.id);
                page.blocks.splice(newTargetIdx, 0, draggedBlock);
                
                await db.savePage(page);
                this.renderBlocks(page.blocks);
            }
        });

        div.appendChild(controls);

        const content = document.createElement('div');
        content.className = 'block-content';
        content.contentEditable = block.type !== 'canvas';
        content.spellcheck = false;
        content.innerHTML = block.content || '';
        content.dataset.placeholder = this.getPlaceholder(block.type);

        // Todo specific
        if (block.type === 'todo') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = block.checked || false;
            checkbox.addEventListener('change', (e) => {
                div.classList.toggle('checked', e.target.checked);
                this.savePage();
            });
            div.appendChild(checkbox);
        }

        // Code specific
        if (block.type === 'code') {
            content.classList.add('language-javascript');
        }

        div.appendChild(content);

        // Special rendering for canvas
        if (block.type === 'canvas') {
            content.style.display = 'none';
            const canvasWrapper = document.createElement('div');
            canvasWrapper.className = 'canvas-wrapper-inner';
            canvasWrapper.style.width = '100%';
            canvasWrapper.style.minHeight = '440px';
            div.appendChild(canvasWrapper);
            
            // Restore the delete cross for canvas
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'canvas-delete-btn';
            deleteBtn.title = 'Delete this drawing';
            deleteBtn.innerHTML = '<i data-lucide="x" size="14"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            
            const canvas = new DrawingCanvas(canvasWrapper, block, () => this.savePage());
            this.canvases.set(block.id, canvas);
            requestAnimationFrame(() => canvas.resize());
        }

        // Keyboard Events (only for non-canvas blocks)
        if (block.type !== 'canvas') {
            content.addEventListener('keydown', (e) => {
                if (this.slashMenu.handleKeyDown(e)) return;

                // Rapid Delete Shortcut (Ctrl+Shift+Backspace)
                if (e.ctrlKey && e.shiftKey && e.key === 'Backspace') {
                    e.preventDefault();
                    this.removeBlock(block.id);
                    return;
                }

                // Navigation: Arrow Up
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

                // Navigation: Arrow Down
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

                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addBlockAfter(block.id);
                }

                // Slash Command trigger
                if (e.key === '/') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        this.slashMenu.show(rect.left, rect.bottom + 10);
                    }
                } else {
                    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') {
                        this.slashMenu.hide();
                    }
                }

                // Backspace handling
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

        // Highlight code blocks
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
        this.savePage();
    }

    async handleKeyDown(e, block, el) {
        // This is a fallback for global handling if needed, 
        // but individual listeners are now in createBlockElement.
    }

    async transformBlock(blockId, newType) {
        const page = await db.getPage(this.state.get('currentPageId'));
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
    }

    async addBlockAfter(afterId) {
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
    }

    async removeBlock(id) {
        const page = await db.getPage(this.state.get('currentPageId'));
        const index = page.blocks.findIndex(b => b.id === id);
        
        if (index !== -1) {
            const prevId = index > 0 ? page.blocks[index-1].id : null;
            page.blocks.splice(index, 1);
            
            // Ensure at least one block exists
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
    }

    async savePage() {
        if (!this.state.get('currentPageId')) return;

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
        page.blocks = blocks;
        await db.savePage(page);
        this.state.emit('change:pages');
    }

    setupListeners() {
        this.titleEl.addEventListener('input', () => this.savePage());
    }
}
