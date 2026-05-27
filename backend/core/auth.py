from fastapi import HTTPException, Header
from typing import Optional
from uuid import UUID
from supabase import create_client
from core.config import settings


def _get_anon_client():
    """Anon key ile Supabase client — JWT doğrulama için."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def require_user(authorization: Optional[str] = Header(None)) -> UUID:
    """
    FastAPI dependency — Authorization: Bearer <jwt> header'ından
    kullanıcı ID'sini çıkarır. Geçersiz veya eksik token'da 401 döner.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header eksik veya geçersiz.")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        client = _get_anon_client()
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
        return UUID(response.user.id)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token doğrulanamadı.")
