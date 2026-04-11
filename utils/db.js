/**
 * Storage utility using Firebase Firestore
 * Data is scoped per authenticated user.
 * Same interface as the old IndexedDB version — no other files need to change.
 */
import { firestore } from './firebase.js';
import {
    doc, getDoc, setDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

let currentUid = null;

/**
 * Set the current authenticated user's UID.
 * Must be called before any DB operations.
 */
export function setCurrentUser(uid) {
    currentUid = uid;
}

function requireAuth() {
    if (!currentUid) throw new Error('Not authenticated');
    return currentUid;
}

export async function initializeDB() {
    try {
        const uid = requireAuth();
        console.log('📦 Database initializing for user:', uid);

        // Check if user has data — if not, seed welcome page
        const indexRef = doc(firestore, 'users', uid, 'meta', 'index');
        const indexSnap = await getDoc(indexRef);

        if (!indexSnap.exists()) {
            await seedInitialData(uid);
        }

        console.log('📦 Database ready');
    } catch (err) {
        console.error('📦 Database initialization failed:', err);
    }
}

async function seedInitialData(uid) {
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

    await setDoc(doc(firestore, 'users', uid, 'pages', 'welcome-page'), welcomePage);
    await setDoc(doc(firestore, 'users', uid, 'meta', 'index'), {
        pageIds: ['welcome-page'],
        projectIds: []
    });
}

/**
 * Validate that a page object has the required shape.
 */
function validatePage(page) {
    if (!page || typeof page !== 'object') return null;
    if (!page.id) return null;

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
            const uid = requireAuth();
            const snap = await getDoc(doc(firestore, 'users', uid, 'pages', id));
            if (!snap.exists()) return null;
            return validatePage(snap.data());
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
            const uid = requireAuth();
            if (!page || !page.id) {
                console.warn('[DB] Attempted to save invalid page:', page);
                return false;
            }
            page.updatedAt = Date.now();
            await setDoc(doc(firestore, 'users', uid, 'pages', page.id), page);
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
            const uid = requireAuth();
            await deleteDoc(doc(firestore, 'users', uid, 'pages', id));
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
            const uid = requireAuth();
            const snap = await getDoc(doc(firestore, 'users', uid, 'meta', 'index'));
            if (!snap.exists()) return [];
            return snap.data().pageIds || [];
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
            const uid = requireAuth();
            await setDoc(
                doc(firestore, 'users', uid, 'meta', 'index'),
                { pageIds: index },
                { merge: true }
            );
            return true;
        } catch (err) {
            console.error('[DB] Failed to save pages index:', err);
            return false;
        }
    },

    // ---- Projects ----

    getProject: async (id) => {
        try {
            const uid = requireAuth();
            const snap = await getDoc(doc(firestore, 'users', uid, 'projects', id));
            if (!snap.exists()) return null;
            const proj = snap.data();
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
            const uid = requireAuth();
            if (!project || !project.id) return false;
            await setDoc(doc(firestore, 'users', uid, 'projects', project.id), project);
            return true;
        } catch (err) {
            console.error(`[DB] Failed to save project "${project?.id}":`, err);
            return false;
        }
    },

    deleteProject: async (id) => {
        try {
            const uid = requireAuth();
            await deleteDoc(doc(firestore, 'users', uid, 'projects', id));
            return true;
        } catch (err) {
            console.error(`[DB] Failed to delete project "${id}":`, err);
            return false;
        }
    },

    getProjectsIndex: async () => {
        try {
            const uid = requireAuth();
            const snap = await getDoc(doc(firestore, 'users', uid, 'meta', 'index'));
            if (!snap.exists()) return [];
            return snap.data().projectIds || [];
        } catch (err) {
            console.error('[DB] Failed to get projects index:', err);
            return [];
        }
    },

    saveProjectsIndex: async (index) => {
        try {
            const uid = requireAuth();
            await setDoc(
                doc(firestore, 'users', uid, 'meta', 'index'),
                { projectIds: index },
                { merge: true }
            );
            return true;
        } catch (err) {
            console.error('[DB] Failed to save projects index:', err);
            return false;
        }
    }
};
