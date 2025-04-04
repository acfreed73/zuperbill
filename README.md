# ZuperBill

**ZuperBill** is a lightweight, mobile-friendly, self-hosted invoicing system built for service professionals like handymen and techs in the field. Easily create invoices, capture signatures, and send receipts—all from your phone or tablet.

---

## ✅ Features
- [x] Add customers
- [x] Create and edit invoices
- [x] View invoice list per customer
- [x] Status tracking (Paid, Unpaid, Overdue)
- [x] Auto-generated invoice numbers
- [x] PDF generation with branding and signature
- [x] Capture digital signatures
- [x] Email PDF receipts to customers
- [x] Mobile-first UX for Android/tablets
- [ ] Service records with time & materials

---

## 🔧 Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Alembic  
- **Frontend**: React (Vite + Tailwind CSS), React Router  
- **Database**: PostgreSQL (via Docker Compose)  
- **PDF Generation**: WeasyPrint  
- **Dev Environment**: Docker + Docker Compose

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/zuperbill.git
cd zuperbill
```

### 2. Create `.env` files from skeletons

```bash
cp frontend/.env_skel frontend/.env
cp backend/.env_skel backend/.env
```

Update `frontend/.env` if your backend is on a different IP:

```env
VITE_API_HOST=192.168.1.187
VITE_API_PORT=8000
```

`backend/.env_skel` includes settings like:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/zuperbill
ENV=development
```

---

### 3. Set up HTTPS (Self-Signed Certs for Dev)

1. Generate or place your certs in:

   ```
   frontend/certs/key.pem
   frontend/certs/cert.pem
   ```

2. Link the same certs into the backend:

   ```bash
   ln -s ../frontend/certs backend/certs
   ```

3. The backend will serve over HTTPS on port 8000. The frontend connects using `https://192.168.1.187:8000` based on the Vite `.env` config.

> ⚠️ You may need to accept a browser warning for the self-signed certificate.

---

### 4. Start the full stack

```bash
docker-compose up --build
```

- **Frontend**: https://192.168.1.187:3000  
- **Backend API**: https://192.168.1.187:8000  
- **Postgres DB**: runs in a separate container at `db:5432`

---

## 📂 Project Structure

```
zuperbill/
├── backend/       # FastAPI app with DB models and routes
├── frontend/      # React app (runs on port 3000)
├── docker-compose.yml
├── README.md
├── .gitignore
```

---

## 🧪 Development Notes

- Database migrations use **Alembic** (`alembic upgrade head`)  
- `backend/start.sh` waits for Postgres, applies migrations, and launches the API over HTTPS.  
- Frontend uses **Vite** for fast HMR with a TailwindCSS layout.  
- Signature and testimonial capture are fully mobile-optimized.

---

## ✨ Coming Soon

- [ ] Terms & conditions acceptance log
- [ ] Service logs with time & materials
- [ ] Multi-user account support
- [ ] Admin dashboard and analytics

