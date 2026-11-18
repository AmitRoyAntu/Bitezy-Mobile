import json
import logging
import re
from typing import Dict, Any
from services.llm_client import generate_chat_completion

logger = logging.getLogger("ai_service.quick_menu")

CATEGORY_DEFAULTS = {
    "Rice": "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300&auto=format&fit=crop&q=80",
    "Curry": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80",
    "Fast Food": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80",
    "Snacks": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80",
    "Drinks": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&auto=format&fit=crop&q=80",
    "Dessert": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=80"
}

ALLOWED_CATEGORIES = ["Rice", "Curry", "Fast Food", "Snacks", "Drinks", "Dessert"]

async def parse_quick_menu_item(prompt: str) -> Dict[str, Any]:
    """
    Parses short text like 'Rice 50' or 'Singara 15 tk' or 'Special Beef Curry 140'
    into a complete MenuItem object with category, price, desc, and img.
    """
    system_prompt = f"""You are an AI assistant for university campus canteen managers on the Bitezy platform.
The canteen manager provides a shorthand description of a food item they want to add (e.g. "Rice 50", "Chicken Roast 130", "Cha 10 tk").

Extract and generate the following fields:
1. "name": Proper appealing dish name (e.g. "Steamed Plain Rice", "Hot Spiced Tea").
2. "category": EXACTLY one of: {json.dumps(ALLOWED_CATEGORIES)}.
3. "price": Positive integer price in BDT.
4. "desc": An appetizing 1-sentence description suitable for students.
5. "img": A relevant, high-resolution food image URL (from Unsplash).

Output strictly valid JSON with keys: name, category, price, desc, img.
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    try:
        raw_response = await generate_chat_completion(
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        parsed = json.loads(raw_response)
        
        category = parsed.get("category", "Snacks")
        if category not in ALLOWED_CATEGORIES:
            category = "Snacks"

        img = parsed.get("img") or CATEGORY_DEFAULTS.get(category, CATEGORY_DEFAULTS["Snacks"])
        price = parsed.get("price", 50)
        try:
            price = float(price)
        except Exception:
            price = 50

        return {
            "name": parsed.get("name", prompt.title()),
            "category": category,
            "price": price,
            "desc": parsed.get("desc", f"Freshly prepared {parsed.get('name', prompt.title())}."),
            "img": img,
            "available": True
        }
    except Exception as e:
        logger.warning(f"Quick menu AI parsing failed, using rule-based fallback: {e}")
        # Rule-based fallback
        # Extract number for price (enforcing positive non-zero price)
        nums = re.findall(r'\d+', prompt)
        raw_price = float(nums[0]) if nums else 50
        price = raw_price if raw_price > 0 else 50
        name_part = re.sub(r'\d+.*$', '', prompt).strip() or prompt.strip()
        name = name_part.title()

        # Guess category
        lower = prompt.lower()
        if any(w in lower for w in ["burger", "pizza", "roll", "sandwich", "fries", "chowmein", "pasta"]):
            cat = "Fast Food"
        elif any(w in lower for w in ["rice", "biryani", "khichuri", "polau", "tehari"]):
            cat = "Rice"
        elif any(w in lower for w in ["curry", "beef", "chicken", "fish", "dal", "egg", "vegetable"]):
            cat = "Curry"
        elif any(w in lower for w in ["tea", "cha", "coffee", "coke", "drink", "juice", "water", "borhani"]):
            cat = "Drinks"
        elif any(w in lower for w in ["sweet", "cake", "ice cream", "dessert", "pudding"]):
            cat = "Dessert"
        else:
            cat = "Snacks"

        return {
            "name": name,
            "category": cat,
            "price": price,
            "desc": f"Fresh and tasty {name.lower()}, prepared daily for campus students.",
            "img": CATEGORY_DEFAULTS.get(cat, CATEGORY_DEFAULTS["Snacks"]),
            "available": True
        }

