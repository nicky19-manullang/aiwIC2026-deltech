from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.routes import classify

app = FastAPI(title="AIWIC2026-DelTech API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "product": "Asisten Pilah Sampah AI — DelTech"}