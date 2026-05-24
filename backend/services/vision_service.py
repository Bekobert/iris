from core.config import settings
from models.schemas import ProductSearchResult
from services.mock_adapter import get_mock_results


def search_by_image(image_base64: str, count: int = 6) -> list[ProductSearchResult]:
    """
    Aktif API provider'a göre doğru adapter'ı çağırır.
    Extension ve routes katmanı bu fonksiyonu çağırır;
    hangi API'nin kullanıldığını bilmek zorunda değildir.
    """
    provider = settings.VISION_API_PROVIDER

    if provider == "mock":
        return get_mock_results(image_base64, count)

    elif provider == "google_vision":
        # TODO: Google Cloud Vision adapter
        from services.google_vision_adapter import get_google_vision_results
        return get_google_vision_results(image_base64, count)

    elif provider == "serpapi":
        # TODO: SerpApi adapter
        from services.serpapi_adapter import get_serpapi_results
        return get_serpapi_results(image_base64, count)

    elif provider == "rekognition":
        # TODO: Amazon Rekognition adapter
        from services.rekognition_adapter import get_rekognition_results
        return get_rekognition_results(image_base64, count)

    else:
        raise ValueError(f"Bilinmeyen API provider: {provider}")
