from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger("ai_service.database")

client: AsyncIOMotorClient = None
db = None

def get_db():
    global client, db
    if db is None:
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        db = client[settings.MONGODB_DB_NAME]
    return db

async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        db = client[settings.MONGODB_DB_NAME]
        # Ping the server
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URI}, database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        logger.warning(f"MongoDB connection failed (will use fallback data if needed): {e}")

async def close_db():
    global client, db
    if client:
        client.close()
        client = None
        db = None
        logger.info("MongoDB connection closed.")
