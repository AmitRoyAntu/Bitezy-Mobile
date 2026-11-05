import os
import json
import logging
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from config import settings

logger = logging.getLogger("ai_service.llm")

def get_llm_client_and_model():
    """
    Returns an initialized AsyncOpenAI client and model name
    based on available API keys and configuration.
    Supports:
      1. xAI Grok (if GROK_API_KEY or XAI_API_KEY is present)
      2. Groq (if GROQ_API_KEY is present)
      3. Custom OpenAI-compatible proxy (BASE_URL + API key)
      4. OpenAI official (OPENAI_API_KEY)
    """
    api_key = ""
    base_url = None
    model_name = settings.MODEL_NAME

    if settings.GROK_API_KEY:
        api_key = settings.GROK_API_KEY
        base_url = "https://api.x.ai/v1"
        if not model_name:
            model_name = "grok-beta"
    elif settings.GROQ_API_KEY:
        api_key = settings.GROQ_API_KEY
        base_url = "https://api.groq.com/openai/v1"
        if not model_name:
            model_name = "qwen/qwen3.8-27b"
    elif settings.BASE_URL:
        base_url = settings.BASE_URL
        api_key = settings.ANTHROPIC_API_KEY or settings.OPENAI_API_KEY or os.getenv("JUSTWORKER_API_KEY", "dummy-key")
        if not model_name:
            model_name = "grok-2"
    elif settings.OPENAI_API_KEY:
        api_key = settings.OPENAI_API_KEY
        base_url = "https://api.openai.com/v1"
        if not model_name:
            model_name = "gpt-4o-mini"
    else:
        # Fallback dummy for development
        api_key = "dummy-key"
        base_url = "https://api.groq.com/openai/v1"
        model_name = "grok-beta"

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    return client, model_name

async def generate_chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    response_format: Optional[Dict[str, str]] = None,
    max_tokens: int = 1000
) -> str:
    """
    Calls the LLM with chat messages.
    """
    client, model = get_llm_client_and_model()
    try:
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if response_format:
            kwargs["response_format"] = response_format

        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"Error calling LLM ({model}): {e}")
        raise e

