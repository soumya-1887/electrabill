# ElectraBill — Smart Electricity Billing System

**ElectraBill** is a full-stack web application designed for power utility providers and domestic electricity consumers. It calculates progressive electricity bills using tiered marginal slab pricing, manages customer connections and meter accounts, provides real-time analytics, renders professional invoices, and enables one-click PDF downloads and printing.

Built with **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **SQLite (Native `node:sqlite`)**.

---

## ⚡ 1. Progressive Electricity Billing Rules

The billing engine implements the following progressive tariff slabs:

- **First 100 units (1–100 kWh):** ₹2.00 per unit
- **Next 100 units (101–200 kWh):** ₹3.00 per unit
- **Units above 200 (>200 kWh):** ₹5.00 per unit

> **Marginal Calculation:** Each slab is calculated independently. The highest rate is never applied retroactively to all units.

### Mathematical Formula

For total consumption $u$ units:

- If $u \le 100$: $\text{Bill} = u \times 2$
- If $100 < u \le 200$: $\text{Bill} = (100 \times 2) + ((u - 100) \times 3)$
- If $u > 200$: $\text{Bill} = (100 \times 2) + (100 \times 3) + ((u - 200) \times 5)$

### Verified Official Test Cases

All 7 required test cases pass automated unit tests:

| Units Consumed | Slab 1 (₹2) | Slab 2 (₹3) | Slab 3 (₹5) | Expected Total Bill | Test Status |
|---:|:---:|:---:|:---:|:---:|:---:|
| **0** | ₹0 | ₹0 | ₹0 | **₹0** | ✅ Passed |
| **50** | ₹100 | ₹0 | ₹0 | **₹100** | ✅ Passed |
| **100** | ₹200 | ₹0 | ₹0 | **₹200** | ✅ Passed |
| **150** | ₹200 | ₹150 | ₹0 | **₹350** | ✅ Passed |
| **200** | ₹200 | ₹300 | ₹0 | **₹500** | ✅ Passed |
| **250** | ₹200 | ₹300 | ₹250 | **₹750** | ✅ Passed |
| **300** | ₹200 | ₹300 | ₹500 | **₹1,000** | ✅ Passed |

*Server-Side Authoritative Security:* The backend recalculates every bill independently from `units_consumed`. Any fraudulent total bill amount submitted by the frontend is completely discarded.

---

## 🛠️ 2. Technology Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS, Lucide React Icons
- **Interactive UI/UX:** Trailing Electric Cursor Follower, Scroll Progress Bar, Glassmorphism, Confetti on Bill Generation
- **Data Visualizations:** Recharts (Area charts for consumption trends, Slab revenue breakdown)
- **PDF & Invoice Generation:** `jspdf` & `jspdf-autotable`
- **Backend:** Node.js, Express.js REST API
- **Database:** SQLite using Node's high-performance native `node:sqlite` (`DatabaseSync`), enforcing foreign keys and WAL mode
- **Test Suite:** Built-in `node:test` and `node:assert` (23 unit & API tests)

---

## 📁 3. Project Directory Structure

```text
ui/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/         # Navbar, CursorGlow, ScrollProgress, BillModal, CustomerModal, etc.
│   │   ├── pages/              # Dashboard, GenerateBill, Customers, BillingHistory, TariffCalculator
│   │   ├── services/           # api.js REST API client
│   │   ├── utils/              # billing.js, formatters.js, pdfGenerator.js
│   │   ├── App.jsx             # Main Application root
│   │   ├── main.jsx            # React DOM entrypoint
│   │   └── index.css           # Tailwind CSS directives, print styles, custom scrollbar
│   ├── index.html              # HTML shell
│   ├── vite.config.js          # Vite config with API proxy
│   ├── tailwind.config.js      # Custom theme colors & glow shadows
│   └── package.json
├── server/                     # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── database/           # db.js (SQLite setup) & seed.js
│   │   ├── services/           # billingService.js (Authoritative calculation engine)
│   │   ├── controllers/        # billController, customerController, dashboardController
│   │   ├── routes/             # billRoutes, customerRoutes, dashboardRoutes
│   │   ├── middleware/         # Centralized errorHandler.js
│   │   ├── app.js              # Express app definition & static build serving
│   │   └── server.js           # Express HTTP server listener
│   ├── tests/
│   │   ├── billing.test.js     # Progressive billing engine tests (all 7 required cases)
│   │   └── api.test.js         # REST API controller & database tests
│   ├── data/
│   │   └── electrabill.db      # SQLite database file
│   └── package.json
├── .env.example                # Sample environment variables
├── .gitignore
├── package.json                # Workspace scripts
└── README.md                   # Complete documentation
```

