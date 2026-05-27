from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str
    tier: str = "free"


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: AuthRequest):
    """Yeni kullanıcı kaydı. Supabase Auth'a kayıt olur, users tablosuna tier ekler."""
    try:
        res = _client().auth.sign_up({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not res.session:
        raise HTTPException(
            status_code=400,
            detail="Kayıt tamamlandı, e-posta doğrulaması gerekiyor."
        )

    user_id = res.user.id

    # users tablosuna ekle (upsert — zaten varsa ignore)
    from core.database import get_supabase
    db = get_supabase()
    db.table("users").upsert({"id": user_id, "tier": "free"}).execute()

    return AuthResponse(
        access_token=res.session.access_token,
        refresh_token=res.session.refresh_token,
        user_id=user_id,
        email=res.user.email,
        tier="free",
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthRequest):
    """Email + şifre ile giriş."""
    try:
        res = _client().auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı.")

    if not res.session:
        raise HTTPException(status_code=401, detail="Giriş başarısız.")

    user_id = res.user.id

    # Tier bilgisini çek
    from core.database import get_supabase
    db = get_supabase()
    user_res = db.table("users").select("tier").eq("id", user_id).execute()
    tier = user_res.data[0]["tier"] if user_res.data else "free"

    return AuthResponse(
        access_token=res.session.access_token,
        refresh_token=res.session.refresh_token,
        user_id=user_id,
        email=res.user.email,
        tier=tier,
    )


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Access token süresi dolduğunda refresh token ile yeniler."""
    try:
        res = _client().auth.refresh_session(refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Refresh token geçersiz.")

    if not res.session:
        raise HTTPException(status_code=401, detail="Token yenilenemedi.")

    return {
        "access_token": res.session.access_token,
        "refresh_token": res.session.refresh_token,
    }
