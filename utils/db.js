/**
 * Storage utility using idb-keyval from ESM.sh
 * Hardened with try-catch, data validation, and safe fallbacks.
 */
import { get, set, del, keys } from 'https://esm.sh/idb-keyval@6.2.1';

export async function initializeDB() {
    try {
        console.log('📦 Database initializing...');
        const existingKeys = await keys();
        if (existingKeys.length === 0) {
            await seedInitialData();
        }
        console.log('📦 Database ready');
    } catch (err) {
        console.error('📦 Database initialization failed:', err);
        // App can still work — it will just have no data
    }
}

async function seedInitialData() {
    const welcomePage = {
        id: 'welcome-page',
        title: 'Getting Started with Notexcali',
        emoji: '🚀',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: [
            { id: 'b1', type: 'h1', content: 'Welcome to Notexcali!' },
            { id: 'b2', type: 'text', content: 'A hybrid app for notes and illustrations. Clean, fast, and premium.' },
            { id: 'b3', type: 'text', content: 'Type <kbd>/</kbd> to add a new block, or use the slash menu to insert drawings, code, and more.' }
        ]
    };

    await set('page_welcome-page', welcomePage);
    await set('pages_index', ['welcome-page']);
}

/**
 * Validate that a page object has the required shape.
 * If fields are missing, patch them with defaults.
 */
function validatePage(page) {
    if (!page || typeof page !== 'object') return null;
    if (!page.id) return null;

    // Patch missing fields
    page.title = page.title || 'Untitled';
    page.emoji = page.emoji || '📄';
    page.blocks = Array.isArray(page.blocks) ? page.blocks : [];
    page.createdAt = page.createdAt || Date.now();
    page.updatedAt = page.updatedAt || Date.now();

    return page;
}

export const db = {
    /**
     * Get a page by ID, with validation. Returns null on failure.
     */
    getPage: async (id) => {
        try {
            const raw = await get(`page_${id}`);
            return validatePage(raw);
        } catch (err) {
            console.error(`[DB] Failed to get page "${id}":`, err);
            return null;
        }
    },

    /**
     * Save a page. Stamps updatedAt automatically.
     */
    savePage: async (page) => {
        try {
            if (!page || !page.id) {
                console.warn('[DB] Attempted to save invalid page:', page);
                return false;
            }
            page.updatedAt = Date.now();
            await set(`page_${page.id}`, page);
            return true;
        } catch (err) {
            console.error(`[DB] Failed to save page "${page?.id}":`, err);
            return false;
        }
    },

    /**
     * Delete a page by ID.
     */
    deletePage: async (id) => {
        try {
            await del(`page_${id}`);
            return true;
        } catch (err) {
            console.error(`[DB] Failed to delete page "${id}":`, err);
            return false;
        }
    },

    /**
     * Get the root pages index. Always returns an array.
     */
    getIndex: async () => {
        try {
            return (await get('pages_index')) || [];
        } catch (err) {
            console.error('[DB] Failed to get pages index:', err);
            return [];
        }
    },

    /**
     * Save the root pages index.
     */
    saveIndex: async (index) => {
        try {
            await set('pages_index', index);
            return true;
        } catch (err) {
            console.error('[DB] Failed to save pages index:', err);
            return false;
        }
    },

    // ---- Projects ----

    getProject: async (id) => {
        try {
            const proj = await get(`project_${id}`);
            if (!proj || typeof proj !== 'object') return null;
            proj.pages = Array.isArray(proj.pages) ? proj.pages : [];
            proj.title = proj.title || 'New Project';
            proj.emoji = proj.emoji || '📁';
            return proj;
        } catch (err) {
            console.error(`[DB] Failed to get project "${id}":`, err);
            return null;
        }
    },

    saveProject: async (project) => {
        try {
            if (!project || !project.id) return false;
            await set(`project_${project.id}`, project);
            return true;
        } catch (err) {
            console.error(`[DB] Failed to save project "${project?.id}":`, err);
            return false;
        }
    },

    deleteProject: async (id) => {
        try {
            await del(`project_${id}`);
            return true;
        } catch (err) {
            console.error(`[DB] Failed to delete project "${id}":`, err);
            return false;
        }
    },

    getProjectsIndex: async () => {
        try {
            return (await get('projects_index')) || [];
        } catch (err) {
            console.error('[DB] Failed to get projects index:', err);
            return [];
        }
    },

    saveProjectsIndex: async (index) => {
        try {
            await set('projects_index', index);
            return true;
        } catch (err) {
            console.error('[DB] Failed to save projects index:', err);
            return false;
        }
    }
};
