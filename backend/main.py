import os
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from felix_engine import process_frame_and_audio
from cv_engine import CVEngine
from diagnose_engine import generate_diagnosis
from repair_steps import session_store

# Load environment variables
load_dotenv('.env')

# Initialize FastAPI app
app = FastAPI()

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
        "message": "Repair AI Backend is running",
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
    return result

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
async def analyze_frame(user_id: str = "demo_user", file: UploadFile = File(...)):
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
    context: str = ""
):
    """
    Generate a diagnosis report based on device image and issue context.
    
    Args:
        image: Image file of the device
        context: Text description of the issue (optional)
    
    Returns:
        Diagnosis report with title, effort level, risk level, and detailed report
    """
    try:
        image_bytes = await image.read()
        
        # Extract image format from filename
        filename = image.filename or "image.jpg"
        image_format = filename.split(".")[-1].lower()
        
        # Generate diagnosis
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