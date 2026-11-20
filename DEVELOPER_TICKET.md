# Engineering Specification & Developer Ticket: Nimbus Climate Exposure Ledger

**Ticket ID:** CLIM-101  
**Title:** Standalone Climate Exposure & Transition Risk Ledger (Nimbus Cement Ltd)  
**Priority:** P1 (Executive MVP)  
**Target User:** Meera Iyer (Head of Sustainability) presenting to Board & Auditors  
**Runtime & Deployment:** React 18 / Vite + Tailwind CSS (Static / Edge compatible, zero auth)  

---

## 1. Problem Context & Goal
Nimbus Cement Ltd operates 9 manufacturing plants across India representing ₹15,450 Cr in gross block and 10,932 kt of direct Scope 1 CO₂. Executive leadership, statutory auditors, and lenders need a transparent ledger detailing business exposure today (empirical baseline) versus 2040. 

The application must decouple financial risk into three explicit components (**Heat**, **Water+Coastal**, **CCTS Regulatory**), support clinker supply-chain reallocation, enforce strict single-path reconciliation, and require zero client-side simulation.

---

## 2. Data Contract & Invariance Rules

### 2.1 Fixed Portfolio Assets (`nimbus_cement_plants.csv`)
- **Fleet Capacity:** 23.00 MTPA
- **Fleet Output (FY2025-26):** 18.35 Mt
- **Gross Asset Base:** ₹15,450.0 Cr
- **Revenue (FY2025-26):** ₹9,658.0 Cr
- **Fleet Scope 1 Emissions:** 10,932.0 kt CO₂

### 2.2 Clinker Supply Chain Accounting Rule (Scope 1 Reallocation Only)
In the raw company ledger, clinker manufacturing emissions are recorded at the pyroprocessing mother plant chimneys:
- **P01 (Chittorgarh):** Produces 3.43 Mt clinker, ships 1.12 Mt to **P07 (Mundra GU)**.
  - Clinker specific emission factor: $3,125.0\text{ kt} / 3.43\text{ Mt} = 0.911079\text{ kt/Mt}$.
  - Transferred emissions: $1.12 \times 0.911079 = 1,020.408\text{ kt CO}_2$.
  - Adjusted P01: $2,104.592\text{ kt}$; Adjusted P07: $32.0 + 1,020.408 = 1,052.408\text{ kt}$.
- **P06 (Baloda Bazar):** Produces 3.01 Mt clinker, ships 0.68 Mt to **P08 (Paradip GU)** and 0.60 Mt to **P09 (Durgapur GU)**.
  - Clinker specific emission factor: $2,470.0\text{ kt} / 3.01\text{ Mt} = 0.820598\text{ kt/Mt}$.
  - Transferred to P08: $0.68 \times 0.820598 = 558.007\text{ kt CO}_2$.
  - Transferred to P09: $0.60 \times 0.820598 = 492.359\text{ kt CO}_2$.
  - Adjusted P06: $1,419.635\text{ kt}$; Adjusted P08: $579.007\text{ kt}$; Adjusted P09: $516.359\text{ kt}$.
- **Invariant Assertion (Scope 1 only):** $\sum \text{Adjusted Scope 1} \equiv \sum \text{Direct Scope 1} = \mathbf{10,932.0\text{ kt CO}_2}$. Reallocation moves emissions between plants; it does not change the fleet Scope 1 total.
- **CCTS basis (no invariance claim):** Every CCTS ₹ value in the UI, including the headline, the bars, the KPI cards and the ledger, is computed on **direct (unadjusted) Scope 1**, in both toggle states. CCTS totals are not invariant under clinker adjustment: at notified rates the fleet total is ₹44.74 Cr/yr on direct emissions and ₹56.84 Cr/yr on clinker-adjusted emissions, because the integrated and grinding rates differ (2.7% vs 6.6%). The flat 10% case happens to sum to ₹163.99 Cr/yr either way, which is arithmetic, not a guarantee, and the UI does not show adjusted CCTS.

---

## 3. Calculation Architecture (Single Calculation Path)

All summary figures must equal the exact sum of plant rows: $\text{Fleet Total} = \sum_{i=1}^9 \text{Plant}_i$.

### 3.1 Daily Operational Rates
- $\text{Nominal Operating Days} = 330\text{ days/year}$ (35 days statutory overhaul).
- $\text{Daily Revenue (₹ Cr/day)} = \text{Revenue} / 330$.
- $\text{Daily EBITDA (₹ Cr/day)} = (\text{Cement Output (Mt)} \times 100) / 330$ (assuming ₹1,000/t margin).

### 3.2 Heat Downtime Exposure (Label: "API-based")
- **Baseline ("Today"):** 10-year empirical daily $T_{\max}$ (2015–2024) from Open-Meteo Historical Archive API (ERA5 reanalysis).
- **2040 Horizon:** Delta method applied to ERA5 baseline using CMIP6 multi-model ensemble (`EC_Earth3P_HR` + `MRI_AGCM3_2_S`):
  $$D_{40}(2040) = \max\left(0,\, D_{40,\text{ERA5}} + \left[D_{40,\text{CMIP6}}(2036\text{–}45) - D_{40,\text{CMIP6}}(2015\text{–}24)\right]\right)$$
  $$D_{43}(2040) = \max\left(0,\, \min\left(D_{40}(2040),\, D_{43,\text{ERA5}} + \left[D_{43,\text{CMIP6}}(2036\text{–}45) - D_{43,\text{CMIP6}}(2015\text{–}24)\right]\right)\right)$$
- **Lost Operating Days:**
  $$\text{Moderate Days} = D_{40} - D_{43}$$
  $$\text{Heat Lost Days} = \left[(D_{40} - D_{43}) \times 0.10 + D_{43} \times 0.35\right] \times \text{damping}$$
  *(where $\text{damping} = 1.00$ for integrated kilns, $0.50$ for grinding units).*
