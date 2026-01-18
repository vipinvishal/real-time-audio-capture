import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AZURE_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_REGION = os.getenv("AZURE_SPEECH_REGION")

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection accepted")
    
    if not AZURE_KEY or not AZURE_REGION:
        print("Error: Azure credentials missing")
        await websocket.send_text(json.dumps({"error": "Azure credentials not configured"}))
        await websocket.close()
        return

    # Configure Azure Speech
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_KEY, region=AZURE_REGION)
    # Use string property set to avoid SDK version issues with PropertyId enum
    speech_config.set_service_property("speechServiceResponse_DiarizationOption", "Simple", speechsdk.ServicePropertyChannel.UriQueryParameter)
    
    audio_format = speechsdk.audio.AudioStreamFormat(samples_per_second=16000, bits_per_sample=16, channels=1)
    push_stream = speechsdk.audio.PushAudioInputStream(stream_format=audio_format)
    audio_config = speechsdk.audio.AudioConfig(stream=push_stream)

    transcriber = speechsdk.transcription.ConversationTranscriber(speech_config=speech_config, audio_config=audio_config)

    def transcribed_callback(evt):
        print(f"Transcribed: {evt.result.text} (Speaker: {evt.result.speaker_id})")
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            loop = asyncio.get_event_loop()
            asyncio.run_coroutine_threadsafe(
                websocket.send_text(json.dumps({
                    "text": evt.result.text,
                    "speaker": evt.result.speaker_id,
                    "isFinal": True
                })), loop)

    def recognizing_callback(evt):
        print(f"Recognizing: {evt.result.text}...")
        if evt.result.reason == speechsdk.ResultReason.RecognizingSpeech:
            loop = asyncio.get_event_loop()
            asyncio.run_coroutine_threadsafe(
                websocket.send_text(json.dumps({
                    "text": evt.result.text,
                    "speaker": evt.result.speaker_id,
                    "isFinal": False
                })), loop)

    transcriber.transcribed.connect(transcribed_callback)
    transcriber.transcribing.connect(recognizing_callback)
    transcriber.session_started.connect(lambda evt: print(f"Session started: {evt}"))
    transcriber.session_stopped.connect(lambda evt: print(f"Session stopped: {evt}"))
    transcriber.canceled.connect(lambda evt: print(f"Canceled: {evt.result.cancellation_details.error_details if evt.result.reason == speechsdk.ResultReason.Canceled else 'Unknown'}"))

    transcriber.start_transcribing_async()

    try:
        count = 0
        while True:
            data = await websocket.receive_bytes()
            push_stream.write(data)
            count += 1
            if count % 100 == 0:
                print(f"Received {count} chunks of audio data")
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Backend error: {str(e)}")
    finally:
        transcriber.stop_transcribing_async()
        push_stream.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
