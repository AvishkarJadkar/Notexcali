/**
 * Storage utility using idb-keyval from ESM.sh
 * This provides a simple promise-based key-value store in IndexedDB.
 */
import { get, set, update, keys, del, clear } from 'https://esm.sh/idb-keyval@6.2.1';

export async function initializeDB() {
    console.log('📦 Database initialized');
    // We could seed some initial data here if it's the first run
    const existingKeys = await keys();
    if (existingKeys.length === 0) {
        await seedInitialData();
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
            { id: 'b2', type: 'text', content: 'This is a hybrid app that combines Notion-like notes with Excalidraw-like illustrations.' },
            { id: 'b3', type: 'text', content: 'Try typing / to add a new block, or click the canvas icon to start drawing.' }
        ]
    };

    await set('page_welcome-page', welcomePage);
    await set('pages_index', ['welcome-page']);
}

export const db = {
    getPage: (id) => get(`page_${id}`),
    savePage: (page) => {
        page.updatedAt = Date.now();
        return set(`page_${page.id}`, page);
    },
    deletePage: (id) => del(`page_${id}`),
    
    getIndex: async () => (await get('pages_index')) || [],
    saveIndex: (index) => set('pages_index', index)
};
