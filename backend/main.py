from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routes import search, collections, products, auth

app = FastAPI(
    title="Iris API",
    description="Görsel ürün arama ve koleksiyon yönetimi backend'i.",
    version="0.2.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

# CORS — Chrome Extension ve local dashboard erişimi için
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları kaydet
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(collections.router)
app.include_router(products.router)


@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "env": settings.APP_ENV,
        "vision_provider": settings.VISION_API_PROVIDER,
    }
