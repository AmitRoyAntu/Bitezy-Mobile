from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from services.meal_assistant import handle_meal_assistant_chat

router = APIRouter(prefix="/api/ai", tags=["Chat & Meal Assistant"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/chat")
async def chat_with_bitezy_bot(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history or []]
    result = await handle_meal_assistant_chat(req.message, history_dicts)
    return result

@router.get("/quick-suggestions")
async def get_quick_suggestions():
    return {
        "suggestions": [
            "Cheap snacks under 80 BDT",
            "Lunch combo under 150 BDT",
            "What canteens are open now?",
            "High protein chicken meal",
            "Tea and evening snacks"
        ]
    }

