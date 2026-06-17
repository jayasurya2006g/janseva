# JanSeva — Municipality Complaint Portal (Frontend)

React + Vite frontend for the municipality complaint management system.

---

## Design

- **Font**: Playfair Display (headings) + Inter (body)
- **Palette**: Navy `#0D1B2A`, Cream `#F5F0E8`, Gold `#B8860B`, Red `#C0392B`
- **Feel**: Civic authority — not a startup template

---

## Pages

| Route            | Who sees it        | What it does                              |
|------------------|--------------------|-------------------------------------------|
| `/`              | Everyone           | Landing page with animated carousel       |
| `/login`         | Everyone           | JWT login — redirects by role             |
| `/register`      | Citizens           | Self-registration                         |
| `/home`          | All logged-in      | Dashboard with carousel + quick actions   |
| `/submit`        | Citizens           | Submit complaint with photo/PDF upload    |
| `/my-complaints` | Citizens           | Filter, view, withdraw own complaints     |
| `/track/:id`     | All logged-in      | Full complaint + status timeline          |
| `/officer`       | Officers           | Assigned complaints + update status modal |
| `/admin`         | Admin (is_staff)   | All complaints + officer management       |

---

## Setup

```bash
# Install dependencies
npm install

# Run dev server (backend must be running on :8000)
npm run dev
```

Open http://localhost:5173

---

## Role-based routing

Login returns `role` and `is_admin` in the response. The app routes automatically:
- `is_admin: true` → `/admin`
- `role: officer`  → `/officer`
- `role: citizen`  → `/home`

React Router guards (`PrivateRoute`) block access to wrong-role pages.

---

## File structure

```
src/
├── api/
│   └── axios.js          # Axios instance with JWT + auto-refresh interceptor
├── context/
│   └── AuthContext.jsx   # Auth state, login, logout
├── components/
│   └── Navbar.jsx        # Role-aware navigation bar
├── pages/
│   ├── LandingPage.jsx   # Hero + features (no auth required)
│   ├── LoginPage.jsx     # Split-panel login
│   ├── RegisterPage.jsx  # Split-panel registration
│   ├── HomePage.jsx      # Dashboard with carousel
│   ├── SubmitPage.jsx    # Complaint form + file upload
│   ├── MyComplaints.jsx  # Citizen complaint list
│   ├── TrackPage.jsx     # Status timeline
│   ├── OfficerPage.jsx   # Officer dashboard + update modal
│   └── AdminPage.jsx     # Admin panel — complaints + officers
├── index.css             # Global styles, tokens, pill badges
├── App.jsx               # Routes
└── main.jsx              # Entry point
```

---

## API connection

All requests go to `http://localhost:8000/api` (configured in `src/api/axios.js`).

The Axios interceptor:
1. Attaches `Authorization: Bearer <access>` to every request
2. On 401, auto-refreshes the access token using the refresh token
3. On refresh failure, clears storage and redirects to `/login`
