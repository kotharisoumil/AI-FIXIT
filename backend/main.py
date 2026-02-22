import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from cv_engine import CVEngine
from repair_steps import session_store

load_dotenv()

app = FastAPI()

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

cv_engine = CVEngine()


@app.get("/")
def read_root():
    return {
        "message": "Repair AI Backend is running",
        "cv_provider": cv_engine.provider,
    }


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

