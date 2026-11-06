"""
Modul klasifikasi sampah berbasis AI (Gemini Vision).
Mendukung deteksi multi-objek (sampah campuran).
"""
import json
import re
from dataclasses import dataclass
from typing import List

from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL

_client = genai.Client(api_key=GEMINI_API_KEY)

PROMPT = """Kamu adalah asisten pemilahan sampah rumah tangga di Bali.
Tugasmu adalah mengklasifikasikan gambar sampah FISIK yang nyata.

ATURAN KETAT:
1. Jika gambar adalah POSTER, ILUSTRASI DIGITAL, MEME, TANGKAPAN LAYAR, atau GAMBAR HASIL AI, JAWAB dengan label "BUKAN_SAMPAH".
2. Jika gambar menunjukkan sampah di konteks yang tidak wajar, curigai sebagai manipulasi dan jawab "BUKAN_SAMPAH".
3. Jika gambar adalah foto asli sampah, DETEKSI SEMUA JENIS SAMPAH yang terlihat (maksimal 3 jenis paling dominan).

Kategori yang valid:
- organik      : sisa makanan, daun, sayur, buah
- plastik      : botol, kemasan, kantong, sedotan
- kertas       : kardus, koran, buku
- logam        : kaleng, besi, aluminium
- berbahaya    : baterai, lampu, obat kadaluarsa
- lainnya      : kaca, kain, karet

Jawab HANYA dengan format JSON Array (list) seperti ini, tanpa markdown:
[
  {"label": "organik", "confidence": 0.95, "reason": "Kulit pisang dan sisa sayur"},
  {"label": "plastik", "confidence": 0.90, "reason": "Botol air mineral bekas"}
]
"""

@dataclass
class ClassifiedItem:
    label: str
    confidence: float
    reason: str

@dataclass
class ClassificationResult:
    items: List[ClassifiedItem]
    is_rejected: bool = False
    rejection_reason: str = ""

async def classify_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> ClassificationResult:
    """
    Input : bytes gambar dari upload user
    Output: list label + confidence + alasan singkat
    Metode: Gemini Vision (multimodal LLM)
    """
    response = _client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            PROMPT,
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )

    text = response.text.strip()
    # jaga-jaga kalau model membungkus JSON dengan ```json
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()

    try:
        data = json.loads(text)
        
        # Jika AI mengembalikan objek tunggal (dict), bungkus jadi list
        if isinstance(data, dict):
            data = [data]
            
        if not isinstance(data, list):
            return ClassificationResult(items=[], is_rejected=True, rejection_reason="Format respon AI tidak dikenali")

        items = []
        kata_kunci_terlarang = ["poster", "ilustrasi", "digital", "meme", "screenshot", "tangkapan layar", "gambar ai"]

        for item in data:
            if not isinstance(item, dict):
                continue

            label = item.get("label", "lainnya")
            reason = str(item.get("reason", ""))

            # --- LOGIKA ANTI-CHEAT ---
            # Jika AI mendeteksi ini poster/ilustrasi/digital, langsung tolak semuanya!
            if any(kata in reason.lower() for kata in kata_kunci_terlarang) or label == "BUKAN_SAMPAH":
                return ClassificationResult(items=[], is_rejected=True, rejection_reason=f"Gambar ditolak: {reason}")

            # Hanya masukkan label yang valid
            if label in ("organik", "plastik", "kertas", "logam", "berbahaya", "lainnya"):
                items.append(ClassifiedItem(
                    label=label,
                    confidence=float(item.get("confidence", 0.0)),
                    reason=reason[:120]
                ))

        if not items:
            return ClassificationResult(items=[], is_rejected=True, rejection_reason="Tidak ada sampah yang terdeteksi.")
            
        # Ambil maksimal 3 item teratas agar tidak kepanjangan
        return ClassificationResult(items=items[:3])

    except (json.JSONDecodeError, ValueError):
        return ClassificationResult(items=[], is_rejected=True, rejection_reason="Gagal membaca hasil AI")