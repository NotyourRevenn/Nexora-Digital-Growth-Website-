# ⚡ Nexora Digital — Full-Stack Performance Agency Platform & CRM

> **Where Brands Meet Growth.** Premium, high-converting digital performance agency website inspired by the modern aesthetic of Xolio, now powered by a **full-fledged backend server, SQLite database, and Agency CRM Admin Portal**.

---

## 🌟 Architecture & Features

### 1. 🌐 Public Agency Web Application
- **Dynamic Hero Section**: Interactive constellation particle canvas with mouse repulsion, magnetic cursor glow, and seamless text-cycling headline.
- **360° Synchronized Orbit Hub**: Rotating celestial orbit featuring 8 growth channels (*Meta Ads, Google Ads, LinkedIn B2B, Shopify Plus, TikTok Viral, WhatsApp API, Viral Studio, SEO*).
- **Interactive ROI & Revenue Simulator**: Ad spend slider, multi-industry pipeline forecasts, and real-time calculation engine.
- **Dual-Theme Support**: Instant switching between Cyber-Dark (`#080811`, `#00f2fe`) and Light modes.
- **Direct Async Lead Capture**: Consultation form, Proposal modal, and Newsletter form sync directly to the database via REST API.

### 2. 🔐 Agency CRM & Admin Control Portal (`/admin`)
- **Secure Authentication**: PBKDF2 HMAC SHA-256 hashed passwords and session management.
- **Live KPI Dashboard**: Real-time counters for Total Inquiries, Fresh Leads, Pipeline Deals, Closed/Won Partners, and Win Rate.
- **Interactive Leads CRM**:
  - Filter by Status: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST`.
  - Filter by Growth Channel: Meta Ads, Google Ads, Viral Video, LinkedIn, Full-Funnel.
  - Live Search: Instant filtering across client names, phone numbers, and notes.
  - One-Click WhatsApp Action: Instant WhatsApp chat launcher with pre-filled consultation response.
  - Inline Status Changer & Delete actions.
  - Lead Profile Modal & Internal CRM follow-up notes editor.
- **CSV Data Export**: One-click full leads export into Excel/Sheets (`/api/leads/export`).
- **Newsletter Subscribers Manager**: View, filter, and manage subscriber list.
- **Security Settings**: Change admin password and manage local SQLite storage.

---

## 🚀 How to Run Locally

### Option 1: 1-Click Startup (Windows)
Double-click `run_server.bat` in the project root:
```
D:\Websites\nexora-xolio-creative\run_server.bat
```

### Option 2: Command Line
Open PowerShell or Terminal in the project directory:
```powershell
python server.py
```

### Access URLs:
* 🌐 **Public Website**: [http://localhost:5000/](http://localhost:5000/)
* 🔐 **Admin CRM Portal**: [http://localhost:5000/admin](http://localhost:5000/admin)
* 👤 **Default Admin Credentials**:
  * **Username**: `admin`
  * **Password**: `nexora2026!`

*(You can change the admin password at any time inside the Portal Settings tab.)*

---

## 📁 Project Directory Structure

```
D:\Websites\nexora-xolio-creative\
  ├── index.html                  # Public agency landing page
  ├── server.py                   # Python 3.13 Multi-Threaded HTTP REST Server
  ├── nexora.db                   # SQLite Database (Auto-created on first run)
  ├── run_server.bat              # 1-Click Windows server launcher
  ├── package.json                # Node/Express manifest (optional alternative)
  ├── server.js                   # Express.js runtime (optional alternative)
  │
  ├── admin/                      # Nexora Agency Admin Portal
  │    ├── index.html             # CRM Dashboard & Leads Pipeline
  │    ├── login.html             # Glassmorphic Admin Authentication screen
  │    ├── admin.css              # Cyber-Dark & Neon styling
  │    └── admin.js               # Reactive CRM logic, filtering, and WhatsApp actions
  │
  └── assets/
       ├── css/
       │    ├── style.css         # Xolio design system styles
       │    └── responsive.css    # Mobile breakpoints
       ├── js/
       │    └── main.js           # Interactive client engine + API dispatchers
       └── img/                   # Brand assets and preview graphics
```

---

## 📡 REST API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leads` | Public | Captures consultation form & proposal requests |
| `POST` | `/api/newsletter` | Public | Subscribes email to growth insights |
| `POST` | `/api/auth/login` | Public | Admin authentication |
| `POST` | `/api/auth/logout` | Protected | Invalidate session |
| `GET` | `/api/auth/me` | Protected | Check active admin session |
| `POST` | `/api/auth/change-password` | Protected | Update admin credentials |
| `GET` | `/api/stats` | Protected | Real-time KPI analytics & funnel metrics |
| `GET` | `/api/leads` | Protected | Search, filter, and retrieve leads |
| `PATCH`| `/api/leads/<id>` | Protected | Update lead status & internal CRM notes |
| `DELETE`| `/api/leads/<id>` | Protected | Delete lead record |
| `GET` | `/api/leads/export` | Protected | Download all leads as `.csv` |
| `GET` | `/api/newsletter` | Protected | View all newsletter subscribers |
| `DELETE`| `/api/newsletter/<id>` | Protected | Remove newsletter subscriber |

---

## 📞 Agency Contact

- **Agency**: Nexora Digital Growth
- **WhatsApp / Direct**: [+91 7478368773](https://wa.me/917478368773)
- **Tagline**: Where Brands Meet Growth

© 2026 Nexora Digital. All Rights Reserved.
