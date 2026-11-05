import json
import logging
import re
import os
from typing import List, Dict, Any, Optional
from database import get_db
from services.llm_client import generate_chat_completion

logger = logging.getLogger("ai_service.meal_assistant")

def load_fallback_data():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    menu_file = os.path.join(base_dir, "menu.json")
    providers_file = os.path.join(base_dir, "providers.json")

    providers = []
    menu_items = []

    if os.path.exists(providers_file):
        with open(providers_file, "r") as f:
            data = json.load(f)
            providers = data.get("providers", [])

    if os.path.exists(menu_file):
        with open(menu_file, "r") as f:
            data = json.load(f)
            menu_items = data.get("menu", [])

    return menu_items, providers

async def fetch_menu_and_providers():
    providers = []
    menu_items = []
    try:
        db = get_db()
        providers_cursor = db.providers.find({})
        providers = await providers_cursor.to_list(length=100)
        menu_cursor = db.menuitems.find({"available": True})
        menu_items = await menu_cursor.to_list(length=300)
    except Exception as e:
        logger.warning(f"Could not fetch from MongoDB, using JSON dataset fallback: {e}")

    if not providers or not menu_items:
        fb_menu, fb_prov = load_fallback_data()
        if not providers:
            providers = fb_prov
        if not menu_items:
            menu_items = fb_menu
    
    # Map providers by id / _id string
    provider_map = {}
    for p in providers:
        p_id = str(p.get("_id", p.get("id", "")))
        provider_map[p_id] = p
        if "id" in p:
            provider_map[str(p["id"])] = p

    # Attach provider name to menu items
    enhanced_menu = []
    for item in menu_items:
        p_ref = str(item.get("provider", ""))
        prov = provider_map.get(p_ref, {})
        prov_name = prov.get("name", "Campus Canteen")
        is_open = prov.get("isOpen", True)
        
        enhanced_menu.append({
            "id": str(item.get("_id", item.get("id", ""))),
            "name": item.get("name", ""),
            "category": item.get("category", "Meals"),
            "price": item.get("price", 0),
            "desc": item.get("desc", ""),
            "img": item.get("img", ""),
            "providerId": p_ref,
            "providerName": prov_name,
            "providerOpen": is_open
        })

    return enhanced_menu, list(provider_map.values())

def find_heuristic_combo(menu_items: List[Dict[str, Any]], budget: int, category_pref: str = None) -> Optional[Dict[str, Any]]:
    """
    Finds a balanced combo (e.g. Main + Side/Curry or Main + Drink) within budget.
    """
    mains = [m for m in menu_items if m["category"] in ["Rice", "Fast Food"] and m["price"] <= budget]
    curries = [m for m in menu_items if m["category"] in ["Curry"] and m["price"] <= budget]
    snacks = [m for m in menu_items if m["category"] in ["Snacks"] and m["price"] <= budget]
    drinks = [m for m in menu_items if m["category"] in ["Drinks", "Dessert"] and m["price"] <= budget]

    best_combo = None
    best_total = 0

    # Pattern 1: Main + Curry (e.g. Rice + Beef/Chicken/Egg Curry)
    for main in mains:
        for curry in curries:
            # Prefer items from the same provider
            if main["providerId"] == curry["providerId"]:
                tot = main["price"] + curry["price"]
                if tot <= budget and tot > best_total:
                    best_total = tot
                    best_combo = {
                        "title": f"{main['providerName']} Meal Combo",
                        "totalPrice": tot,
                        "providerId": main["providerId"],
                        "providerName": main["providerName"],
                        "items": [main, curry]
                    }
                    # Check if we can also squeeze in a drink
                    for drink in drinks:
                        if drink["providerId"] == main["providerId"] and tot + drink["price"] <= budget:
                            best_total = tot + drink["price"]
                            best_combo["totalPrice"] = best_total
                            best_combo["items"].append(drink)
                            break

    # Pattern 2: Snack + Drink if budget is lower or no combo found
    if not best_combo:
        for snack in snacks:
            for drink in drinks:
                if snack["providerId"] == drink["providerId"]:
                    tot = snack["price"] + drink["price"]
                    if tot <= budget and tot > best_total:
                        best_total = tot
                        best_combo = {
                            "title": f"Snack & Refreshment Combo",
                            "totalPrice": tot,
                            "providerId": snack["providerId"],
                            "providerName": snack["providerName"],
                            "items": [snack, drink]
                        }

    return best_combo

