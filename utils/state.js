/**
 * Simple State Management for Notexcali
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

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(data));
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
