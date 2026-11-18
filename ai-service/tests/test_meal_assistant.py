import unittest
import os
import sys

# Ensure ai-service is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.meal_assistant import find_heuristic_combo


class TestMealAssistant(unittest.TestCase):
    def setUp(self):
        # Synthetic campus menu fixture
        self.menu = [
            {
                "id": "item_1",
                "name": "Plain Rice",
                "category": "Rice",
                "price": 30,
                "providerId": "canteen_central",
                "providerName": "Central Canteen"
            },
            {
                "id": "item_2",
                "name": "Chicken Curry",
                "category": "Curry",
                "price": 80,
                "providerId": "canteen_central",
                "providerName": "Central Canteen"
            },
            {
                "id": "item_3",
                "name": "Beef Bhuna",
                "category": "Curry",
                "price": 130,
                "providerId": "canteen_central",
                "providerName": "Central Canteen"
            },
            {
                "id": "item_4",
                "name": "Lemonade",
                "category": "Drinks",
                "price": 20,
                "providerId": "canteen_central",
                "providerName": "Central Canteen"
            },
            {
                "id": "item_5",
                "name": "Egg Khichuri",
                "category": "Rice",
                "price": 70,
                "providerId": "canteen_teachers",
                "providerName": "Teachers Cafe"
            },
            {
                "id": "item_6",
                "name": "Singara",
                "category": "Snacks",
                "price": 10,
                "providerId": "canteen_central",
                "providerName": "Central Canteen"
            }
        ]

    def test_combo_within_budget(self):
        """Verify combo total price does not exceed student budget ceiling."""
        budget = 120
        combo = find_heuristic_combo(self.menu, budget)
        self.assertIsNotNone(combo)
        self.assertLessEqual(combo["totalPrice"], budget)
        self.assertEqual(combo["totalPrice"], sum(i["price"] for i in combo["items"]))

    def test_combo_provider_colocation(self):
        """Verify all items in recommended combo originate from the same canteen."""
        budget = 150
        combo = find_heuristic_combo(self.menu, budget)
        self.assertIsNotNone(combo)
        provider_id = combo["providerId"]
        for item in combo["items"]:
            self.assertEqual(item["providerId"], provider_id)

    def test_combo_includes_drink_when_budget_permits(self):
        """Verify meal assistant adds refreshment when budget ceiling allows."""
        budget = 140  # Rice(30) + Chicken Curry(80) + Lemonade(20) = 130 <= 140
        combo = find_heuristic_combo(self.menu, budget)
        self.assertIsNotNone(combo)
        categories = [i["category"] for i in combo["items"]]
        self.assertIn("Rice", categories)
        self.assertIn("Curry", categories)
        self.assertIn("Drinks", categories)
        self.assertEqual(combo["totalPrice"], 130)

    def test_low_budget_snack_drink_combo(self):
        """Verify low budget defaults to snack + drink combo."""
        budget = 40  # Too low for Rice + Curry (minimum 110), but fits Singara(10) + Lemonade(20) = 30
        combo = find_heuristic_combo(self.menu, budget)
        self.assertIsNotNone(combo)
        categories = [i["category"] for i in combo["items"]]
        self.assertIn("Snacks", categories)
        self.assertIn("Drinks", categories)
        self.assertEqual(combo["totalPrice"], 30)

    def test_unattainable_budget_returns_none(self):
        """Verify returning None when budget is below any available combination."""
        budget = 5  # No items or combinations cost <= 5 BDT
        combo = find_heuristic_combo(self.menu, budget)
        self.assertIsNone(combo)


if __name__ == "__main__":
    unittest.main()
