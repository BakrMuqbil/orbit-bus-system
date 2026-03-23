# 🚌 Orbit Bus Management System

A modern **fleet management system** built with **React.js** and supporting libraries, designed for tracking operations, maintenance, and driver financial records.  

The UI follows the **"Quiet Luxury"** design philosophy — combining elegance with efficiency.

---

## 🔐 Demo Access

| Field     | Value  |
|----------|--------|
| Username | `orbit` |
| Password | `123`   |

---

## ✨ Core Features

### 🚧 Smart Maintenance Tracking
- Differentiates between **Oil Changes** and **General Repairs**
- Enforces strict validation to eliminate schema mismatches  

### 📊 Professional Dashboard
- Real-time charts and KPIs  
- Deep-navy theme `#0b1437` for clear financial insights  

### 🧩 Dynamic Modal System
- Schema-driven forms  
- Automatically adapts fields based on operation type:
  - Oil
  - Repair
  - Maintenance  

### ⚡ Intelligent Auto-fill
- Automatically fetches:
  - Vehicle meter readings  
  - Bus details  
- Triggered instantly after selecting a driver  

### 📜 Audit Trail & History
- Full chronological transaction ledger  
- Includes:
  - Costs  
  - Meter readings  
  - Dates  

---

## 🛠 Tech Stack

| Layer      | Technology |
|-----------|-----------|
| Frontend  | React.js, React Router, Axios, CSS Modules |
| Backend   | Node.js, Express.js |
| Database  | PostgreSQL (via Neon) |
| Deployment| Vercel + CI/CD |

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/orbit-bus-system.git
cd orbit-bus-system
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Configure environment variables
Create a `.env` file in the root directory and add:

```env
DATABASE_URL=your_postgresql_connection_string
```

### 4️⃣ Run the application
```bash
npm run dev
```

---

## 👨‍💻 Developer

**Bakr Mohammed**  
Full-stack Software Developer  
Specializing in:
- Enterprise Solutions  
- React.js Ecosystems  
- High-end UI/UX Systems  

---

## 📄 License

© 2026 Orbit System — All Rights Reserved.
