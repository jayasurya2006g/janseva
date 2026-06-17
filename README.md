# JanSeva — Municipality Complaint Portal

Full-stack Django + DRF + React application for municipality complaint management.

## Project structure

```
janseva-portal/
├── backend/    Django + DRF API
└── frontend/   React + Vite UI
```

## Quick start

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DB credentials and SECRET_KEY
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # your admin account
python manage.py runserver         # runs on :8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                        # runs on :5173
```

Open http://localhost:5173

## Roles

| Role    | Created by            | Access                                        |
|---------|-----------------------|-----------------------------------------------|
| Admin   | `createsuperuser` CLI | Create officers, assign complaints, full stats |
| Officer | Admin via UI/API      | View assigned complaints, update status        |
| Citizen | Self-register         | Submit, track, withdraw own complaints         |

See backend/README.md and frontend/README.md for full API docs and page reference.
