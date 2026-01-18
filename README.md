# 🎙️ Azure Multi-User Voice Auto-Transcriber

A premium, real-time voice transcription application that captures both **Microphone** and **System Audio** simultaneously, utilizing Azure AI Speech for speaker identification (diarization).

## 📖 The Story
In a world of remote collaboration, capturing just one side of a conversation isn't enough. This tool was designed to solve the "single-voice" limitation of standard transcription apps. By merging local microphone input with system audio (like a video call output) into a single high-fidelity stream, we enable a truly collaborative transcription experience where the AI can "hear" everyone in the meeting and distinguish who is speaking.

## ✨ Key Features
- **Dual-Stream Merging**: Automatically mixes Mic + System Audio (Display Media) into a single 16kHz Mono stream via Web Audio API.
- **Zero-Click Automation**: Starts capturing and transcribing immediately on launch (after initial permissions).
- **Speaker Diarization**: Leverages Azure's `ConversationTranscriber` to identify multiple speakers (`Guest 1`, `Guest 2`, etc.).
- **Premium Dark UI**: A sleek, modern interface built with React and Lucide icons.
- **Real-Time Streaming**: High-performance binary WebSocket streaming for minimal latency.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TypeScript, Vanilla CSS3 (Custom Design System).
- **Backend**: Python, FastAPI, WebSockets.
- **AI Engine**: Azure AI Speech SDK (`azure-cognitiveservices-speech`).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- An [Azure AI Speech](https://portal.azure.com/) resource.

### 1. Backend Setup
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configure your environment in `.env`:
    ```env
    AZURE_SPEECH_KEY=your_key_here
    AZURE_SPEECH_REGION=eastus
    ```
4.  Run the server:
    ```bash
    python3 main.py
    ```

### 2. Frontend Setup
1.  Navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Usage Instructions
1.  Open **[http://localhost:3000](http://localhost:3000)**.
2.  **Mic Prompt**: Click "Allow" for the microphone.
3.  **System Audio Prompt**: A screen-sharing window will appear.
    - Select the **system sound source** (a tab or your entire screen).
    - **CRITICAL**: Check the **"Share system audio"** checkbox in the bottom corner of the popup.
4.  Start talking or play audio! The transcript will appear instantly.

---

## 📝 Project Structure
```text
├── backend/
│   ├── main.py          # FastAPI WebSocket & Azure logic
│   ├── .env             # Azure Credentials
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── hooks/       # useTranscription (Audio Merging logic)
│   │   ├── App.tsx      # Main UI
│   │   └── index.css    # Premium Styling
│   └── package.json     # Node dependencies
└── README.md            # You are here!
```
