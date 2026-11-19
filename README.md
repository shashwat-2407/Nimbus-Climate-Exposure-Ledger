# Nimbus ClimateIQ: Climate & Transition Risk Intelligence Ledger

> Standalone executive decision prototype built for **Meera Iyer, Head of Sustainability at Nimbus Cement Ltd**, evaluating the physical and regulatory climate exposure of 9 cement manufacturing plants (₹15,450 Cr gross block) today vs 2040.

[![Live Link](https://img.shields.io/badge/Live%20Prototype-Vercel-emerald)](https://oren-virid.vercel.app)
[![Zero Login](https://img.shields.io/badge/Auth-Zero%20Login-blue)](#)
[![Reconciliation](https://img.shields.io/badge/Audit-Reconciled%20to%20Zero%20Delta-success)](#)

---

## 1. Executive Summary & Problem Solved
Nimbus Cement Ltd operates 9 manufacturing plants across India representing:
- **₹15,450 Cr** gross asset base
- **23.00 MTPA** cement capacity / **18.35 Mt** FY26 cement output
- **10,932.0 kt** direct Scope 1 CO₂ emissions
- **₹9,658.0 Cr** FY26 annual revenue

Meera faces three distinct stakeholder demands:
1. **Board of Directors:** Financial Value at Risk (lost kiln operating days, lost EBITDA).
2. **Auditors (SEBI BRSR Core):** Auditability, traceable formulas, labelled assumptions, and no black-box numbers.
3. **Investors & Banks:** Asset impairment vulnerability and regulatory compliance fines under India's Carbon Credit Trading Scheme (BEE CCTS).

This application bridges internal facility data (`nimbus_cement_plants.csv`) with external climate science (ERA5 reanalysis + CMIP6 HighResMIP models) to produce a boardroom-ready risk ledger.

---

## 2. Core Methodology & Deliverables

### A. Three-Way Exposure Decoupling
Every exposure figure is explicitly broken down into three constituent drivers:
1. **Heat Downtime (`API-based`):** Empirical ERA5 reanalysis (2015–2024) + CMIP6 delta method for 2040.
2. **Water & Coastal Curtailment (`assumption`):** Site-specific basin constraints (labelled `"judgement, not sourced"`).
3. **CCTS Regulatory Liability (`assumption`):** Plant-specific intensity targets evaluated side-by-side at **3% cut** and **10% cut** at ₹1,500/tCO₂ (labelled `"illustrative"`).

### B. Clinker Supply-Chain Accounting (Total Invariance Guarantee)
- **P01 (Chittorgarh)** ships 1.12 Mt clinker to **P07 (Mundra GU)**.
- **P06 (Baloda Bazar)** ships 0.68 Mt to **P08 (Paradip GU)** and 0.60 Mt to **P09 (Durgapur GU)**.
- The UI provides an instant toggle between **"Direct Chimney Emissions"** and **"Clinker-Adjusted"**.
- **Mathematical proof of invariance:** Fleet Scope 1 emissions remain strictly invariant at **10,932.0 kt CO₂**, and fleet CCTS liability remains identical at **₹49.19 Cr/yr** (3% cut) and **₹163.99 Cr/yr** (10% cut).

### C. Bias-Aware Climate Modeling
Raw CMIP6 models exhibited an extreme inland warm bias (over-predicting $T_{\max} \ge 43^\circ\text{C}$ by 300%+). The prototype applies the **classical delta method**:
$$D_{40}(2040) = D_{40,\text{ERA5}}(2015\text{–}24) + \left[D_{40,\text{CMIP6}}(2036\text{–}45) - D_{40,\text{CMIP6}}(2015\text{–}24)\right]$$
No plant exceeds 25 days/year with $T_{\max} \ge 43^\circ\text{C}$ under this bias-corrected baseline; therefore, acute-heat flags are dropped.

---

## 3. Key Deliverables Files
- **Live Vercel Prototype:** Opens publicly with zero login at [https://oren-virid.vercel.app](https://oren-virid.vercel.app) (also runnable locally via `npm run preview`).
- **Developer Ticket:** [`DEVELOPER_TICKET.md`](./DEVELOPER_TICKET.md) — 1-page complete engineering specification.
- **Process Note:** [`PROCESS_NOTE.md`](./PROCESS_NOTE.md) — 1-page process, research, assumptions, cuts, and the required section on **Where AI was wrong and how I caught it**.
- **Assumptions Registry:** [`assumptions.json`](./assumptions.json) — Full audit log of parameters and site judgement entries.
- **Enriched Dataset:** [`enriched_plants_data.json`](./enriched_plants_data.json) — Audited, deterministic JSON payload consumed by the frontend.

---

## 4. Local Development & Build
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production (Vite)
npm run build

# Preview production build locally
npm run preview
```
Production build compiles in ~1.4s with zero external runtime dependencies.
