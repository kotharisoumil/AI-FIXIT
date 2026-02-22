from fastapi import UploadFile, File
from felix_engine import process_frame_and_audio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/felix/analyze")
async def felix_analyze(
    image: UploadFile = File(...),
    audio: UploadFile = File(...)
):
    image_bytes = await image.read()
    audio_bytes = await audio.read()

    result = process_frame_and_audio(image_bytes, audio_bytes)

    return result