# 🌾 Krishishare — Contract Farming & Yield Settlement Marketplace

**Krishishare** connects Farmer Producer Organizations (FPOs) directly with urban investors. Investors fund crop farming projects upfront, FPOs manage the crops with satellite weather protection, and when the harvest is sold, independent third-party auditors verify the sales before profits are automatically distributed back to investors.

---

## 🌟 What is Krishishare? (In Simple Words)

Imagine crowdfunding for farming:
1. 🌾 **Farmers (FPOs)** need money for seeds, fertilizers, and technology to grow high-yield crops.
2. 💰 **Investors** fund these crop projects in exchange for a share of the harvest profits.
3. 🛰️ **Satellite Telemetry** tracks crop health, soil moisture, and weather conditions in real-time.
4. 🛡️ **Third-Party Auditors** check mandi sales receipts to ensure fair profit reporting.
5. 💳 **Automatic Payouts** send profits directly back to investors' wallets once approved.

---

## 🧭 Page Navigation Guide

| Page Name | Icon / Path | Who Uses It | What You Can Do |
| :--- | :--- | :--- | :--- |
| **Projects Marketplace** | 🌾 `/` | Everyone | Browse live crop projects, see funding progress, crop health, expected returns, and duration. |
| **Project Details** | 📄 `/projects/:id` | Everyone | Inspect crop descriptions, satellite NDVI indices, weather insurance alerts, and invest money. |
| **My Investments** | 💰 `/my-investments` | Investor | Track your funded projects, expected returns, active positions, and received profit payouts. |
| **List a Project** | ➕ `/create-project` | FPO | Create and publish new crop farming funding campaigns. |
| **My Projects** | 🚜 `/my-projects` | FPO | Monitor your listed crops, view satellite scans, and submit harvest mandi sales proof for audit. |
| **Admin & Auditor Portal** | 🛡️ `/admin` | Admin / Auditor | Verify FPO sales receipts, confirm yield values, approve investor payouts, and oversee platform stats. |
| **Virtual Wallet** | 💳 `/wallet` | Everyone | View your available balance, add demo funds, and track complete transaction history. |

> ⚡ **Tip**: You can switch roles instantly anytime using the **Switch Bar** (`Admin` | `FPO` | `Investor`) in the top navigation bar!

---

## ⚡ How to Run This Project Locally

### Prerequisites
- **Node.js**: Version 18 or higher ([Download Node.js](https://nodejs.org/))
- **Terminal / PowerShell**: Built-in Windows PowerShell or Command Prompt

---

### Step 1: Install Dependencies

Open your terminal in the root folder (`krishishare`) and run:

```powershell
npm install
```

*(This automatically installs dependencies for both backend and frontend).*

---

### Step 2: Start Local Servers

Run backend and frontend servers together using **two terminal windows**:

#### **Terminal 1: Start Backend Server (Port 4000)**
```powershell
npm run dev:backend
```
> API will run locally on: `http://localhost:4000`

#### **Terminal 2: Start Frontend Application (Port 5173)**
```powershell
npm run dev:frontend
```
> Web App will launch on: `http://localhost:5173`

Open your web browser and go to: **[http://localhost:5173](http://localhost:5173)**

---

### 🔑 1-Click Instant Demo Login Accounts

Click any 1-click login button on the Login page or use the top navigation bar switcher:

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| 🛡️ **Platform Admin / Auditor** | `admin@krishishare.com` | `admin123` | Audit harvest sales, verify receipts, approve investor payouts at `/admin` |
| 🌾 **FPO Producer** | `fpo_demo@krishishare.com` | `password123` | Create crop projects, view crop health, submit harvest sales for settlement |
| 💰 **Urban Investor** | `investor_demo@krishishare.com` | `password123` | Comes pre-loaded with ₹5,00,000 demo wallet balance to fund projects |

---

## 🛠️ Key Technology Features

- **🛰️ Satellite Telemetry & Weather Shield**: Real-time multispectral scan simulation showing Crop Health Index (0-100), NDVI scores, rainfall, soil moisture, and parametric weather risk warnings.
- **🛡️ Third-Party Settlement Audit**: Multi-step audit pipeline where FPOs upload mandi sales proof and independent auditors approve or adjust payouts.
- **💳 Zero-Config In-Memory Engine**: Works out-of-the-box locally and on Vercel without requiring complex database setup.
