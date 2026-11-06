import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
ALLOWED_ORIGINS = ["*"]

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY belum diisi di backend/.env")