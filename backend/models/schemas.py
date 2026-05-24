from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# ──────────────────────────────────────────────
# ARAMA SONUCU — API adapter'dan extension'a giden format
# ──────────────────────────────────────────────

class ProductSearchResult(BaseModel):
    """
    Tüm görsel arama API adapter'larının döndürmek zorunda olduğu
    normalize edilmiş ürün formatı. API değişse bile bu format değişmez.
    """
    product_id: str = Field(..., description="Benzersiz ürün kimliği (adapter tarafından üretilir)")
    product_name: str = Field(..., description="Ürün adı")
    price: Optional[float] = Field(None, description="Fiyat (bilinmiyorsa null)")
    currency: str = Field("USD", description="Para birimi kodu (ISO 4217)")
    store_name: str = Field(..., description="Mağaza adı")
    store_url: str = Field(..., description="Ürün sayfası URL'i")
    image_url: str = Field(..., description="Ürün görseli URL'i")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Benzerlik skoru (0-1)")
    category: Optional[str] = Field(None, description="Ürün kategorisi")
    source_api: str = Field(..., description="Veriyi sağlayan API: mock | google_vision | serpapi | rekognition")


class ProductSearchResponse(BaseModel):
    """Extension sidebar'a dönen tam yanıt."""
    results: list[ProductSearchResult]
    total: int
    query_id: str = Field(..., description="Bu arama oturumunun kimliği (loglama için)")


# ──────────────────────────────────────────────
# KAYDETME İSTEĞİ — extension'dan backend'e gelir
# ──────────────────────────────────────────────

class ProductSaveRequest(BaseModel):
    """
    Kullanıcı 'Koleksiyona Ekle' dediğinde gelen istek.
    collection_id boşsa backend default koleksiyona yazar.
    """
    collection_id: Optional[UUID] = Field(None, description="Hedef koleksiyon (null → default koleksiyon)")
    product_name: str
    price: Optional[float] = None
    currency: str = "USD"
    store_name: str
    store_url: str
    image_url: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    category: Optional[str] = None
    source_api: str


class ProductSaveResponse(BaseModel):
    """Kaydetme işleminin sonucu."""
    saved_product_id: UUID
    collection_id: UUID
    message: str = "Ürün koleksiyona eklendi."


# ──────────────────────────────────────────────
# KOLEKSİYON MODELLERİ
# ──────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CollectionResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    is_default: bool
    created_at: datetime


# ──────────────────────────────────────────────
# KULLANICI PROFİLİ
# ──────────────────────────────────────────────

class UserProfile(BaseModel):
    id: UUID
    tier: str = Field("free", pattern="^(free|pro|ultra)$")
    stripe_customer_id: Optional[str] = None
    snap_count_month: int = 0


# ──────────────────────────────────────────────
# GENEL HATA FORMATI
# ──────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
