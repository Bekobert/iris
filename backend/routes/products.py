from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from uuid import UUID
from core.database import get_supabase
from models.schemas import ProductSaveRequest, ProductSaveResponse

router = APIRouter(prefix="/products", tags=["products"])

FREE_TIER_LIMIT = 20


def _require_user(x_user_id: Optional[str]) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header zorunlu.")
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz X-User-Id formatı.")


def _get_or_create_default_collection(db, user_id: UUID) -> UUID:
    """Kullanıcının default koleksiyonunu döner, yoksa oluşturur."""
    res = (
        db.table("collections")
        .select("id")
        .eq("user_id", str(user_id))
        .eq("is_default", True)
        .execute()
    )
    if res.data:
        return UUID(res.data[0]["id"])

    # Yoksa oluştur
    new = (
        db.table("collections")
        .insert({"user_id": str(user_id), "name": "Koleksiyonum", "is_default": True})
        .execute()
    )
    return UUID(new.data[0]["id"])


@router.post("/save", response_model=ProductSaveResponse, status_code=201)
async def save_product(
    payload: ProductSaveRequest,
    x_user_id: Optional[str] = Header(None),
):
    """
    Ürünü koleksiyona kaydeder.
    Free tier'da 20 ürün sınırı uygulanır.
    """
    user_id = _require_user(x_user_id)
    db = get_supabase()

    # Kullanıcı tier kontrolü
    user_res = db.table("users").select("tier").eq("id", str(user_id)).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user_tier = user_res.data[0]["tier"]

    if user_tier == "free":
        count_res = (
            db.table("saved_products")
            .select("id", count="exact")
            .eq("user_id", str(user_id))
            .execute()
        )
        saved_count = count_res.count or 0
        if saved_count >= FREE_TIER_LIMIT:
            raise HTTPException(
                status_code=402,
                detail=f"Free planda en fazla {FREE_TIER_LIMIT} ürün kaydedebilirsiniz. Pro'ya geçin.",
            )

    # Hedef koleksiyonu belirle
    if payload.collection_id:
        # Koleksiyon bu kullanıcıya ait mi?
        col_check = (
            db.table("collections")
            .select("id")
            .eq("id", str(payload.collection_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        if not col_check.data:
            raise HTTPException(status_code=404, detail="Koleksiyon bulunamadı.")
        collection_id = payload.collection_id
    else:
        collection_id = _get_or_create_default_collection(db, user_id)

    # Ürünü kaydet
    insert_data = {
        "user_id": str(user_id),
        "collection_id": str(collection_id),
        "product_name": payload.product_name,
        "price": payload.price,
        "currency": payload.currency,
        "store_name": payload.store_name,
        "store_url": payload.store_url,
        "image_url": payload.image_url,
        "similarity_score": payload.similarity_score,
        "category": payload.category,
        "source_api": payload.source_api,
    }

    res = db.table("saved_products").insert(insert_data).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Ürün kaydedilemedi.")

    return ProductSaveResponse(
        saved_product_id=UUID(res.data[0]["id"]),
        collection_id=collection_id,
    )


@router.get("", tags=["products"])
async def list_saved_products(
    collection_id: Optional[UUID] = None,
    x_user_id: Optional[str] = Header(None),
):
    """Kullanıcının kayıtlı ürünlerini döner. Opsiyonel olarak koleksiyona göre filtreler."""
    user_id = _require_user(x_user_id)
    db = get_supabase()

    query = (
        db.table("saved_products")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
    )

    if collection_id:
        query = query.eq("collection_id", str(collection_id))

    res = query.execute()
    return {"products": res.data, "total": len(res.data)}


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    x_user_id: Optional[str] = Header(None),
):
    """Kaydedilmiş ürünü siler."""
    user_id = _require_user(x_user_id)
    db = get_supabase()

    check = (
        db.table("saved_products")
        .select("id")
        .eq("id", str(product_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı.")

    db.table("saved_products").delete().eq("id", str(product_id)).execute()
