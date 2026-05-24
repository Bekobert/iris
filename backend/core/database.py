from supabase import create_client, Client
from core.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    """
    Supabase client singleton.
    Service key kullanır — sadece backend'den çağrılır, asla extension'a expose edilmez.
    """
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL ve SUPABASE_SERVICE_KEY .env dosyasında tanımlı olmalı."
            )
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client
