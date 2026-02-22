# felix_engine.py
import os
from io import BytesIO
import tempfile
import soundfile as sf
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from google import genai
from google.genai import types


load_dotenv(dotenv_path=".env")

elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
gemini_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

SAMPLE_RATE = 16000

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
        "Respond with ONLY the single immediate next step. "
        "1-2 sentences max."
    )

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            f"{system_context}\n\nUser: {user_prompt}"
        ]
    )

    return {
        "transcription": user_prompt,
        "felix_response": response.text
    }