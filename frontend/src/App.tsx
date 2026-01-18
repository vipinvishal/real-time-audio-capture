import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, User, MessageSquare, AlertCircle } from 'lucide-react';
import { useTranscription, Transcript } from './hooks/useTranscription';
import './App.css';

function App() {
    const { transcripts, isRecording, error, startRecording, stopRecording } = useTranscription('ws://localhost:8000/ws/transcribe');
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);

    // Auto-start on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isRecording) {
                startRecording();
            }
        }, 1000); // Small delay to ensure browser readiness
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="app-container">
            <header className="header">
                <div className="logo">
                    <span className="accent">Azure</span> Auto-Transcribe
                </div>
                <div className="status">
                    {isRecording && <div className="recording-indicator" />}
                    <span>{isRecording ? 'Session Active' : 'Initializing...'}</span>
                </div>
            </header>

            <main className="main">
                <div className="transcript-area">
                    {transcripts.length === 0 && !error && (
                        <div className="empty-state">
                            <MessageSquare size={48} />
                            <p>Automatic capture is starting...</p>
                            <p className="subtitle">Please check for browser prompts to allow Mic and System Audio</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-card">
                            <AlertCircle size={24} color="#ff4d4d" />
                            <p>{error}</p>
                            <button className="btn btn-primary btn-small" onClick={() => startRecording()}>Retry</button>
                        </div>
                    )}

                    <div className="transcript-list">
                        {transcripts.map((t) => (
                            <div key={t.id} className={`transcript-item ${t.isFinal ? 'final' : 'interim'}`}>
                                <div className="speaker-tag">
                                    <User size={14} />
                                    <span>{t.speaker}</span>
                                </div>
                                <div className="text-content">
                                    {t.text}
                                </div>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                <div className="controls">
                    {isRecording ? (
                        <button className="btn btn-danger" onClick={stopRecording}>
                            <MicOff size={24} />
                            <span>Stop Session</span>
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => startRecording()}>
                            <Mic size={24} />
                            <span>Start Session</span>
                        </button>
                    )}
                </div>
            </main>

            <footer className="footer">
                <p>Merging Mic + System Audio automatically. Diarization enabled.</p>
            </footer>
        </div>
    );
}

export default App;
