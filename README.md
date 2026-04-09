# Notexcali 🚀

A hybrid Notion + Excalidraw note-taking app.

## Features
- **Block-based Editor**: Type `/` for commands (Headings, Text, Canvas, etc.)
- **Hand-drawn Canvas**: Sketch ideas directly in your notes using Rough.js.
- **Local-first**: Data is saved in your browser's IndexedDB.
- **Ultra-lightweight**: No `node_modules` required.

## How to Run
Since this app uses ES Modules, you need a local server to run it.

1. Open a terminal in this directory.
2. Run any local server, for example:
   ```bash
   npx serve .
   ```
   *Note: This `npx` command is temporary and won't install large libraries permanently on your machine.*
3. Open the URL shown (usually `http://localhost:3000`).

## Keyboard Shortcuts
- `Ctrl + \`: Toggle Sidebar
- `Ctrl + N`: New Page
- `Enter`: New Block
- `Backspace`: Delete Empty Block
- `/`: Open Command Menu
