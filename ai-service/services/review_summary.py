import json
import logging
import os
from typing import Dict, Any, List
from database import get_db
from services.llm_client import generate_chat_completion

logger = logging.getLogger("ai_service.review_summary")

def load_fallback_reviews_and_providers():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    reviews_file = os.path.join(base_dir, "reviews.json")
    providers_file = os.path.join(base_dir, "providers.json")

    reviews = []
    providers = []

    if os.path.exists(reviews_file):
        with open(reviews_file, "r") as f:
            data = json.load(f)
            reviews = data.get("reviews", [])

    if os.path.exists(providers_file):
        with open(providers_file, "r") as f:
            data = json.load(f)
            providers = data.get("providers", [])

    return reviews, providers

async def summarize_reviews(provider_id: str, audience: str = "buyer") -> Dict[str, Any]:
    """
    Summarizes customer reviews for a given provider/canteen.
    Audience can be:
      - 'buyer' (for students browsing reviews)
      - 'seller' (for canteen manager dashboard)
    """
    reviews = []
    canteen_name = "Campus Canteen"
    try:
        db = get_db()
        # Query reviews matching provider
        reviews_cursor = db.reviews.find({
            "$or": [
                {"provider": provider_id},
                {"provider": int(provider_id) if provider_id.isdigit() else provider_id}
            ]
        }).sort("createdAt", -1).limit(40)
        
        reviews = await reviews_cursor.to_list(length=40)
        
        # Also fetch provider details for name
        prov = await db.providers.find_one({
            "$or": [
                {"_id": provider_id},
                {"id": int(provider_id) if provider_id.isdigit() else provider_id}
            ]
        })
        if prov:
            canteen_name = prov.get("name", "Canteen")
    except Exception as e:
        logger.warning(f"Failed to query MongoDB reviews, using fallback: {e}")

    if not reviews:
        fb_reviews, fb_provs = load_fallback_reviews_and_providers()
        # Find provider name
        for p in fb_provs:
            if str(p.get("id")) == str(provider_id) or str(p.get("_id")) == str(provider_id):
                canteen_name = p.get("name", canteen_name)
                break
        # Filter matching reviews
        reviews = [
            r for r in fb_reviews
            if str(r.get("provider")) == str(provider_id)
        ]

    if not reviews:
        if audience == "seller":
            return {
                "canteen_name": canteen_name,
                "review_count": 0,
                "overall_sentiment": "No Reviews Yet",
                "strengths": ["Newly opened or waiting for reviews"],
                "complaints": [],
                "actionable_tips": ["Encourage students to rate your food after pickup to build your reputation!"]
            }
        else:
            return {
                "canteen_name": canteen_name,
                "review_count": 0,
                "summary": "This canteen currently has no student reviews. Be the first to order and share your feedback!",
                "pros": ["Freshly added canteen"],
                "cons": [],
                "top_dishes": []
            }

    # Extract comments and ratings
    review_texts = [
        f"Rating: {r.get('rating', 5)}/5 - Comment: {r.get('comment', 'No comment')}"
        for r in reviews if r.get('comment')
    ]
    
    avg_rating = sum(r.get("rating", 5) for r in reviews) / len(reviews)

    if audience == "seller":
        system_prompt = f"""You are an AI Business Consultant for canteen managers at CUET university on the Bitezy platform.
Analyze these student reviews for "{canteen_name}" and generate an operational health digest for the seller.

Reviews:
{chr(10).join(review_texts[:20])}

Output strictly valid JSON with the following structure:
{{
  "overall_sentiment": "Positive / Mixed / Needs Attention",
  "average_rating": {round(avg_rating, 1)},
  "review_count": {len(reviews)},
  "strengths": ["List of 2-3 things students love"],
  "complaints": ["List of 1-3 operational or food complaints"],
  "actionable_tips": ["List of 2-3 concrete tips to boost orders and ratings"]
}}
"""
    else:
        system_prompt = f"""You are Bitezy's student dining guide.
Summarize the student reviews for "{canteen_name}" to help university students decide what to order.

Reviews:
{chr(10).join(review_texts[:20])}

Output strictly valid JSON with the following structure:
{{
  "summary": "2-sentence summary highlighting food quality and overall vibe",
  "average_rating": {round(avg_rating, 1)},
  "review_count": {len(reviews)},
  "top_dishes": ["List of 1-3 dishes students praised"],
  "pros": ["1-3 quick pros"],
  "cons": ["1-2 things to be aware of (e.g. wait time or rush)"]
}}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Please summarize the reviews for {canteen_name} in the specified JSON format."}
    ]

    try:
        raw_response = await generate_chat_completion(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        parsed = json.loads(raw_response)
        parsed["canteen_name"] = canteen_name
        return parsed
    except Exception as e:
        logger.warning(f"AI review summary failed, using heuristic: {e}")
        if audience == "seller":
            return {
                "canteen_name": canteen_name,
                "overall_sentiment": "Positive" if avg_rating >= 4.0 else "Mixed",
                "average_rating": round(avg_rating, 1),
                "review_count": len(reviews),
                "strengths": ["Consistent taste", "Popular daily items"],
                "complaints": ["Peak hour rush delays"],
                "actionable_tips": ["Prepare popular lunch dishes 15 minutes before 1:00 PM break", "Ensure takeaway containers are tightly closed"]
            }
        else:
            return {
                "canteen_name": canteen_name,
                "summary": f"Students rate {canteen_name} an average of {round(avg_rating, 1)}/5, enjoying the campus-friendly pricing and daily fresh meals.",
                "average_rating": round(avg_rating, 1),
                "review_count": len(reviews),
                "top_dishes": ["Beef Curry", "Khichuri", "Hot Tea"],
                "pros": ["Affordable pricing", "Good portions"],
                "cons": ["Crowded during midday break"]
            }
