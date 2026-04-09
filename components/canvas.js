/**
 * Drawing Canvas Component
 * Final Fixes: Preview colors and mathematical Line Hit-testing
 */
export class DrawingCanvas {
    constructor(container, block, onUpdate) {
        this.container = container;
        this.block = block;
        this.onUpdate = onUpdate;
        
        this.elements = block.elements || [];
        this.currentTool = 'pen';
        this.selectedColor = '#a5b4fc';
        this.isDrawing = false;
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.rc = null; 
        
        this.handleMove = (e) => this.draw(e);
        this.handleStop = () => this.stopDrawing();

        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.className = 'canvas-block glass-panel active-drawing-area';
        // NO tabIndex — it steals focus from the actual canvas on first click
        
        this.container.style.position = 'relative';
        this.container.style.backgroundColor = '#111';
        this.container.style.minHeight = '440px';
        this.container.style.cursor = 'crosshair';
        
        this.canvas.style.display = 'block';
        this.canvas.style.touchAction = 'none';

        const toolbar = document.createElement('div');
        toolbar.className = 'canvas-toolbar';
        toolbar.innerHTML = `
            <div class="tool-group" style="display: flex; gap: 4px;">
                <button class="tool-btn active" data-tool="pen" title="Pen"><i data-lucide="pen" size="16"></i></button>
                <button class="tool-btn" data-tool="rect" title="Rectangle"><i data-lucide="square" size="16"></i></button>
                <button class="tool-btn" data-tool="circle" title="Circle"><i data-lucide="circle" size="16"></i></button>
                <button class="tool-btn" data-tool="line" title="Line"><i data-lucide="minus" size="16"></i></button>
                <button class="tool-btn" data-tool="eraser" title="Eraser"><i data-lucide="eraser" size="16"></i></button>
            </div>
            <div class="tool-divider"></div>
            <div class="color-palette">
                <div class="color-btn active" data-color="#a5b4fc" style="background: #a5b4fc;"></div>
                <div class="color-btn" data-color="#fda4af" style="background: #fda4af;"></div>
                <div class="color-btn" data-color="#6ee7b7" style="background: #6ee7b7;"></div>
                <div class="color-btn" data-color="#fcd34d" style="background: #fcd34d;"></div>
                <div class="color-btn" data-color="#ffffff" style="background: #ffffff;"></div>
            </div>
            <div class="tool-divider"></div>
            <button class="tool-btn" data-tool="clear" title="Clear All"><i data-lucide="trash-2" size="16"></i></button>
        `;
        
        this.container.appendChild(toolbar);
        this.container.appendChild(this.canvas);

        // Render Lucide icons
        const renderIcons = () => {
            if (window.lucide) window.lucide.createIcons();
        };
        renderIcons();
        setTimeout(renderIcons, 300);
        
        this.resize();
        this.setupListeners(toolbar);
        
        const checkRough = setInterval(() => {
            if (window.rough) {
                this.rc = window.rough.canvas(this.canvas);
                this.render();
                clearInterval(checkRough);
            }
        }, 100);
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0) return;
        this.canvas.width = rect.width;
        this.canvas.height = rect.height || 440;
        this.render();
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    setupListeners(toolbar) {
        toolbar.addEventListener('mousedown', e => e.stopPropagation());
        toolbar.addEventListener('click', e => {
            const btn = e.target.closest('.tool-btn');
            if (btn) {
                const tool = btn.dataset.tool;
                if (tool === 'clear') {
                    if (confirm('Clear everything?')) { this.elements = []; this.render(); this.save(); }
                    return;
                }
                this.currentTool = tool;
                toolbar.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.container.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
            }
            const colorBtn = e.target.closest('.color-btn');
            if (colorBtn) {
                this.selectedColor = colorBtn.dataset.color;
                toolbar.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                colorBtn.classList.add('active');
            }
        });
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPos(e);
        if (this.currentTool === 'eraser') {
            this.eraseAt(pos);
        } else {
            this.currentElement = {
                tool: this.currentTool,
                color: this.selectedColor,
                x: pos.x,
                y: pos.y,
                points: [pos]
            };
        }
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('mouseup', this.handleStop);
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getPos(e);
        if (this.currentTool === 'eraser') {
            this.eraseAt(pos);
            return;
        }
        if (this.currentTool === 'pen') {
            this.currentElement.points.push(pos);
        } else {
            this.currentElement.width = pos.x - this.currentElement.x;
            this.currentElement.height = pos.y - this.currentElement.y;
        }
        this.render();
        this.renderElement(this.currentElement, true);
    }

