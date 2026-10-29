# Unique Pathology — Full-Stack MERN Diagnostic Centre Platform

Production-oriented MERN website and laboratory administration console for **Unique Pathology**, an independent diagnostic laboratory in **Mandideep, Bhopal, Madhya Pradesh, India**.

Inspired by modern clinical laboratory systems (such as [GD-Lab](https://gd-lab.com/)), this codebase delivers a patient-centric diagnostic booking platform, clinical test and health package catalogue, secure zero-trust patient report portal, doctor/corporate enquiry workflows, and an administrative dashboard.

---

## Table of Contents
1. [Core Features & Architecture](#core-features--architecture)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Quick Start & Local Setup](#quick-start--local-setup)
5. [Demo Data & Credentials](#demo-data--credentials)
6. [API Documentation](#api-documentation)
7. [Security & Regulatory Architecture](#security--regulatory-architecture)
8. [Razorpay Payment Integration](#razorpay-payment-integration)
9. [Zero-Trust Report Storage & Delivery](#zero-trust-report-storage--delivery)
10. [Database Backup & Maintenance](#database-backup--maintenance)
11. [Production Deployment Guide (Vercel + Node/Render)](#production-deployment-guide)
12. [Verification Status: Working vs Pending Credentials](#verification-status)

---

## Core Features & Architecture

### Frontend (React + Vite + Tailwind CSS)
- **Clinical Medical Branding:** Clinical navy (`#073b66`), cyan (`#0891b2`), crisp white, and subtle slate neutrals.
- **Pages & Modules:**
  - **Homepage (`/`):** Emergency strip (Mandideep hours), diagnostic hero search, 4-step workflow, clinical departments, popular routine tests, featured health packages, Mandideep centre spotlight, and partner CTA.
  - **About Us (`/about`):** Diagnostic methodology, hygiene and cold chain handling, and patient trust standards.
  - **Searchable Test Catalogue (`/tests`):** Real-time search, specialty filters, specimen type, fasting requirements, turnaround time (TAT), and verified vs demo price badges.
  - **Health Packages (`/packages`):** Multi-parameter preventive packages (Wellness, Senior Care, Executive Screen) with full test parameter breakdowns.
  - **Appointment & Home Collection Booking (`/book`):** Form with phone/name validation, date & slot picker, Mandideep doorstep address capture, patient consent, and instant Reference ID generation (`UP-YYYYMMDD-XXXX`).
  - **Status Tracker (`/track`):** Look up appointments using Reference ID with a visual progression timeline (`Requested` → `Confirmed` → `Sample Collected` → `Processing` → `Completed`) and cancellation workflow.
  - **Patient Secure Report Portal (`/reports`):** Zero-trust retrieval via 2-step OTP phone verification, single-use short-lived tokens, and private streaming PDF downloads.
  - **Contact & Location (`/contact`):** Mandideep location details, operating hours, general contact enquiry, and doctor/corporate enquiry tabs.
  - **WhatsApp Support:** Phone-guarded click-to-chat that gracefully falls back to an informational notice until the official business number is registered.
  - **Legal & FAQs (`/faqs`, `/privacy`, `/terms`):** Detailed fasting and collection instructions, healthcare data privacy, and diagnostic disclaimers.
  - **Admin Login & Dashboard (`/admin/login`, `/admin`):** Responsive dashboard with metrics, booking management, test CRUD, health package CRUD, report upload to private storage, payment reconciliation, and audit logs.

### Backend (Express + Node.js REST API)
- **Express 4.x** with ES Modules.
- **MongoDB / Mongoose** with indexing, text search, and TTL auto-expiring OTP sessions.
- **Zod Schema Validation** on every incoming payload.
- **Security Middleware:** Helmet headers, CORS allowlist, granular Express rate limiters (API, auth login, OTP generation).
- **Authentication:** Short-lived JWT tokens (2h) with bcrypt (12 rounds) admin authorization.
- **Timing-Safe Cryptography:** Server-side HMAC SHA-256 for Razorpay payments and OTP session verification.
- **Private Object/Disk Storage:** Uploaded reports are stored outside public web folders with UUID keys and checksums.
- **Audit Logging:** System-wide and report-level audit trail logging all downloads and state changes.
- **Automated Test Suite:** Built using Node.js native test runner (`node:test`).

---

## Project Structure

```
unique-pathology-mern/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── storage/
│   │   └── reports/              # Private, non-public report storage
│   │       └── sample-demo-report.pdf
│   ├── src/
│   │   ├── server.js             # Express application & server entrypoint
│   │   ├── config/
│   │   │   └── index.js          # Central environment & business metadata
│   │   ├── middleware/
│   │   │   ├── auth.js           # requireAdmin JWT middleware
│   │   │   ├── rateLimiter.js    # API, Auth, and OTP rate limiters
│   │   │   └── errorHandler.js   # Centralized safe JSON error handler
│   │   ├── models/
│   │   │   ├── Test.js           # Diagnostic test catalogue schema
│   │   │   ├── Package.js        # Health screening packages schema
│   │   │   ├── Booking.js        # Appointment & home collection schema
│   │   │   ├── Payment.js        # Razorpay transaction schema
│   │   │   ├── Report.js         # Secure patient report & audit logs schema
│   │   │   ├── OtpSession.js     # TTL-indexed OTP sessions
│   │   │   ├── Enquiry.js        # Doctor, corporate & general enquiries
│   │   │   └── AuditLog.js       # Regulatory administrative audit trail
│   │   ├── routes/
│   │   │   ├── publicRoutes.js   # Health, public config & departments
│   │   │   ├── testRoutes.js     # Tests & packages search / filter
│   │   │   ├── bookingRoutes.js  # Booking creation, tracking & cancellation
│   │   │   ├── paymentRoutes.js  # Razorpay order, verification & webhook
│   │   │   ├── reportRoutes.js   # Zero-trust OTP & stream download
│   │   │   ├── enquiryRoutes.js  # Doctor & corporate submissions
│   │   │   └── adminRoutes.js    # Metrics, CRUD, uploads & audit logs
│   │   ├── services/
│   │   │   ├── storageService.js # Path-traversal safe private storage
│   │   │   ├── otpService.js     # Timing-safe OTP hashing & verification
│   │   │   ├── paymentService.js # Razorpay order & signature checks
│   │   │   └── auditService.js   # Audit trail recorder
│   │   └── seeds/
│   │       ├── seedData.js       # Clinical demo tests & packages
│   │       └── seed.js           # Database population runner
│   └── test/
│       └── api.test.js           # 12 automated unit & integration tests
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── index.html                # SEO metadata & schema.org structured data
    ├── vite.config.js
    ├── tailwind.config.js
    ├── vercel.json               # SPA routing rewrite for Vercel
    ├── public/
    │   ├── robots.txt
    │   └── sitemap.xml           # Verified XML sitemap for SEO
    └── src/
        ├── main.jsx
        ├── App.jsx               # Routes, navbar, footer & WhatsApp modal
        ├── styles.css            # Medical design utilities & print styles
        ├── api.js                # Central API client
        ├── context/
        │   └── AuthContext.jsx   # Admin authentication provider
        ├── components/
        │   ├── Navbar.jsx        # Navigation & emergency banner
        │   ├── Footer.jsx        # Clinical footer & legal disclaimers
        │   ├── PriceBadge.jsx    # Verified vs demo indicative price badges
        │   └── WhatsAppButton.jsx# Guarded WhatsApp floating action button
        └── pages/
            ├── HomePage.jsx
            ├── AboutPage.jsx
            ├── TestsPage.jsx
            ├── PackagesPage.jsx
            ├── BookingPage.jsx
            ├── TrackPage.jsx
            ├── ReportsPage.jsx
            ├── ContactPage.jsx
            ├── FaqsPage.jsx
            ├── PrivacyPolicyPage.jsx
            ├── TermsPage.jsx
            ├── AdminLoginPage.jsx
            └── AdminDashboardPage.jsx
```

---

## Prerequisites
- **Node.js**: v20.0.0 or higher (v24.x tested)
- **npm**: v10.x or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/unique_pathology`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.

---

## Quick Start & Local Setup

### 1. Backend Setup
```bash
cd backend

# Create environment configuration
cp .env.example .env

# Install dependencies
npm install

# Run automated verification tests
npm test

# Seed diagnostic tests, health packages, demo booking, and demo report
npm run seed

# Start server in development mode
npm run dev
```
The backend API starts on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend

# Create frontend environment configuration
cp .env.example .env

# Install dependencies
npm install

# Build production bundle to verify compilation
npm run build

# Start Vite development server
npm run dev
```
The frontend application starts on `http://localhost:5173`.

---

## Demo Data & Credentials

### Administrative Console (`/admin/login`)
- **Login URL:** `http://localhost:5173/admin/login`
- **Email:** `admin@uniquepathology.example`
- **Password:** `UniqueAdmin@2026`

### Patient Report Download Demonstration (`/reports`)
- **Portal URL:** `http://localhost:5173/reports`
- **Booking Reference ID:** `UP-DEMO-2026`
- **Registered Phone Number:** `9876543210`
- **OTP Verification Code:** Displayed automatically on the screen in sandbox/development mode.
- **Sample File:** Downloads `UniquePathology_CBC_Report_Demo.pdf` securely streamed from private storage.

---

## API Documentation

### Public & Informational Endpoints
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, location, and uptime | Public |
| `GET` | `/api/config/public` | Verified business info, location, and feature toggles | Public |
| `GET` | `/api/departments` | Clinical diagnostic departments listing | Public |
| `GET` | `/api/tests` | Search & filter tests (`?category=...&department=...&search=...`) | Public |
| `GET` | `/api/tests/:id` | Detailed single test information | Public |
| `GET` | `/api/packages` | Preventive health packages catalogue | Public |
| `GET` | `/api/packages/:id` | Detailed health package specifications | Public |
| `POST` | `/api/enquiries` | Submit doctor, corporate, camp, or general enquiry | Public |

### Booking & Appointment Management
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Register appointment (calculates server-side total, returns Reference ID) | Public (Zod validated) |
| `GET` | `/api/bookings/track/:reference` | Safe appointment status tracking (no sensitive data leaks) | Public |
| `POST` | `/api/bookings/:reference/cancel` | Cancel booking (enforces phone verification & status rules) | Patient phone verified |

### Zero-Trust Patient Reports
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reports/request-otp` | Request 6-digit OTP for reference + registered mobile | Rate-limited (8/15m) |
| `POST` | `/api/reports/verify-otp` | Verify OTP; returns single-use 15-minute download token | Rate-limited |
| `GET` | `/api/reports/download/:token` | Stream report file with attachment disposition & audit log | Token authorized |

### Payments (Razorpay Integration)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/create-order` | Create server-side order with database-verified amount | Verified Reference |
| `POST` | `/api/payments/verify-payment` | Server-side HMAC SHA-256 signature verification | Verified Payload |
| `POST` | `/api/payments/webhook` | Idempotent webhook receiver for payment capture events | Webhook signature |

### Administrative Console (Protected via `requireAdmin`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/admin/login` | Authenticate staff admin; returns short-lived JWT token | Rate-limited (10/15m) |
| `GET` | `/api/auth/admin/me` | Verify active admin JWT session | Admin JWT |
| `GET` | `/api/admin/metrics` | Appointments, revenue, reports, and home collection KPIs | Admin JWT |
| `GET` | `/api/admin/bookings` | Searchable bookings table with filters and pagination | Admin JWT |
| `PATCH` | `/api/admin/bookings/:id/status` | Advance status (`requested` → `confirmed` → `completed`) | Admin JWT |
| `PATCH` | `/api/admin/bookings/:id/payment` | Reconcile desk cash / UPI payments | Admin JWT |
| `POST` | `/api/admin/tests` | Add new diagnostic test to catalogue | Admin JWT |
| `PUT` | `/api/admin/tests/:id` | Update test parameters, turnaround, and pricing | Admin JWT |
| `DELETE` | `/api/admin/tests/:id` | Delete test from catalogue | Admin JWT |
| `POST` | `/api/admin/reports/upload` | Upload PDF/image report to private storage & release | Admin JWT (Multer) |
| `GET` | `/api/admin/reports` | List uploaded reports with full access audit logs | Admin JWT |
| `DELETE` | `/api/admin/reports/:id` | Delete report record and disk file | Admin JWT |
| `GET` | `/api/admin/payments` | Reconciliation table of all transactions | Admin JWT |
| `GET` | `/api/admin/enquiries` | Review submitted doctor and corporate enquiries | Admin JWT |
| `GET` | `/api/admin/audit-logs` | Comprehensive regulatory audit trail | Admin JWT |

---

## Security & Regulatory Architecture

1. **Healthcare Data Minimization:** Only patient name, 10-digit mobile, age, gender, and collection address are recorded. Unauthenticated tracker endpoints return sanitized status summaries and never expose addresses.
2. **Path Traversal Prevention:** Private report storage paths are sanitized with `path.basename` and random UUID keys. Direct file access via predictable filenames is prohibited.
3. **Timing-Safe Cryptography:** OTP comparisons and Razorpay HMAC signature validations employ `crypto.timingSafeEqual` to thwart timing side-channel attacks.
4. **Input Sanitization & Schema Safety:** All incoming POST/PUT request bodies are checked using Zod schemas with regex constraints.
5. **Rate Limiting:** Granular rate limits protect public endpoints (250/15m), login endpoints (10/15m), and OTP endpoints (8/15m).
6. **Error Masking:** The centralized error middleware suppresses internal stack traces in production (`NODE_ENV=production`) while logging structured server diagnostics.

---

## Razorpay Payment Integration

The payment flow complies with strict server-authoritative e-commerce guidelines:
1. **Never Trust Client-Side Amounts:** The frontend never submits or dictates payment figures. When `/api/payments/create-order` is called, the backend looks up the booking, totals the verified test prices from MongoDB in paise, and creates the order directly with the Razorpay API.
2. **Guard for Unverified Tariffs:** Orders cannot be created if the booking contains demo or unverified test prices.
3. **Timing-Safe Signature Verification:** The `/api/payments/verify-payment` endpoint recomputes `HMAC-SHA256(order_id + "|" + payment_id, secret)` and validates it against `razorpay_signature` before marking bookings as paid.
4. **Idempotent Webhooks:** The `/api/payments/webhook` handler verifies `x-razorpay-signature` against raw request buffers and reconciles payment status idempotently.

To enable test mode:
1. Register for a free test account at [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Generate API Keys in **Test Mode**.
3. Place `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
4. Place `VITE_RAZORPAY_KEY_ID` in `frontend/.env`.

---

## Zero-Trust Report Storage & Delivery

Unlike basic starters that place uploads in `public/uploads/` (allowing anyone to guess `report-123.pdf`), Unique Pathology uses zero-trust storage:
1. When an administrator uploads a report PDF in the dashboard, the file buffer is written to `backend/storage/reports/<uuid>.pdf` outside public static file serving.
2. A cryptographic SHA-256 hash is computed to verify integrity.
3. When the patient requests access on `/reports`, an OTP is sent to the registered mobile number.
4. Upon OTP validation, the server generates a cryptographically random, 32-byte hexadecimal download token valid for 15 minutes.
5. The patient browser streams the file from `/api/reports/download/:token` with `Content-Disposition: attachment; filename="UniquePathology_UP-XXX.pdf"`.
6. Once downloaded, the token is invalidated, and an audit record (`downloaded`, IP address, user-agent, timestamp) is added to the report document.

---

## Database Backup & Maintenance

### 1. Manual Backup via `mongodump`
```bash
# Backup database to timestamped archive
mongodump --uri="mongodb://127.0.0.1:27017/unique_pathology" --archive=backup_$(date +%Y%m%d).gz --gzip
```

### 2. Manual Restore via `mongorestore`
```bash
# Restore from archive
mongorestore --uri="mongodb://127.0.0.1:27017/unique_pathology" --archive=backup_20261019.gz --gzip --drop
```

### 3. Automated Daily Backup (Cron Example)
```bash
0 2 * * * mongodump --uri="$MONGODB_URI" --archive="/var/backups/unique_pathology_$(date +\%F).gz" --gzip
```

---

## Production Deployment Guide

### Option A: Frontend on Vercel
1. Import the repository into your [Vercel Dashboard](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variables in Vercel:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_live_...` (or test key)
5. Deploy. The included `frontend/vercel.json` ensures all client-side routes (`/tests`, `/book`, `/reports`, `/admin`) resolve to `index.html`.

### Option B: Backend on Render / Railway
1. Create a **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Configure Environment Variables in Render/Railway:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/unique_pathology?retryWrites=true&w=majority`
   - `JWT_SECRET`: A secure 64-character random string.
   - `ADMIN_EMAIL`: `admin@uniquepathology.example`
   - `ADMIN_PASSWORD_HASH`: Custom bcrypt hash generated with 12 rounds.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay credentials.
   - `REPORTS_STORAGE_PATH`: `./storage/reports` (or a mounted persistent disk volume).
6. Run database seed on initial release via Render Shell: `npm run seed`.

---

## Verification Status

| Feature / Component | Status | Notes |
| :--- | :--- | :--- |
| **Backend REST API** | **Verified Working** | All 12 automated unit/integration tests passing cleanly. |
| **Frontend Production Build** | **Verified Working** | `vite build` compiles with zero errors into `/dist`. |
| **Diagnostic Test Search** | **Verified Working** | Live filtering by department, category, and keyword. |
| **Appointment Booking** | **Verified Working** | Validation, Mandideep address capture, server-side prices, and unique `UP-YYYYMMDD-XXXX` reference IDs. |
| **Booking Tracker** | **Verified Working** | Progression timeline, safe public data projection, and cancellation policy. |
| **Secure OTP Report Portal** | **Verified Working** | 2-step phone verification with sandbox OTP in dev, expiring signed download stream. |
| **Admin Console** | **Verified Working** | JWT login, KPIs, booking updates, test/package CRUD, report upload, and audit logs. |
| **Razorpay Payments** | **Architecture Complete** | Verified HMAC SHA-256 signature logic and database-controlled amounts; requires live/test API keys to activate payment modal. |
| **WhatsApp Chat** | **Guarded by Policy** | Displays clear informational modal explaining business registration in progress until `WHATSAPP_NUMBER` is configured. |
| **Lab Contact & Address** | **Clearly Labelled Placeholders** | No fabricated phone numbers, doctors, or fake accreditations; placeholders ready for official lab details. |

---

## Support & Contributions
For questions regarding the Unique Pathology technical implementation, diagnostic data schemas, or deployment, consult the lab software administrator or submit an enquiry through the `/contact` portal.
