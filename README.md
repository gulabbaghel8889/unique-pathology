# Unique Pathology (Mandideep, Bhopal, MP) — MERN Platform Starter

Complete, production-oriented MERN website for **Unique Pathology**, a diagnostic centre in Mandideep, Bhopal, Madhya Pradesh, India. Reference: [GD-Lab](https://gd-lab.com/).

The full application source code is located in the [`unique-pathology-mern`](./unique-pathology-mern/) directory:

- **Backend:** [`unique-pathology-mern/backend`](./unique-pathology-mern/backend/) (Node.js, Express, MongoDB/Mongoose, JWT, Razorpay, Multer, Helmet, Rate Limiter)
- **Frontend:** [`unique-pathology-mern/frontend`](./unique-pathology-mern/frontend/) (React, Vite, Tailwind CSS, Lucide Icons, React Router v6)
- **Complete Documentation & Setup Guide:** [`unique-pathology-mern/README.md`](./unique-pathology-mern/README.md)

## Quick Start

### 1. Start Backend:
```bash
cd unique-pathology-mern/backend
cp .env.example .env
npm install
npm test
npm run seed
npm run dev
```

### 2. Start Frontend:
```bash
cd unique-pathology-mern/frontend
cp .env.example .env
npm install
npm run build
npm run dev
```

### 3. Demo Credentials:
- **Admin Portal:** `http://localhost:5173/admin/login` (`admin@uniquepathology.example` / `UniqueAdmin@2026`)
- **Demo Patient Report Lookup:** `http://localhost:5173/reports` (Reference: `UP-DEMO-2026`, Phone: `9876543210`)
