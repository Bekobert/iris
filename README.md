# Iris

> Görsel ürün arama ve koleksiyon yönetimi platformu.

## Monorepo Yapısı

```
iris/
├── backend/      # Python / FastAPI — API, iş mantığı, DB
├── extension/    # Chrome Extension — Manifest V3, Vanilla JS
├── dashboard/    # Web arayüzü — React
└── mobile/       # Mobil uygulama — React Native (Faz 3)
```

## Geliştirme Durumu

| Paket | Durum |
|---|---|
| backend | 🟡 İskelet hazır, Supabase entegrasyonu bekliyor |
| extension | 🔴 Henüz başlanmadı |
| dashboard | 🔴 Henüz başlanmadı |
| mobile | 🔴 Planlanıyor (Faz 3) |

## Hızlı Başlangıç

### Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload
```

API dokümantasyonu: http://localhost:8000/docs

## Teknoloji Stack

- **Backend:** Python, FastAPI, Pydantic, Supabase, Stripe
- **Extension:** Manifest V3, Vanilla JS
- **Dashboard:** React
- **Mobile:** React Native
- **Görsel Arama:** Google Cloud Vision (MVP sonrası netleşecek)
- **DB / Auth:** Supabase
- **Ödeme:** Stripe
