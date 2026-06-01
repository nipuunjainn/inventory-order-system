<div align="center">
  <h1>📦 Inventory & Order Management System</h1>
  <p><strong>A full-stack, scalable web application for managing products, customers, orders, and real-time inventory.</strong></p>
  
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
</div>

---

## 🚀 Live Demo & Docker Images

### Live Application
- **Frontend (Web App):** [https://inventory-order-system-one.vercel.app](https://inventory-order-system-one.vercel.app)
- **Backend (API Docs):** [https://inventory-order-system-iudo.onrender.com/docs](https://inventory-order-system-iudo.onrender.com/docs)

> **Note:** The backend is hosted on a free Render tier, so it may take ~30 seconds to wake up from inactivity on your first visit!

### Docker Hub Repositories
- **Backend Image:** [`nipunjainn/inventory-backend`](https://hub.docker.com/r/nipunjainn/inventory-backend)
- **Frontend Image:** [`nipunjainn/inventory-frontend`](https://hub.docker.com/r/nipunjainn/inventory-frontend)

---

## ✨ Features

- **🔐 Role-Based Access Control:** Secure JWT authentication with `Standard` and `Administrator` roles.
- **📦 Product Management:** Create, update, and delete products with unique SKU enforcement.
- **👥 Customer Management:** Manage customer profiles with unique email validation.
- **🛒 Order Fulfillment:** Multi-item order creation with atomic stock validation.
- **⚡ Real-Time Inventory:** Automatic stock reduction upon order placement, and automatic restoration on cancellation.
- **🚫 Stock Protection:** Orders are automatically blocked (HTTP 422) when stock is insufficient.
- **🌙 Modern UI:** Sleek, responsive, dark-themed dashboard built with React.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router, Axios, Vanilla CSS (Dark UI) |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic, PassLib |
| **Database** | PostgreSQL (Neon.tech Serverless) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 💻 Local Development Setup

If you want to run this project on your own machine, follow these steps:

### 1. Database Setup
Create a local `.env` file in the `backend/` directory and configure your PostgreSQL connection:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
SECRET_KEY=your_super_secret_key
ALLOWED_ORIGINS=http://localhost:3000
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Your local application will now be running at `http://localhost:3000`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Auth Required? | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ❌ | Create a new user account |
| POST | `/api/v1/auth/login` | ❌ | Authenticate and retrieve JWT |
| GET | `/api/v1/products` | ✅ | List all available products |
| POST | `/api/v1/orders` | ✅ | Create a new order (validates stock) |
| PUT | `/api/v1/inventory/{id}/restock` | ✅ | Add stock to an existing product |

*(For full interactive API documentation, visit the `/docs` route on the running backend).*
