// Notexcali - Main Entry Point (with Firebase Auth)
import { onAuthChange, signInWithGoogle, signOut } from './utils/auth.js';
import { initializeDB, db, setCurrentUser } from './utils/db.js';
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
        this.initialized = false;
        this.setupAuth();
    }

    /**
     * Auth state machine — controls login/app visibility
     */
    setupAuth() {
        const authScreen = document.getElementById('auth-screen');
        const appScreen = document.getElementById('app');
        const loginBtn = document.getElementById('btn-google-signin');
        const loginBtnText = document.getElementById('signin-text');
        const loadingScreen = document.getElementById('loading-screen');

        // Google Sign-In click
        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                try {
                    loginBtn.disabled = true;
                    if (loginBtnText) loginBtnText.textContent = 'Signing in...';
                    await signInWithGoogle();
                } catch (err) {
                    loginBtn.disabled = false;
                    if (loginBtnText) loginBtnText.textContent = 'Sign in with Google';
                    console.error('Sign-in failed:', err);
                }
            });
        }

        // Auth state listener — fires on login, logout, and page load
        onAuthChange(async (user) => {
            if (user) {
                // Authenticated: hide auth, show app
                if (authScreen) authScreen.style.display = 'none';
                if (loadingScreen) loadingScreen.style.display = 'none';
                if (appScreen) appScreen.style.display = 'flex';

                // Set user for DB scoping
                setCurrentUser(user.uid);

                // Update user avatar in header
                const avatar = document.getElementById('user-avatar');
                if (avatar) {
                    avatar.src = user.photoURL || '';
                    avatar.alt = user.displayName || 'User';
                    avatar.title = user.displayName || user.email;
                }

                // Initialize app (only once per session)
                if (!this.initialized) {
                    await this.init();
                    this.initialized = true;
                }
            } else {
                // Not authenticated: show login screen
                if (loadingScreen) loadingScreen.style.display = 'none';
                if (authScreen) authScreen.style.display = 'flex';
                if (appScreen) appScreen.style.display = 'none';
                this.initialized = false;
            }
        });
    }

    async init() {
        try {
            // 1. Initialize DB (seeds welcome page for new users)
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

            // Mobile: Collapse sidebar by default
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.add('collapsed');
            }

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

        // Logout Button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await signOut();
                window.location.reload(); // Clean restart
            });
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
