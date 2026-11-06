from datetime import date, timedelta
from app.services.database import supabase

def update_streak(user_id: str) -> dict:
    """Menghitung dan memperbarui streak harian user."""
    if not supabase:
        return {"current_streak": 0, "longest_streak": 0, "badges": [], "earned_badge": None, "already_scanned_today": True}

    today = date.today()
    
    res = supabase.table("user_streaks").select("*").eq("user_id", user_id).execute()
    
    if not res.data:
        # User baru, langsung buat streak 1 dan set flag
        new_data = {
            "user_id": user_id, 
            "current_streak": 1, 
            "longest_streak": 1, 
            "last_scan_date": today.isoformat(),
            "badges": []
        }
        supabase.table("user_streaks").insert(new_data).execute()
        return {"current_streak": 1, "longest_streak": 1, "badges": [], "earned_badge": None, "already_scanned_today": False}

    data = res.data[0]
    last_scan = date.fromisoformat(data["last_scan_date"]) if data["last_scan_date"] else None
    current_streak = data["current_streak"]
    longest_streak = data["longest_streak"]
    badges = list(data["badges"]) if data["badges"] else []
    earned_badge = None

    # LOGIKA PENTING
    if last_scan == today:
        # KONDISI 1: Sudah scan hari ini
        # Jangan ubah streak, kembalikan data yang ada, dan set flag True
        return {
            "current_streak": current_streak, 
            "longest_streak": longest_streak, 
            "badges": badges,
            "earned_badge": None,
            "already_scanned_today": True
        }
        
    elif last_scan == today - timedelta(days=1):
        # KONDISI 2: Scan berturut-turut (hari berikutnya)
        current_streak += 1
        if current_streak > longest_streak:
            longest_streak = current_streak
    else:
        # KONDISI 3: Putus streak (bolong sehari atau lebih)
        current_streak = 1 

    milestones = {10: "Pemula Hijau", 50: "Pejuang Bumi", 100: "Pahlawan Bali"}
    if current_streak in milestones and milestones[current_streak] not in badges:
        earned_badge = milestones[current_streak]
        badges.append(earned_badge)

    supabase.table("user_streaks").update({
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_scan_date": today.isoformat(),
        "badges": badges
    }).eq("user_id", user_id).execute()

    return {
        "current_streak": current_streak, 
        "longest_streak": longest_streak, 
        "badges": badges,
        "earned_badge": earned_badge,
        "already_scanned_today": False # Set flag False karena ini scan pertama hari ini
    }