- $\text{Heat Exposure (₹ Cr/year)} = \text{Heat Lost Days} \times \text{Daily EBITDA}$.

### 3.3 Water & Coastal Curtailment Exposure (Label: "assumption")
- Read directly from `assumptions.json` (labelled `"judgement, not sourced"`).
- $\text{Water+Coastal Exposure (₹ Cr/year)} = (\text{Water Lost Days} + \text{Coastal Lost Days}) \times \text{Daily EBITDA}$.
- *Caveat:* Open-Meteo Flood API (river discharge m³/s) is contextual background only; does NOT feed money calculation.

### 3.4 CCTS Regulatory Transition Liability (Label: "assumption", "scenario")
- Formula: $\text{Liability (₹ Cr/year)} = (\text{Scope 1 (kt)} \times 1000 \times \text{cut\_pct} \times \text{Carbon Price}) / 10^7$.
- Carbon Price $= \text{₹}1,500 / \text{tCO}_2$ (assumption).
- Baseline (2015–2024): Not computable from CSV (no FY2023-24 baseline available). Upper bound at notified averages (integrated 2.7%, grinding 6.6%) on direct emissions is ₹44.74 Cr/yr. Shown on the "Today" bar as a hatched segment labelled "CCTS today, upper bound at notified rates", and excluded from the ₹46.90 Cr/yr Today total.
- 2040 Horizon: Evaluated as illustrative compliance scenarios side by side: **Notified Rates** (integrated 2.7%, grinding 6.6%) and **Stretch 10% (scenario)** (₹163.99 Cr/yr fleet).
- Regulatory note: No gazetted BEE reduction target runs to 2040.

---

## 4. Frontend Component Specifications

1. **Header:** Title, Meera Iyer persona badge, "Zero Login Public" badge, Gross Asset Base (₹15,450 Cr).
2. **Clinker Toggle:** One segmented control, placed in the ledger table header (not the page toolbar). Track: light surface (`#F4F7F8`) with 1 px border; active segment: navy-to-teal gradient with white text; 40 px height; visible focus ring; each segment is a `<button>` with `aria-pressed`.
   - It changes **only** the Scope 1 (kt) and Intensity (tCO₂/t cement) columns, plus the drawer's Scope 1 bullet and the fleet Scope 1 footer.
   - It must **not** change any ₹ value: heat, water, CCTS, 2040 total, annual Δ, bars, KPI cards, headline and attribution banner are identical in both states.
   - Helper text beside the control states this.
3. **Headline KPI Bar (3-Way Split):**
   - Baseline Card: ₹46.90 Cr/yr (Heat ₹22.11 Cr/yr, Water+Coast ₹24.79 Cr/yr, CCTS ₹0.00 Cr/yr).
   - 2040 Card (10% CCTS): ₹243.70 Cr/yr (Heat ₹27.73 Cr/yr, Water+Coast ₹51.98 Cr/yr, CCTS ₹163.99 Cr/yr).
   - 2040 Card (notified rates, direct emissions): ₹124.45 Cr/yr (Heat ₹27.73 Cr/yr, Water+Coast ₹51.98 Cr/yr, CCTS ₹44.74 Cr/yr).
   - The earlier 3% CCTS card is not displayed. The Today bar carries a hatched "CCTS today, upper bound at notified rates" segment of up to ₹44.74 Cr/yr.
4. **Attribution Banner:** Computed in the UI from the data, not read from a stored sentence.
   - Today has no measured CCTS baseline, so CCTS is attributed as a floor: 2040 stretch ₹163.99 minus today's upper bound ₹44.74 = at least +₹119.25 Cr/yr. Heat (+₹5.62) and water+coastal (+₹27.19) are exact deltas.
   - Display: "at least +₹152.06 Cr/yr", with CCTS ≥78.4%, water ≤17.9%, heat ≤3.7%.
   - At notified rates the CCTS increase is ₹0.00 (same emissions and rates today and in 2040); the banner says so.
   - The earlier "83.3% regulatory" line compared 2040 CCTS against a zero baseline and is removed.
5. **Asset Ledger Table:**
   - Nine rows + Fleet summary footer.
   - Columns: Plant info, Scope 1 (toggle), Intensity (toggle), Heat Today, Heat 2040, Water Today, Water 2040, CCTS Notified (direct), CCTS Stretch 10% (direct), 2040 Total (stretch), Annual $\Delta$ (at least; CCTS today taken at its upper bound).
   - Only Scope 1 and Intensity respond to the clinker toggle.
   - Click to expand row: Climate profiles, water basin details, clinker notes.
6. **Assumptions & Audit Registry View:**
   - A plain "View assumptions" button (`aria-expanded`, `aria-controls`) opens an inline section below the ledger, and a "Hide assumptions" button closes it. No tabs. The section lists all financial, heat, CCTS, and site judgement entries.

---

## 5. Non-Functional & Acceptance Criteria
- **Performance:** Initial page load $< 800\text{ ms}$; bundle size $< 250\text{ kB}$ gzip.
- **Client Processing:** Zero scientific simulation in browser; read statically from `enriched_plants_data.json`.
- **Auth:** Zero authentication, public link.
- **Verification:** All table cells must reconcile with portfolio totals to within 2 decimal places.
- **Toggle assertions:** (1) Scope 1 and Intensity cells differ between states for P01, P06, P07, P08 and P09; (2) every other table cell, footer cell and chart value is byte-identical across states; (3) fleet Scope 1 is 10,932.0 kt in both states; (4) all CCTS values equal the direct-emissions values. `verify_audit.py` asserts (3) and (4) against the data; (1) and (2) were checked in the browser.
