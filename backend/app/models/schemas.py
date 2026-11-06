from pydantic import BaseModel
from typing import List

class GuideDetail(BaseModel):
    title: str
    steps: List[str]
    tip: str

class ClassifyItem(BaseModel):
    label: str
    confidence: float
    reason: str
    guide: GuideDetail

class ClassifyResponse(BaseModel):
    items: List[ClassifyItem]
    saved: bool = False
class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    badges: list[str]
    earned_badge: str | None = None
    already_scanned_today: bool = False

class ClassifyResponse(BaseModel):
    items: List[ClassifyItem]
    saved: bool = False
    streak: StreakInfo