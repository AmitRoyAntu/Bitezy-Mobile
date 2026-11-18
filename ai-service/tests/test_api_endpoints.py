import unittest
import os
import sys

# Ensure ai-service is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestApiEndpoints(unittest.TestCase):
    def test_root_endpoint_health(self):
        """Verify GET / returns 200 and healthy metadata."""
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("service"), "Bitezy AI Service")
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("/api/ai/chat", data.get("endpoints", []))

    def test_health_check_endpoint(self):
        """Verify GET /health returns 200 OK."""
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_quick_menu_empty_prompt_validation(self):
        """Verify POST /api/ai/quick-menu rejects empty prompt with 400."""
        response = client.post("/api/ai/quick-menu", json={"prompt": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("cannot be empty", response.json().get("detail", ""))

    def test_chat_empty_message_validation(self):
        """Verify POST /api/ai/chat rejects empty message with 400."""
        response = client.post("/api/ai/chat", json={"message": ""})
        self.assertEqual(response.status_code, 400)
        self.assertIn("cannot be empty", response.json().get("detail", ""))

    def test_summarize_reviews_missing_param_validation(self):
        """Verify GET /api/ai/summarize-reviews requires provider_id."""
        response = client.get("/api/ai/summarize-reviews")
        # FastAPI returns 422 for missing required query parameters
        self.assertIn(response.status_code, [400, 422])


if __name__ == "__main__":
    unittest.main()
