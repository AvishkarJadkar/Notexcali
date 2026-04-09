/**
 * State Management for Notexcali
 * Simple event-driven state with error boundaries.
 */
export class State {
    constructor() {
        this.listeners = new Map();
        this.data = {
            currentPageId: 'welcome-page',
            pages: [],
            isSidebarOpen: true,
            isSaving: false
        };
    }

    /**
     * Subscribe to an event
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event, fire only once
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const list = this.listeners.get(event);
        const idx = list.indexOf(callback);
        if (idx !== -1) list.splice(idx, 1);
    }

    /**
     * Emit an event with error boundary — one bad listener won't crash others.
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        for (const cb of this.listeners.get(event)) {
            try {
                cb(data);
            } catch (err) {
                console.error(`[State] Error in listener for "${event}":`, err);
            }
        }
    }

    set(key, value) {
        this.data[key] = value;
        this.emit(`change:${key}`, value);
    }

    get(key) {
        return this.data[key];
    }
}
