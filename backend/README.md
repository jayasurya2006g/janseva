# Municipality Complaint Portal — Backend

Django + Django REST Framework backend for a municipality complaint management system.

---

## Roles

| Role    | How created              | What they can do                                      |
|---------|--------------------------|-------------------------------------------------------|
| Admin   | `createsuperuser` command | Create/manage officers, assign complaints, view stats |
| Officer | Created by admin via API  | View assigned complaints, update status, add remarks  |
| Citizen | Self-register via API     | Submit complaints, track status, withdraw             |

---

## Setup

### 1. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secret key
```

### 4. Create PostgreSQL database
```sql
CREATE DATABASE municipality_db;
```

### 5. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create admin (superuser)
```bash
python manage.py createsuperuser
```

### 7. Run the server
```bash
python manage.py runserver
```

---

## API Endpoints

### Auth (open)
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | /api/users/register/      | Citizen self-registration |
| POST   | /api/users/login/         | Login (returns JWT tokens)|
| POST   | /api/token/refresh/       | Refresh access token     |

### Citizen (JWT required)
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/users/profile/               | View own profile               |
| PATCH  | /api/users/update_profile/        | Update username/phone          |
| POST   | /api/users/logout/                | Logout (blacklists token)      |
| POST   | /api/complaints/                  | Submit complaint (with image)  |
| GET    | /api/complaints/                  | List own complaints            |
| GET    | /api/complaints/{id}/track/       | Full complaint + status history|
| POST   | /api/complaints/{id}/withdraw/    | Withdraw a pending complaint   |

### Officer (JWT + role=officer required)
| Method | Endpoint                             | Description              |
|--------|--------------------------------------|--------------------------|
| GET    | /api/complaints/                     | List assigned complaints |
| PATCH  | /api/complaints/{id}/update-status/  | Update status + remark   |

### Admin (JWT + is_staff required)
| Method | Endpoint                           | Description                    |
|--------|------------------------------------|--------------------------------|
| POST   | /api/admin/create-officer/         | Create officer account         |
| GET    | /api/admin/officers/               | List all officers              |
| PATCH  | /api/admin/{id}/deactivate/        | Deactivate an officer          |
| PATCH  | /api/admin/{id}/activate/          | Reactivate an officer          |
| PATCH  | /api/admin/{id}/reset-password/    | Reset officer password         |
| PATCH  | /api/complaints/{id}/assign/       | Assign complaint to officer    |
| GET    | /api/complaints/stats/             | Dashboard stats                |

---

## File Upload

Complaints support:
- **Image**: JPEG, PNG, WebP — max 5 MB
- **Document**: PDF only — max 10 MB

Send as `multipart/form-data`. Returned URLs are absolute (e.g. `http://localhost:8000/media/complaints/images/photo.jpg`).

---

## Status Flow

```
pending → active (when admin assigns to officer)
active  → resolved / rejected  (officer updates)
pending → closed  (citizen withdraws)
```

Every status change is logged in `StatusLog` and returned in the `/track/` endpoint.

---

## Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── apps/
    ├── users/
    │   ├── models.py        # Custom User model (citizen/officer roles)
    │   ├── serializers.py   # UserSerializer, OfficerCreateSerializer
    │   ├── views.py         # UserViewSet, AdminViewSet
    │   ├── permissions.py   # IsOfficer, IsAdminUser, IsCitizen
    │   └── urls.py
    └── complaints/
        ├── models.py        # Complaint, StatusLog
        ├── serializers.py   # ComplaintSerializer with file validation
        ├── views.py         # ComplaintViewSet with all actions
        └── urls.py
```
