from fastapi import APIRouter, Query, HTTPException
from services.review_summary import summarize_reviews

router = APIRouter(prefix="/api/ai", tags=["Review Summaries"])

@router.get("/summarize-reviews")
async def get_review_summary(
    provider_id: str = Query(..., description="ID of the provider/canteen"),
    audience: str = Query("buyer", pattern="^(buyer|seller)$", description="'buyer' or 'seller'")
):
    if not provider_id:
        raise HTTPException(status_code=400, detail="provider_id is required")
    
    result = await summarize_reviews(provider_id, audience)
    return result
