from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.quick_menu import parse_quick_menu_item

router = APIRouter(prefix="/api/ai", tags=["Menu AI Shortcuts"])

class QuickMenuRequest(BaseModel):
    prompt: str

@router.post("/quick-menu")
async def generate_quick_menu_item(req: QuickMenuRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty (e.g. 'Rice 50')")
    
    result = await parse_quick_menu_item(req.prompt)
    return result

