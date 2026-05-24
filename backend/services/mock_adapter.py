import uuid
import random
from models.schemas import ProductSearchResult

# Gerçekçi mock ürün havuzu
MOCK_PRODUCTS = [
    {
        "product_name": "Classic White Sneaker",
        "price": 89.99,
        "currency": "USD",
        "store_name": "Nike",
        "store_url": "https://nike.com/product/classic-white-sneaker",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        "category": "Footwear",
    },
    {
        "product_name": "Slim Fit Chino Pants",
        "price": 49.95,
        "currency": "USD",
        "store_name": "Zara",
        "store_url": "https://zara.com/product/slim-chino",
        "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400",
        "category": "Bottoms",
    },
    {
        "product_name": "Linen Summer Shirt",
        "price": 34.99,
        "currency": "USD",
        "store_name": "H&M",
        "store_url": "https://hm.com/product/linen-shirt",
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400",
        "category": "Tops",
    },
    {
        "product_name": "Leather Crossbody Bag",
        "price": 129.00,
        "currency": "USD",
        "store_name": "Mango",
        "store_url": "https://mango.com/product/crossbody-bag",
        "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
        "category": "Accessories",
    },
    {
        "product_name": "Oversized Knit Sweater",
        "price": 59.99,
        "currency": "USD",
        "store_name": "Pull&Bear",
        "store_url": "https://pullandbear.com/product/knit-sweater",
        "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
        "category": "Tops",
    },
    {
        "product_name": "Minimalist Watch",
        "price": 199.00,
        "currency": "USD",
        "store_name": "MVMT",
        "store_url": "https://mvmt.com/product/minimalist-watch",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        "category": "Accessories",
    },
    {
        "product_name": "High-Waist Mom Jeans",
        "price": 44.95,
        "currency": "USD",
        "store_name": "Bershka",
        "store_url": "https://bershka.com/product/mom-jeans",
        "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400",
        "category": "Bottoms",
    },
    {
        "product_name": "Canvas Tote Bag",
        "price": 24.99,
        "currency": "USD",
        "store_name": "Uniqlo",
        "store_url": "https://uniqlo.com/product/canvas-tote",
        "image_url": "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400",
        "category": "Accessories",
    },
]


def get_mock_results(image_base64: str, count: int = 6) -> list[ProductSearchResult]:
    """
    Gerçek API'yi simüle eder.
    image_base64 parametresi şimdilik kullanılmıyor;
    gerçek adapter'da API'ye gönderilecek.
    """
    sample = random.sample(MOCK_PRODUCTS, min(count, len(MOCK_PRODUCTS)))

    results = []
    for i, product in enumerate(sample):
        # İlk sonuç her zaman en yüksek benzerlik skoruna sahip
        similarity = round(random.uniform(0.75, 0.99) if i == 0 else random.uniform(0.40, 0.80), 2)

        results.append(ProductSearchResult(
            product_id=str(uuid.uuid4()),
            source_api="mock",
            similarity_score=similarity,
            **product,
        ))

    # Benzerlik skoruna göre sırala (yüksekten düşüğe)
    results.sort(key=lambda r: r.similarity_score, reverse=True)
    return results
