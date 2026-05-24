# Iris

> Visual product search and collection management platform.

## Structure

```
iris/
├── backend/      # Python / FastAPI — API, BL, DB
├── extension/    # Chrome Extension — Manifest V3, Vanilla JS
├── dashboard/    # Web Interface — React
└── mobile/       # Mobile App — React Native (Phase 3)
```

## Development Status

| Package | Status |
|---|---|
| backend | 🟡 Structure is ready, Waiting for Supabase integration |
| extension | 🔴 Not Started |
| dashboard | 🔴 Not Started |
| mobile | 🔴 Planning (Phase 3) |

## QuickStart

### Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload
```

API Docs: http://localhost:8000/docs

## Tech Stack

- **Backend:** Python, FastAPI, Pydantic, Supabase, Stripe
- **Extension:** Manifest V3, Vanilla JS
- **Dashboard:** React
- **Mobile:** React Native
- **Visual Search:** Google Cloud Vision
- **DB / Auth:** Supabase
- **Payment:** Stripe
