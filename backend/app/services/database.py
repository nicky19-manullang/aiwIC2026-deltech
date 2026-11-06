import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def save_contribution(user_id: str, label: str, confidence: float) -> bool:
    if not supabase:
        print("ERROR: Supabase client tidak terinisialisasi. Cek .env backend.")
        return False
    try:
        data = {
            "user_id": user_id,
            "waste_label": label,
            "confidence": confidence
        }
        print(f"Mencoba menyimpan data untuk user {user_id}...")
        
        # Eksekusi insert
        response = supabase.table("contributions").insert(data).execute()
        
        print(f"Sukses! Data tersimpan: {response.data}")
        return True
    except Exception as e:
        # Ini akan menampilkan error asli dari Supabase ke terminal
        print(f"GAGAL MENYIMPAN KE SUPABASE: {e}")
        return False