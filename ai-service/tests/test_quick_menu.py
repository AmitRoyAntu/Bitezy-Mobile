import unittest
import asyncio
import os
import sys

# Ensure ai-service is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.quick_menu import parse_quick_menu_item, ALLOWED_CATEGORIES, CATEGORY_DEFAULTS


class TestQuickMenu(unittest.TestCase):
    def test_allowed_categories_present(self):
        """Verify standard campus food categories are defined."""
        expected = ["Rice", "Curry", "Fast Food", "Snacks", "Drinks", "Dessert"]
        for cat in expected:
            self.assertIn(cat, ALLOWED_CATEGORIES)

    def test_category_defaults_have_fallback_images(self):
        """Ensure all categories map to a fallback image URL."""
        for cat in ALLOWED_CATEGORIES:
            self.assertIn(cat, CATEGORY_DEFAULTS)
            self.assertTrue(CATEGORY_DEFAULTS[cat].startswith("https://"))

    def test_parse_curry_item(self):
        """Verify shorthand 'Beef Curry 120' extracts price and category."""
        res = asyncio.run(parse_quick_menu_item("Beef Curry 120"))
        self.assertIn(res["category"], ALLOWED_CATEGORIES)
        self.assertEqual(res["category"], "Curry")
        self.assertEqual(res["price"], 120.0)
        self.assertTrue(res["available"])
        self.assertIn("Beef Curry", res["name"])

    def test_parse_rice_item(self):
        """Verify shorthand 'Chicken Biryani 180' resolves to Rice category."""
        res = asyncio.run(parse_quick_menu_item("Chicken Biryani 180"))
        self.assertEqual(res["category"], "Rice")
        self.assertEqual(res["price"], 180.0)
        self.assertTrue(res["available"])

    def test_parse_fast_food(self):
        """Verify shorthand 'Chicken Burger 90' resolves to Fast Food category."""
        res = asyncio.run(parse_quick_menu_item("Chicken Burger 90"))
        self.assertEqual(res["category"], "Fast Food")
        self.assertEqual(res["price"], 90.0)

    def test_parse_drink_item(self):
        """Verify shorthand 'Cold Coffee 40' resolves to Drinks category."""
        res = asyncio.run(parse_quick_menu_item("Cold Coffee 40"))
        self.assertEqual(res["category"], "Drinks")
        self.assertEqual(res["price"], 40.0)

    def test_parse_snack_item(self):
        """Verify shorthand 'Singara 10' resolves to Snacks category."""
        res = asyncio.run(parse_quick_menu_item("Singara 10"))
        self.assertEqual(res["category"], "Snacks")
        self.assertEqual(res["price"], 10.0)

    def test_parse_item_without_price_defaults(self):
        """Verify shorthand with no numerical price defaults gracefully."""
        res = asyncio.run(parse_quick_menu_item("Egg Dal"))
        self.assertEqual(res["category"], "Curry")
        self.assertGreater(res["price"], 0)
        self.assertTrue(res["available"])


if __name__ == "__main__":
    unittest.main()
