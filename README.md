# ZuperBill

**ZuperBill** is a lightweight, mobile-friendly, self-hosted invoicing system built for service professionals like handymen and techs in the field. Easily create invoices, capture signatures, and send receipts—all from your phone or tablet.

---

## ✅ Features (In Progress)
- [x] Add customers
- [x] Create and edit invoices
- [x] View invoice list per customer
- [x] Status tracking (Paid, Unpaid, Overdue)
- [x] Auto-generated invoice numbers
- [x] PDF generation with branding and signature
- [ ] Capture digital signatures
- [ ] Email PDF receipts to customers
- [ ] Mobile-first UX for Android/tablets
- [ ] Service records with time & materials

---

## 🔧 Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Alembic
- **Frontend**: React (with Tailwind CSS), React Router
- **Database**: SQLite
- **PDF Generation**: WeasyPrint
- **Dev Environment**: Docker + Docker Compose

---

## 🚀 Getting Started

To run the system locally:

```bash
docker-compose up --build
```

The frontend will be available at:  
[http://localhost:3000](http://localhost:3000) or your local network IP.

The backend runs at:  
[http://localhost:8000](http://localhost:8000)

---

## 📂 Project Structure

```
zuperbill/
├── backend/       # FastAPI app with DB models and routes
├── frontend/      # React app (runs on port 3000)
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## 🧪 Development Notes

- DB migrations are handled via Alembic.
- The backend uses a `start.sh` script to wait for Postgres, reset migrations (dev only), and launch the server.
- Frontend uses Vite + Tailwind. Configured for mobile-first responsive views.

---

## ✨ Coming Soon

- Signature pad for job completion
- Terms & conditions checkbox
- Emailing invoice PDF via SendGrid/Mailgun
- Multi-user support
