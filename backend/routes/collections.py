from fastapi import APIRouter
from models.schemas import CollectionCreate, CollectionResponse

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("")
async def list_collections():
    """TODO: Supabase entegrasyonu tamamlandığında implement edilecek."""
    return {"message": "Supabase entegrasyonu bekleniyor."}


@router.post("")
async def create_collection(payload: CollectionCreate):
    """TODO: Supabase entegrasyonu tamamlandığında implement edilecek."""
    return {"message": "Supabase entegrasyonu bekleniyor.", "name": payload.name}
