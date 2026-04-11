# Notexcali ⚡
**The hybrid workspace for thinkers, designers, and organizers.**

Notexcali is a premium, lightweight, block-based editor that seamlessly combines the structured organization of **Notion** with the creative freedom of **Excalidraw**. Built for speed and simplicity, it allows you to capture ideas in text and sketches—all in a single, beautiful interface.

Notes like Notion, creativity like Excalidraw — all in one lightning-fast workspace.
Think, write, sketch, and build ideas instantly without the clutter. 

[Live At](https://avishkarjadkar.github.io/Notexcali/) | [Report Bug](https://github.com/AvishkarJadkar/Notexcali/issues)

---

## 📸 Preview

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Notexcali+Desktop+View" alt="" width="800">
  <br>
  <em><img width="1917" height="967" alt="Screenshot 2026-04-11 231050" src="https://github.com/user-attachments/assets/bd4ee642-0c15-467a-b07b-5566b4fd4e60" />
</em>
  <em><img width="1917" height="970" alt="Screenshot 2026-04-11 233931" src="https://github.com/user-attachments/assets/749eb43f-55b3-4d96-ba66-6fb9b3838630" />

</em>
</div>

<div align="center">
  <br>
  <img src="https://via.placeholder.com/250x500?text=Notexcali+Mobile" alt="downloaded pdf screenshot" width="250">
  <img src="https://via.placeholder.com/250x500?text=Drawing+Canvas" alt="" width="250" style="margin-left: 20px;">
  <br>
  <em><img width="565" height="897" alt="Screenshot 2026-04-11 234024" src="https://github.com/user-attachments/assets/84df6c64-67e0-45fb-ae01-ec0d142adc9d" />
</em>
  
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

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
