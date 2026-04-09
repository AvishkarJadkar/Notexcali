// Notexcali - Main Entry Point
import { initializeDB, db } from './utils/db.js';
import { State } from './utils/state.js';
import { Sidebar } from './sidebar.js';
import { Editor } from './components/editor.js';
import { SearchModal } from './components/search.js';
import { setupShortcuts, exportData, downloadPageAsPDF } from './utils/helpers.js';

console.log('🚀 Notexcali Initializing...');

/**
 * The core application controller
 */
class App {
    constructor() {
        this.state = new State();
        this.sidebar = null;
        this.editor = null;
        this.search = null;
        this.init();
    }

    async init() {
        try {
            // 1. Initialize DB
            await initializeDB();

            // 2. Setup Components
            const pagesIndex = await db.getIndex();
            this.state.set('pages', pagesIndex);

            this.sidebar = new Sidebar(this.state);
            this.editor = new Editor(this.state);
            this.search = new SearchModal(this.state);

            // 3. Setup Shortcuts & Global Events
            setupShortcuts(this.state);
            this.setupEventListeners();
            this.initTheme();

            // 4. Single Lucide icons pass
            if (window.lucide) window.lucide.createIcons();

            console.log('✨ Notexcali Ready!');
        } catch (err) {
            console.error('❌ Notexcali failed to initialize:', err);
        }
    }

    setupEventListeners() {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('toggle-sidebar');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        // Export Button
        const exportBtn = document.getElementById('btn-export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => exportData());
        }

        // PDF Download Button
        const downloadPdfBtn = document.getElementById('btn-download-pdf');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', () => downloadPageAsPDF());
        }

        // Theme Toggle
        const themeToggle = document.getElementById('btn-theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Theme management — persists in localStorage
     */
    initTheme() {
        const saved = localStorage.getItem('notexcali-theme');
        if (saved === 'dark') {
            document.documentElement.classList.add('dark');
            this.updateThemeIcon(true);
        } else if (saved === 'light') {
            document.documentElement.classList.add('light');
            this.updateThemeIcon(false);
        } else {
            // Follow system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.updateThemeIcon(prefersDark);
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        document.documentElement.classList.remove('light');

        if (!isDark) {
            document.documentElement.classList.add('light');
        }

        localStorage.setItem('notexcali-theme', isDark ? 'dark' : 'light');
        this.updateThemeIcon(isDark);
    }

    updateThemeIcon(isDark) {
        const btn = document.getElementById('btn-theme-toggle');
        if (btn) {
            btn.innerHTML = isDark
                ? '<i data-lucide="sun" size="16"></i>'
                : '<i data-lucide="moon" size="16"></i>';
            if (window.lucide) window.lucide.createIcons();
        }
    }
}

// Global error boundaries
window.onerror = (msg, url, line, col, error) => {
    console.error('[Global Error]', msg, { url, line, col, error });
};

window.onunhandledrejection = (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.notexcali = new App();
});
