# Notexcali ⚡
**The hybrid workspace for thinkers, designers, and organizers.**

Notexcali is a premium, lightweight, block-based editor that seamlessly combines the structured organization of **Notion** with the creative freedom of **Excalidraw**. Built for speed and simplicity, it allows you to capture ideas in text and sketches—all in a single, beautiful interface.

[Live Demo](https://avishkarjadkar.github.io/Notexcali/) | [Report Bug](https://github.com/AvishkarJadkar/Notexcali/issues)

---

## 📸 Preview

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Notexcali+Desktop+View" alt="Notexcali Desktop Screenshot" width="800">
  <br>
  <em>[Insert your desktop screenshot here]</em>
</div>

<div align="center">
  <br>
  <img src="https://via.placeholder.com/250x500?text=Notexcali+Mobile" alt="Notexcali Mobile View" width="250">
  <img src="https://via.placeholder.com/250x500?text=Drawing+Canvas" alt="Notexcali Drawing" width="250" style="margin-left: 20px;">
  <br>
  <em>[Insert your mobile & drawing screenshots here]</em>
</div>

---

## ✨ Core Features

- **🧱 Block-Based Editor**: A familiar, powerful command-driven editor. Just type `/` to insert headings, lists, code snippets, or drawing canvases.
- **🎨 Hand-Drawn Canvas**: Deeply integrated sketching tool powered by **Rough.js**. Create wireframes, diagrams, or doodles directly inside your notes.
- **☁️ Multi-User Cloud Sync**: Securely sign in with **Google**. Your notes are saved in the cloud (Firebase) and sync across your phone and laptop instantly.
- **📱 Mobile-First Design**: Optimized for touch. From specific mobile-keyboard command triggers to "tap-to-dismiss" sidebars, Notexcali feels like a native app on your phone.
- **🌓 Adaptive Theme**: Sleek Dark and Light modes that respect your system preferences.
- **📄 PDF Export**: Professional-grade PDF generation that preserves your layout and hand-drawn illustrations perfectly.
- **📂 Project Organization**: Organize your workspace with nested pages and projects for a clean, distraction-free experience.
- **📶 PWA Ready**: Install Notexcali as an app on your device for offline support and a premium desktop/mobile feel.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS (ES Modules), HTML5, CSS3 (Modern Flex/Grid)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication (Google OAuth)
- **Styling**: Rough.js (Sketchy UI), Lucide Icons, Prism.js (Syntax Highlighting)
- **Export**: html2pdf.js

---

## 🚀 Getting Started

Since Notexcali uses pure ES Modules, you can run it locally with any simple static server.

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/AvishkarJadkar/Notexcali.git
   ```
2. **Launch locally**:
   ```bash
   npx serve .
   ```
3. **Configure Firebase**:
   Copy your `firebaseConfig` into `utils/firebase.js` (or use the injected GitHub Secrets for deployment).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + \` | Toggle Sidebar |
| `Ctrl + N` | New Page |
| `Ctrl + K` | Quick Search |
| `Enter` | Create New Block |
| `/` | Open Command Menu |

---

## 🛣️ Roadmap

- [ ] 🤝 Real-time collaboration.
- [ ] 🧠 AI-powered content summaries.
- [ ] 🏗️ More block types (Tables, Embeds).
- [ ] 📂 Folder-in-folder nesting.

---

## 👨‍💻 Author

**Avishkar Jadkar**
- [GitHub](https://github.com/AvishkarJadkar)
- [Portfolio](https://github.com/AvishkarJadkar)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
