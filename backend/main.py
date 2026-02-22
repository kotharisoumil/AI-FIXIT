from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from repair_steps import session_store
from cv_engine import CVEngine

app = FastAPI()

# Allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cv_engine = CVEngine()

@app.get("/")
def read_root():
    return {"message": "Repair AI Backend is running"}

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
        "current_index": session.current_step_index
    }

@app.post("/session/analyze")
async def analyze_frame(user_id: str = "demo_user", file: UploadFile = File(...)):
    """
    Frontend sends a webcam frame here.
    Backend checks if the current step's goal is met.
    """
    session = session_store.get(user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_step = session.get_current_step()
    if not current_step:
        return {"completed": True}

    # Read image file
    image_bytes = await file.read()
    
    # Process with CV
    result = cv_engine.process_frame(
        image_bytes, 
        current_step.target_object, 
        current_step.action
    )

    # If CV says step is done, advance the state
    if result["step_complete"]:
        session.advance_step()
        result["next_step"] = session.get_current_step()

    return result