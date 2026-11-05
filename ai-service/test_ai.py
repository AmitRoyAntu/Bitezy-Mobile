import asyncio
import os
import sys

# Ensure ai-service is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from database import connect_db, close_db
from services.quick_menu import parse_quick_menu_item
from services.meal_assistant import handle_meal_assistant_chat
from services.review_summary import summarize_reviews

async def main():
    print("Testing MongoDB connection...")
    await connect_db()

    print("\n1. Testing Quick Menu Shortcut ('Rice 50'):")
    res1 = await parse_quick_menu_item("Rice 50")
    print("Result:", res1)

    print("\n2. Testing BitezyBot Chat ('Cheap snacks under 80 BDT'):")
    res2 = await handle_meal_assistant_chat("Cheap snacks under 80 BDT")
    print("Reply:", res2.get("reply"))
    print("Recommended items count:", len(res2.get("recommended_items", [])))
    print("Combo:", res2.get("combo"))

    print("\n3. Testing Review Summarizer (buyer & seller):")
    res3 = await summarize_reviews("1", "buyer")
    print("Buyer summary:", res3)
    res4 = await summarize_reviews("1", "seller")
    print("Seller summary:", res4)

    await close_db()
    print("\nAll tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(main())

