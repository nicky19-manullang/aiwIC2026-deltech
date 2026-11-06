from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
from jose import jwt
from PIL import Image
import io

from app.services.ai_classifier import classify_image
from app.services.waste_guide import get_guide
from app.services.database import save_contribution
from app.services.streak import update_streak
from app.models.schemas import ClassifyResponse, ClassifyItem, GuideDetail, StreakInfo

router = APIRouter()

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Format token salah")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.get_unverified_claims(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "User ID tidak ditemukan di token")
        return user_id
    except Exception as e:
        print(f"Error verify token: {e}")
        raise HTTPException(401, "Sesi berakhir atau token tidak valid")

def sanitize_image(image_bytes: bytes) -> bytes:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        if img.width > 1024:
            ratio = 1024 / img.width
            new_size = (1024, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=70)
        return output.getvalue()
    except Exception as e:
        print(f"Sanitize error: {e}")
        return image_bytes

@router.post("/classify", response_model=ClassifyResponse)
async def classify(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File harus berupa gambar")
    
    image_bytes = await file.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(400, "Ukuran gambar maksimal 5MB")
    
    sanitized_bytes = sanitize_image(image_bytes)
    result = await classify_image(sanitized_bytes, mime_type="image/jpeg")
    
    if result.is_rejected or not result.items:
        raise HTTPException(400, detail=result.rejection_reason or "Gambar ditolak.")
    
    # --- LOGIKA POIN DINAMIS ---
    jumlah_item = len(result.items)
    if jumlah_item >= 3:
        poin_didapat = 10
    else:
        poin_didapat = jumlah_item
    # ----------------------------

    # 1. Simpan kontribusi dan update poin
    main_item = result.items[0]
    success = save_contribution(
        user_id=user_id, 
        label=main_item.label, 
        confidence=main_item.confidence,
        points_earned=poin_didapat
    )
    
    if not success:
        print(f"Peringatan: Gagal menyimpan data untuk user {user_id}")
        
    # 2. Update Streak (Gamifikasi)
    streak_data = update_streak(user_id)
    
    # 3. Bentuk respons
    response_items = []
    for item in result.items:
        guide = get_guide(item.label)
        response_items.append(ClassifyItem(
            label=item.label,
            confidence=item.confidence,
            reason=item.reason,
            guide=GuideDetail(**guide)
        ))
    
    return ClassifyResponse(
        items=response_items, 
        saved=success,
        streak=StreakInfo(**streak_data),
        points_earned=poin_didapat
    )