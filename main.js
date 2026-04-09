// Notexcali - Main Entry Point
import { initializeDB, db } from './utils/db.js';
import { State } from './utils/state.js';
import { Sidebar } from './sidebar.js';
import { Editor } from './components/editor.js';
import { setupShortcuts, exportData } from './utils/helpers.js';

console.log('🚀 Notexcali Initializing...');

/**
 * The core application controller
 */
class App {
    constructor() {
        this.state = new State();
        this.sidebar = null;
        this.editor = null;
        this.init();
    }

    async init() {
        // 1. Initialize DB
        await initializeDB();
        
        // 2. Setup Components
        const pagesIndex = await db.getIndex();
        this.state.set('pages', pagesIndex);
        
        this.sidebar = new Sidebar(this.state);
        this.editor = new Editor(this.state);
        
        // 3. Setup Shortcuts & Global Events
        setupShortcuts(this.state);
        this.setupEventListeners();
        
        console.log('✨ Notexcali Ready!');
    }

    setupEventListeners() {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('toggle-sidebar');
        const sidebar = document.querySelector('.sidebar');
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });

        // Export Button (In footer)
        const exportBtn = document.querySelector('.sidebar-footer .nav-item');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => exportData());
        }

        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.notexcali = new App();
});