async def handle_meal_assistant_chat(
    user_message: str,
    conversation_history: List[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Processes a chat query with BitezyBot, returning:
    - reply_text: conversational text
    - combo: combo package if requested/relevant
    - recommended_items: list of individual items
    - suggestions: quick reply pills
    """
    menu_items, providers = await fetch_menu_and_providers()

    # Detect budget numbers in query (e.g., "80", "150 BDT", "under 100", "budget 200")
    budget_match = re.search(r'(?:under|budget|for|below|within|max)?\s*(\d+)\s*(?:bdt|tk|taka)?', user_message.lower())
    detected_budget = None
    if budget_match:
        val = int(budget_match.group(1))
        if 20 <= val <= 2000:
            detected_budget = val

    is_combo_request = any(word in user_message.lower() for word in ["combo", "package", "bundle", "full lunch", "dinner set", "meal plan"])

    # Prepare compact catalog for LLM prompt context
    canteen_summary = [
        f"- {p.get('name')}: open {p.get('openTime', '06:00')}-{p.get('closeTime', '22:00')}, location: {p.get('location', '')}, rating: {p.get('rating', '4.5')}"
        for p in providers if isinstance(p, dict)
    ]
    
    # Filter a subset of menu items to keep context small & relevant
    if detected_budget:
        relevant_items = [m for m in menu_items if m["price"] <= detected_budget][:25]
    else:
        relevant_items = menu_items[:30]

    menu_summary = [
        f"- ID:{m['id']} | {m['name']} ({m['category']}) | {m['price']} BDT | {m['providerName']}"
        for m in relevant_items
    ]

    system_prompt = f"""You are BitezyBot, the friendly, smart AI campus dining assistant for Bitezy at CUET.
You assist university students with:
1. Finding food and snacks fitting their budget (in Bangladeshi Taka - BDT).
2. Creating combo packages (e.g. Rice + Curry + Drink).
3. Answering questions about campus canteens (hours, locations, popular dishes).

Tone: Friendly, helpful, energetic, student-oriented. Use crisp English or occasional friendly Bengali slang if appropriate.
Currency: Always specify prices in BDT (e.g., "120 BDT").

Real-time Campus Canteens:
{chr(10).join(canteen_summary[:6])}

Available Menu Sample:
{chr(10).join(menu_summary[:25])}

When recommending specific items, reference real items from the menu sample.
If the student asks for a combo, describe the components and calculate the exact total price.
Output your response as clean JSON with the following format:
{{
  "reply": "Your friendly conversational response to the student.",
  "recommended_item_ids": ["ID1", "ID2"],
  "combo": {{
      "title": "Combo Name (e.g. Nazrul Hall Lunch Special)",
      "total_price": 140,
      "item_ids": ["ID1", "ID2"]
  }} or null,
  "suggestions": ["Quick prompt 1", "Quick prompt 2", "Quick prompt 3"]
}}
"""

    messages = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        for msg in conversation_history[-4:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_message})

    # Try calling LLM
    try:
        raw_response = await generate_chat_completion(
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        parsed = json.loads(raw_response)
        reply = parsed.get("reply", "")
        rec_ids = parsed.get("recommended_item_ids", [])
        combo_data = parsed.get("combo")
        suggestions = parsed.get("suggestions", ["Snacks under 80 BDT", "Lunch Combo for 140 BDT", "Which canteens are open?"])
    except Exception as e:
        logger.warning(f"LLM call failed, falling back to heuristic engine: {e}")
        # Deterministic fallback logic
        if detected_budget:
            combo = find_heuristic_combo(menu_items, detected_budget)
            if combo:
                reply = f"Here is a great combo within your budget of {detected_budget} BDT from {combo['providerName']}!"
                combo_data = {
                    "title": combo["title"],
                    "total_price": combo["totalPrice"],
                    "item_ids": [it["id"] for it in combo["items"]]
                }
                rec_ids = [it["id"] for it in combo["items"]]
            else:
                under_budget = [m for m in menu_items if m["price"] <= detected_budget][:3]
                reply = f"Here are delicious items available for under {detected_budget} BDT:"
                rec_ids = [m["id"] for m in under_budget]
                combo_data = None
        else:
            reply = "Hello! I am BitezyBot, your campus food assistant. Tell me your budget or what you are craving, and I'll find or bundle the best meals for you!"
            rec_ids = [m["id"] for m in menu_items[:3]]
            combo_data = None
        suggestions = ["Snacks under 80 BDT", "Lunch Combo for 140 BDT", "Which canteens are open?", "Dinner set for 2"]

    # Resolve recommended items with full details
    item_lookup = {str(m["id"]): m for m in menu_items}
    resolved_recommended = [item_lookup[str(iid)] for iid in rec_ids if str(iid) in item_lookup]

    # Resolve combo package items if present
    resolved_combo = None
    if combo_data and isinstance(combo_data, dict) and combo_data.get("item_ids"):
        c_items = [item_lookup[str(iid)] for iid in combo_data.get("item_ids", []) if str(iid) in item_lookup]
        if c_items:
            resolved_combo = {
                "title": combo_data.get("title", "Student Combo Package"),
                "totalPrice": sum(it["price"] for it in c_items),
                "items": c_items,
                "providerName": c_items[0]["providerName"] if c_items else "Campus Canteen",
                "providerId": c_items[0]["providerId"] if c_items else ""
            }

    return {
        "reply": reply,
        "recommended_items": resolved_recommended,
        "combo": resolved_combo,
        "suggestions": suggestions
    }