    eraseAt(pos) {
        const threshold = 15; // Increased for easier hitting
        const initialCount = this.elements.length;
        
        this.elements = this.elements.filter(el => {
            if (el.tool === 'pen') {
                return !el.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < threshold);
            }
            if (el.tool === 'line') {
                return !this.isPointNearLine(pos, {x: el.x, y: el.y}, {x: el.x + el.width, y: el.y + el.height}, threshold);
            }
            if (el.tool === 'rect') {
                return !(pos.x > el.x - threshold && pos.x < el.x + el.width + threshold && 
                         pos.y > el.y - threshold && pos.y < el.y + el.height + threshold);
            }
            if (el.tool === 'circle') {
                const dist = Math.hypot(el.x - pos.x, el.y - pos.y);
                const radius = Math.sqrt(el.width**2 + el.height**2);
                return Math.abs(dist - radius) > threshold && dist > radius + threshold;
            }
            return true;
        });

        if (this.elements.length !== initialCount) {
            this.render();
            this.save();
        }
    }

    isPointNearLine(p, a, b, t) {
        const L2 = (b.x - a.x)**2 + (b.y - a.y)**2;
        if (L2 === 0) return Math.hypot(p.x - a.x, p.y - a.y) < t;
        let r = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / L2;
        r = Math.max(0, Math.min(1, r));
        const dist = Math.hypot(p.x - (a.x + r * (b.x - a.x)), p.y - (a.y + r * (b.y - a.y)));
        return dist < t;
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        if (this.currentElement) {
            this.elements.push(this.currentElement);
            this.currentElement = null;
            this.save();
        }
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('mouseup', this.handleStop);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.elements.forEach(el => this.renderElement(el));
    }

    renderElement(el, isPreview = false) {
        // FIX: Respect selected color even in preview
        const color = el.color || '#a5b4fc';
        
        if (!this.rc) {
            this.ctx.save();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            if (el.tool === 'pen') {
                this.ctx.moveTo(el.points[0].x, el.points[0].y);
                el.points.forEach(p => this.ctx.lineTo(p.x, p.y));
            } else if (el.tool === 'rect') {
                this.ctx.rect(el.x, el.y, el.width, el.height);
            } else if (el.tool === 'circle') {
                const radius = Math.sqrt(el.width**2 + el.height**2);
                this.ctx.arc(el.x, el.y, radius, 0, Math.PI * 2);
            } else if (el.tool === 'line') {
                this.ctx.moveTo(el.x, el.y);
                this.ctx.lineTo(el.x + el.width, el.y + el.height);
            }
            this.ctx.stroke();
            this.ctx.restore();
            return;
        }

        const options = { stroke: color, strokeWidth: 2, roughness: 0.5 };
        switch (el.tool) {
            case 'pen':
                if (el.points.length > 1) this.rc.linearPath(el.points.map(p => [p.x, p.y]), options);
                break;
            case 'rect':
                this.rc.rectangle(el.x, el.y, el.width, el.height, options);
                break;
            case 'circle':
                const radius = Math.sqrt(el.width**2 + el.height**2);
                this.rc.circle(el.x, el.y, radius * 2, options);
                break;
            case 'line':
                this.rc.line(el.x, el.y, el.x + el.width, el.y + el.height, options);
                break;
        }
    }

    save() {
        this.block.elements = this.elements;
        this.onUpdate();
    }
}