---

## 🚀 4. Getting Started

### Prerequisites

- **Node.js**: v20 or higher (v24 recommended; uses native `node:sqlite`)
- **npm**: v9 or higher

### Installation

From the project root:

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install
cd ..
```

---

## 🏃 5. Running the Application

### Option A: Run Full Stack with One Command (Production Build)

1. Build the React frontend:
   ```bash
   cd client && npm run build && cd ..
   ```
2. Start the Express server:
   ```bash
   cd server && npm start
   ```
3. Open your browser at:
   👉 **http://localhost:5000**

---

### Option B: Run in Development Mode (Hot Reloading)

Start both services in two separate terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend with Vite HMR):**
```bash
cd client
npm run dev
# Running on http://localhost:3000 (proxies /api to localhost:5000)
```

Open **http://localhost:3000** in your browser.

---

## 🧪 6. Running Automated Tests

Run the complete automated test suite (all 23 tests, covering the 7 mandatory tariff cases, decimal units, boundary conditions, input validation, and API controllers):

```bash
# From root
npm test

# Or directly from server directory
cd server
npm test
```

Expected output:
```text
✔ 1. Required Mandatory Test Cases (0, 50, 100, 150, 200, 250, 300 units)
✔ 2. Detailed Slab Breakdown Verifications
✔ 3. Boundary and Decimal Units
✔ 4. Input Validation and Error Handling
✔ 5. Currency Formatting Helper
✔ ElectraBill — API Controller & Database Tests
ℹ tests 23
ℹ suites 7
ℹ pass 23
ℹ fail 0
```

---

## 🗄️ 7. Database & Seeding

The SQLite database (`server/data/electrabill.db`) initializes automatically when the server starts.

- **Zero Dummy Numbers:** The application starts with real database statistics. If the database is empty, the dashboard accurately displays 0 metrics and a welcoming empty state.
- **Optional Seeding:** To populate realistic consumers (Ramesh Sharma, Priya Patel, Vikram Singh, etc.) and sample bills for testing:
  ```bash
  cd server
  npm run seed
  ```
  Or click **"Load Sample Test Customers"** directly from the UI.

---

## 📡 8. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and SQLite connectivity |
| `GET` | `/api/dashboard/stats` | Aggregated metrics, recent bills, and slab distribution |
| `GET` | `/api/customers` | List consumers (supports `search`, `page`, `limit`) |
| `POST` | `/api/customers` | Register a new consumer (`full_name`, `meter_number`, etc.) |
| `GET` | `/api/customers/:id` | Get customer profile and complete billing history |
| `PUT` | `/api/customers/:id` | Update customer details |
| `DELETE` | `/api/customers/:id` | Delete customer (safely prevents deletion if bills exist unless `?force=true`) |
| `POST` | `/api/bills/calculate` | Instant calculation preview without database persistence |
| `POST` | `/api/bills` | Calculate authoritative bill and save to SQLite |
| `GET` | `/api/bills` | List bills with search, date filters, sorting, and pagination |
| `GET` | `/api/bills/:id` | Retrieve bill details with itemized slab breakdown |
| `DELETE` | `/api/bills/:id` | Delete an invoice record |

---

## ✨ 9. Features & UI Highlights

- ⚡ **Electric Aesthetic:** Clean light slate background, dark navy typography, vibrant cyan/teal glow accents, and responsive layout.
- 🎯 **Interactive Cursor Follower:** Smooth electric cyan aura trailing user cursor movements with hover expansion.
- 📊 **Top Scroll Progress Indicator:** Glowing cyan-to-blue scroll bar reflecting page position.
- 🖨️ **Professional Invoice Layout:** Itemized progressive slabs table, printable with clean `@media print` CSS.
- 📄 **One-Click PDF Download:** High-resolution PDF generated using `jspdf` and `jspdf-autotable`.
- 🔍 **Interactive Tariff Rule Tester:** Dedicated tab where users can click any of the 7 official test cases or adjust a slider to verify the formula in real time.
