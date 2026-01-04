# HighlightAgent (MVP)

HighlightAgent is a powerful Chrome Extension that transforms your browser reading into actionable knowledge. It allows you to check context, capture ideas, summarize content using AI, and set spaced repetition reminders—all without leaving your current page.

## 🚀 Features

*   **One-Click Capture via Context Menu**: Right-click any text to immediately capture it.
*   **Intelligent Popup**:
    *   **Auto-filled Content**: Opens with your selected text and page title pre-filled.
    *   **Smart Reminders**: "Tomorrow", "Weekend", "Next Week", or custom dates.
    *   **Format Selection**: Choose between saving full text, AI summaries, or AI quizzes.
*   **Hybrid AI Engine**:
    *   **Primary**: Uses Chrome's built-in **Gemini Nano** (`window.ai`) for instant, private, offline AI processing.
    *   **Fallback**: Seamlessly switches to a **Local Backend** running `LaMini-Flan-T5` if the browser AI is unavailable.
*   **Premium UI**: A sleek, deep-zinc dark mode interface with glassmorphism effects and smooth animations.

## 🛠 Architecture

The project consists of two main components:

1.  **Chrome Extension (`/extension`)**:
    *   Manifest V3 architecture.
    *   **Background Service Worker**: Handles context menus and API communication.
    *   **Offscreen Document**: Manages AI model execution (Hybrid logic).
    *   **Content Script**: Provides visual toast notifications.
    *   **Popup UI**: Built with pure HTML/CSS/JS for maximum speed and zero build-step complexity.

2.  **Local Backend (`/backend`)**:
    *   **Express.js** server acting as a local API.
    *   **Transformers.js**: Runs the `Xenova/LaMini-Flan-T5-248M` model locally for fallback processing.
    *   **Supabase Integration**: Stores user alerts and processed content.

## 📦 Installation

### 1. Prerequisites
*   Node.js (v18+)
*   Google Chrome (Dev/Canary channel recommended for experimental AI features)

### 2. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local server:
    ```bash
    node src/server.js
    ```
    *Server runs on `http://localhost:8080`*

### 3. Extension Setup
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the `extension` folder from this project.
5.  **Important**: If you are using `window.ai`, ensure the `Optimization Guide On Device Model` flag is enabled in `chrome://flags`.

## 📖 Usage

1.  **Select text** on any webpage.
2.  **Right-click** and choose **"Add Reminder: [Your Text]"**.
3.  The **HighlightAgent Popup** will open.
    *   Edit the title or content if needed.
    *   Select **Summary** or **Quiz** to use AI.
    *   Pick a **Reminder Date**.
4.  Click **Save Reminder**.
    *   The popup automatically saves to the backend and closes.
    *   You receive a visual confirmation.

## 🤖 AI Logic (Under the Hood)

The system uses a "Race to Competence" strategy:
1.  **Browser AI**: First, it attempts to access `window.ai`. If available, it generates summaries/quizzes locally in the browser with zero latency.
2.  **Local Fallback**: If `window.ai` fails or is dismissed, it sends a payload to `localhost:8080`. The local Node.js server uses `Transformers.js` to process the text and returns the result.

## 📝 License
Proprietary / MVP Status.
