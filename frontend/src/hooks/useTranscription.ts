import { useState, useEffect, useRef, useCallback } from 'react';

export interface Transcript {
    text: string;
    speaker: string;
    isFinal: boolean;
    id: string;
}

export const useTranscription = (wsUrl: string) => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const stopRecording = useCallback(() => {
        setIsRecording(false);
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // Request Microphone
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            let sysStream = null;
            try {
                // Request System Audio (Display Media)
                // Note: Browser will prompt user to pick a screen/tab
                sysStream = await (navigator.mediaDevices as any).getDisplayMedia({
                    video: { width: 1, height: 1 },
                    audio: true
                });
            } catch (e) {
                console.warn("System audio capture declined or failed", e);
            }

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const micSource = audioContext.createMediaStreamSource(micStream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            micSource.connect(processor);

            if (sysStream && sysStream.getAudioTracks().length > 0) {
                const sysSource = audioContext.createMediaStreamSource(sysStream);
                sysSource.connect(processor);
                // mediaRecorderRef.current = { stream: sysStream } as any; // Store for cleanup - this was in the instruction but is superseded by the final cleanup object
            }

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsRecording(true);
                processor.connect(audioContext.destination);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.error) {
                    setError(data.error);
                    stopRecording();
                    return;
                }

                setTranscripts((prev) => {
                    const newTranscript = {
                        text: data.text,
                        speaker: data.speaker || 'Unknown',
                        isFinal: data.isFinal,
                        id: Date.now().toString()
                    };

                    if (!data.isFinal) {
                        const last = prev[prev.length - 1];
                        if (last && !last.isFinal) {
                            return [...prev.slice(0, -1), newTranscript];
                        }
                    } else {
                        const last = prev[prev.length - 1];
                        if (last && !last.isFinal) {
                            return [...prev.slice(0, -1), newTranscript];
                        }
                    }
                    return [...prev, newTranscript];
                });
            };

            ws.onerror = () => {
                setError("WebSocket error occurred.");
                stopRecording();
            };

            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    ws.send(pcmData.buffer);
                }
            };

            // Ensure cleanup of mic stream too
            (mediaRecorderRef.current as any) = {
                stop: () => {
                    micStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
                    if (sysStream) sysStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
                }
            };

        } catch (err: any) {
            setError(err.message || "Failed to access audio devices.");
            setIsRecording(false);
        }
    }, [wsUrl, stopRecording]);

    return { transcripts, isRecording, error, startRecording, stopRecording };
};
