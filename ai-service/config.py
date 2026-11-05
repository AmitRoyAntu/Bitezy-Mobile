import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)
load_dotenv() # Also check CWD fallback

class Settings:
    PORT: int = int(os.getenv("PORT", "8001"))
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/bitezy")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "bitezy")
    
    # LLM Settings (Grok / Groq / OpenAI compatible)
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "") or os.getenv("XAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "") or os.getenv("JUSTWORKER_API_KEY", "")
    
    BASE_URL: str = os.getenv("BASE_URL", "")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "")

settings = Settings()
