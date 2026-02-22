# main.py
import os
import base64
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from felix_engine import process_frame_and_audio
from cv_engine import CVEngine
from diagnose_engine import generate_diagnosis
from repair_steps import session_store

load_dotenv('.env')

app = FastAPI(title="FixVision AI Backend", version="1.0.0")

# -------------------------------
# CORS setup
# -------------------------------
cors_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
if cors_origins_env.strip():
    allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Initialize engines
# -------------------------------
cv_engine = CVEngine()

# -------------------------------
# Root endpoint
# -------------------------------
@app.get("/")
def read_root():
    return {
        "message": "FixVision AI Backend is running",
        "cv_provider": cv_engine.provider,
    }

# -------------------------------
# Felix analyze endpoint
# -------------------------------
@app.post("/felix/analyze")
async def felix_analyze(
    image: UploadFile = File(...),
    audio: UploadFile = File(...)
):
    image_bytes = await image.read()
    audio_bytes = await audio.read()

    result = process_frame_and_audio(image_bytes, audio_bytes)

    # Encode audio as base64 for JSON transport
    audio_b64 = base64.b64encode(result["audio_bytes"]).decode("utf-8")

    return {
        "transcription": result["transcription"],
        "felix_response": result["felix_response"],
        "audio_base64": audio_b64,
        "audio_format": "mp3"
    }

# -------------------------------
# CV Engine session endpoints
# -------------------------------
@app.get("/session/current-step")
def get_current_step(user_id: str = "demo_user"):
    session = session_store.get(user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    step = session.get_current_step()
    if not step:
        return {"completed": True, "message": "Repair finished!"}

    return {
        "completed": False,
        "step": step,
        "total_steps": len(session.steps),
        "current_index": session.current_step_index,
    }

@app.post("/session/analyze")
async def analyze_frame(
    user_id: str = "demo_user",
    file: UploadFile = File(...)
):
    session = session_store.get(user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_step = session.get_current_step()
    if not current_step:
        return {"completed": True}

    image_bytes = await file.read()
    result = cv_engine.process_frame(
        image_bytes,
        current_step.target_object,
        current_step.action,
    )

    if result.get("step_complete"):
        session.advance_step()
        result["next_step"] = session.get_current_step()

    return result

# -------------------------------
# Diagnose endpoint
# -------------------------------
@app.post("/diagnose")
async def diagnose_analyze(
    image: UploadFile = File(...),
    context: str = Form(default="")
):
    try:
        image_bytes = await image.read()
        filename = image.filename or "image.jpg"
        image_format = filename.split(".")[-1].lower()
        diagnosis_report = generate_diagnosis(image_bytes, image_format, context)

        return {
            "success": True,
            "diagnosis": diagnosis_report
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
