import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(dotenv_path=".env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_diagnosis(image_bytes: bytes, image_format: str, text_context: str) -> str:
    """
    Generate a diagnosis report based on device image and user context.
    
    Args:
        image_bytes: Raw image data as bytes
        image_format: Image format (jpg, jpeg, png)
        text_context: Text description of the issue
    
    Returns:
        Diagnosis report as a formatted string
    """
    
    # Map image format to MIME type
    mime_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    mime_type = mime_map.get(image_format.lower(), "image/jpeg")

    system_prompt = f"""
You are a device repair diagnostic assistant.
The user has provided an image of their device and some context about the issue.

Generate a diagnosis report in EXACTLY this format — no extra text, no markdown, no bullet points outside the format:

Title: [short fix title]
Effort: [Low / Med / High]
Risk: [Safe / Caution / Dangerous]

Report:
[2-4 sentences max. What the issue likely is, what needs to be done, and any important warnings.]

User context: {text_context}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            system_prompt
        ]
    )

    return response.text
