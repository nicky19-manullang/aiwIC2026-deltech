import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def save_contribution(user_id: str, label: str, confidence: float, points_earned: int) -> bool:
    if not supabase:
        print("ERROR: Supabase client tidak terinisialisasi.")
        return False
    try:
        # 1. Simpan riwayat kontribusi
        data = {
            "user_id": user_id,
            "waste_label": label,
            "confidence": confidence
        }
        supabase.table("contributions").insert(data).execute()
        
        # 2. Update total poin di tabel profiles
        profile_res = supabase.table("profiles").select("total_points").eq("id", user_id).execute()
        
        if profile_res.data:
            current_points = profile_res.data[0].get("total_points", 0) or 0
            new_total = current_points + points_earned
            
            supabase.table("profiles").update({
                "total_points": new_total
            }).eq("id", user_id).execute()
            print(f"SUKSES: Poin bertambah {points_earned}. Total sekarang: {new_total}")
        else:
            print(f"GAGAL: Profil user {user_id} tidak ditemukan.")

        return True
    except Exception as e:
        print(f"ERROR DATABASE: {e}")
        return False