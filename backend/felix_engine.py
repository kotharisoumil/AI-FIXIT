# felix_engine.py
import os
from io import BytesIO
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from google import genai
from google.genai import types

load_dotenv(dotenv_path=".env")

elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

FELIX_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")  # George voice


def process_frame_and_audio(image_bytes: bytes, audio_bytes: bytes):
    # --- Transcribe audio ---
    transcription = elevenlabs.speech_to_text.convert(
        file=BytesIO(audio_bytes),
        model_id="scribe_v2",
        language_code="eng",
    )
    user_prompt = transcription.text

    # --- Send to Gemini ---
    system_context = (
        "You are Felix, a repair assistant. "
        "The user will tell you what they just did and show you an image of the device. "
        "Respond with ONLY the single immediate next step they should take. "
        "Keep it to 1-2 sentences maximum. No introductions, no lists, no extra context. "
        "Be direct and specific about the one next action only."
    )

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            f"{system_context}\n\nUser: {user_prompt}"
        ]
    )

    felix_response = response.text

    # --- Text to Dialogue (TTS via ElevenLabs) ---
    tts_audio = elevenlabs.text_to_dialogue.convert(
        inputs=[
            {
                "text": f"[clearly and helpfully] {felix_response}",
                "voice_id": FELIX_VOICE_ID,
            }
        ]
    )

    audio_bytes_out = b"".join(tts_audio)

    return {
        "transcription": user_prompt,
        "felix_response": felix_response,
        "audio_bytes": audio_bytes_out
    }
