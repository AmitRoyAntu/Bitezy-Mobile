import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_db, close_db
from routers.chat import router as chat_router
from routers.menu import router as menu_router
from routers.reviews import router as reviews_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ai_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Bitezy AI Service...")
    await connect_db()
    yield
    logger.info("Shutting down Bitezy AI Service...")
    await close_db()

app = FastAPI(
    title="Bitezy AI Service",
    description="Intelligent AI Meal Assistant, Review Summarizer, and Menu Generator for Bitezy",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Native mobile app & local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat_router)
app.include_router(menu_router)
app.include_router(reviews_router)

@app.get("/")
async def root():
    return {
        "service": "Bitezy AI Service",
        "status": "healthy",
        "endpoints": [
            "/api/ai/chat",
            "/api/ai/quick-suggestions",
            "/api/ai/quick-menu",
            "/api/ai/summarize-reviews"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    from config import settings
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

