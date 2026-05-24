from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from uuid import UUID
from core.database import get_supabase
from models.schemas import CollectionCreate, CollectionResponse

router = APIRouter(prefix="/collections", tags=["collections"])


def _require_user(x_user_id: Optional[str]) -> UUID:
    """Header'dan user_id al. Gerçek auth Faz 2'de JWT middleware ile gelecek."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header zorunlu.")
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz X-User-Id formatı.")


@router.get("", response_model=list[CollectionResponse])
async def list_collections(x_user_id: Optional[str] = Header(None)):
    """Kullanıcının tüm koleksiyonlarını döner."""
    user_id = _require_user(x_user_id)
    db = get_supabase()

    res = (
        db.table("collections")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at", desc=False)
        .execute()
    )

    return res.data


@router.post("", response_model=CollectionResponse, status_code=201)
async def create_collection(
    payload: CollectionCreate,
    x_user_id: Optional[str] = Header(None),
):
    """Yeni koleksiyon oluşturur."""
    user_id = _require_user(x_user_id)
    db = get_supabase()

    # Aynı isimde koleksiyon var mı?
    existing = (
        db.table("collections")
        .select("id")
        .eq("user_id", str(user_id))
        .eq("name", payload.name)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Bu isimde bir koleksiyon zaten var.")

    res = (
        db.table("collections")
        .insert({"user_id": str(user_id), "name": payload.name, "is_default": False})
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=500, detail="Koleksiyon oluşturulamadı.")

    return res.data[0]


@router.delete("/{collection_id}", status_code=204)
async def delete_collection(
    collection_id: UUID,
    x_user_id: Optional[str] = Header(None),
):
    """Koleksiyonu siler. Default koleksiyon silinemez."""
    user_id = _require_user(x_user_id)
    db = get_supabase()

    col = (
        db.table("collections")
        .select("id, is_default")
        .eq("id", str(collection_id))
        .eq("user_id", str(user_id))
        .execute()
    )

    if not col.data:
        raise HTTPException(status_code=404, detail="Koleksiyon bulunamadı.")

    if col.data[0]["is_default"]:
        raise HTTPException(status_code=400, detail="Varsayılan koleksiyon silinemez.")

    db.table("collections").delete().eq("id", str(collection_id)).execute()
