from fastapi import APIRouter
from models.schemas import ProductSaveRequest, ProductSaveResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/save")
async def save_product(payload: ProductSaveRequest):
    """TODO: Supabase entegrasyonu tamamlandığında implement edilecek."""
    return {"message": "Supabase entegrasyonu bekleniyor.", "product": payload.product_name}
