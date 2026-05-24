import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.vision_service import search_by_image
from models.schemas import ProductSearchResponse

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    image_base64: str
    count: int = 6


@router.post("", response_model=ProductSearchResponse)
async def search(request: SearchRequest):
    """
    Crop edilen görseli alır, aktif görsel arama API'sini çağırır,
    normalize edilmiş ürün listesini döner.
    """
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 boş olamaz.")

    if not 1 <= request.count <= 20:
        raise HTTPException(status_code=400, detail="count 1 ile 20 arasında olmalıdır.")

    results = search_by_image(request.image_base64, request.count)

    return ProductSearchResponse(
        results=results,
        total=len(results),
        query_id=str(uuid.uuid4()),
    )
