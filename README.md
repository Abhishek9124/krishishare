# 🌾 Krishishare — FPO-Backed Contract Farming Marketplace

Krishishare is a full-stack web application for contract farming & yield settlements: **FPOs list crop projects ➔ Urban investors fund them ➔ FPOs submit harvest revenue & proof ➔ Third-party auditors verify sales ➔ Yield payouts disburse pro-rata to investors.**

---

## ⚡ How to Run Locally

### Prerequisites
- **Node.js**: v18 or higher (`node -v`)
- **NPM**: v9 or higher

---

### 1️⃣ Install Dependencies

Run this single command at the project root (`krishishare/`):

```bash
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..
```

---

### 2️⃣ Start Backend & Frontend Local Servers

Open **two terminal windows** in your project directory:

#### **Terminal 1: Start Backend API (Port 4000)**
```bash
npm run dev:backend
```
> Express API listening on `http://localhost:4000`

#### **Terminal 2: Start Frontend UI (Port 5173)**
```bash
npm run dev:frontend
```
> Vite Development Server ready at `http://localhost:5173`

Open your browser and navigate to: **[http://localhost:5173](http://localhost:5173)**

---

### 🔑 1-Click Instant Demo Login Credentials

On the Login page (`http://localhost:5173/login`), click any of the **1-Click Instant Demo Access** buttons:

| Role | Email | Password | Dashboard Features |
|---|---|---|---|
| 🛡️ **Platform Admin / Auditor** | `admin@krishishare.com` | `admin123` | Inspect harvest sale proofs, confirm yield values, approve payouts at `/admin` |
| 🌾 **FPO Producer** | `fpo_demo@krishishare.com` | `password123` | List crop projects, view crop health telemetry, submit harvest sales for audit |
| 💰 **Urban Investor** | `investor_demo@krishishare.com` | `password123` | Auto-receives ₹5,00,000 demo wallet balance, fund projects, track portfolio |

---

## 🛠️ Key Project Features

1. **🛰️ Parametric Satellite & Weather Monitoring**:
   - Real-time multispectral scan engine (`/api/projects/:id/telemetry`).
   - Crop Health Index (0–100), NDVI vegetation scores, canopy temperature, rainfall, soil moisture, historical scan logs, and **Parametric Insurance Shield Alerts**.
   - Interactive **"⚡ Simulate Satellite Pass"** button to perturb satellite metrics live.

2. **🛡️ Third-Party Auditor & Admin Portal (`/admin`)**:
   - Platform oversight dashboard for independent auditors.
   - Mandi receipt proof inspection, yield value confirmation, platform fee calculation, and **Approve & Execute Investor Payouts** trigger.

3. **🌱 FPO Contract Farming Management (`/my-projects`)**:
   - Crop listing creation and harvest sales proposal submission.

4. **💳 Investor Wallet & Portfolio (`/wallet` & `/my-investments`)**:
   - Pro-rata yield payout calculation and complete debit/credit transaction ledgers.

---

## 🛠️ Build for Production

To create a production static build:

```bash
npm run build
```
*(Compiles the frontend bundle into `frontend/dist/` with 0 errors).*
