# Product Process Note: Building Nimbus Climate Exposure Ledger

**Author:** Shashwat Sengupta (Acting Product Manager)  
**Customer Persona:** Meera Iyer, Head of Sustainability, Nimbus Cement Ltd  
**Context:** Board Briefing, Statutory Audit Review, Lender Due Diligence  

---

## 1. Problem Shaping & Research
Meera was trapped between two disconnected silos: an internal 9-plant operational CSV with financial figures in ₹ Crores, and external scientific climate platforms (Open-Meteo, CMIP6, IPCC) that speak in raw physical units (RCP/SSP scenarios, mm rain, °C anomalies) without knowing plant replacement values.

### What Was Researched:
1. **Cement Pyroprocessing & Clinker Chemistry:** Cement kilns calcine limestone at ~1450°C, generating ~60% of emissions as process emissions ($CaCO_3 \rightarrow CaO + CO_2$) and ~40% as thermal combustion. Grinding units (GUs) have no kilns; they simply grind clinker with gypsum and fly ash using electrical power.
2. **India CCTS Trajectory (Bureau of Energy Efficiency):** Unlike the European ETS (which mandates absolute allowances), India’s Carbon Credit Trading Scheme establishes **plant-specific Greenhouse Gas Emission Intensity (GEI) baselines** with mandated percentage reduction targets over compliance cycles.
3. **Physical Hazards in the Indian Context:** Two physical hazards force kiln deratings: **extreme heat ($>40^\circ\text{C}$)** halting outdoor captive limestone quarrying and stressing kiln cooling jackets, and **water scarcity** constraining cooling towers in overdrawn river/groundwater basins.

---

## 2. Key Assumptions & Labelled Provenance

To ensure rigorous auditability and avoid "made-up numbers", every assumption is documented in [`assumptions.json`](./assumptions.json):
- **Nominal Operating Days:** 330 days/year (35 days statutory shutdown/refractory relining). *Source status: Industry benchmark assumption.*
- **EBITDA Margin:** ₹1,000 / tonne cement (~19% margin on ₹5,263/t realization, median of UltraTech, Shree, and Ambuja over FY23–FY25). *Source status: Assumption.*
- **Carbon Price:** ₹1,500 / tCO₂ (~$18.00/t). *Source status: Assumption pending exchange price discovery.*
- **CCTS Regulatory Trajectory:** Today baseline is not computable from CSV (no FY2023-24 baseline available). Upper bound at notified averages is ₹44.73 Cr/yr (direct) or ₹56.84 Cr/yr (clinker-adjusted). 2040 horizon is evaluated at **notified rates** (integrated 2.7%, grinding 6.6%) and **stretch 10% (scenario)** (₹163.99 Cr/yr fleet). Explicitly noted that no gazetted target runs to 2040.
- **Water & Coastal Curtailment:** Site-specific basin downtime days (1.5 to 16.0 days/year). *Source status: "judgement, not sourced" (no unverified claims cited).*
- **Flood Discharge Data:** Open-Meteo Flood API river discharge (m³/s) is reported as hydrological context only and explicitly does NOT feed the financial loss formula.

---

## 3. Deliberate Scope Cuts for V1 (What We Left Out & Why)

1. **Cut: Heavy GIS Satellite Maps:**
   - *Why:* Meera’s Board presentation is 20 minutes long. Directors need an actionable risk ledger ranked by financial exposure, not interactive Google Earth weather layers that take 10 seconds to load.
2. **Cut: User Authentication & Login Walls:**
   - *Why:* Designed for frictionless board circulation and rapid executive evaluation without authentication friction.
3. **Cut: Scope 3 Downstream Delivery Road Transport:**
   - *Why:* Tracking thousands of third-party dealer trucks introduces high data uncertainty and blurs kiln asset-level accountability. V1 strictly evaluates the 9 factory fencelines and internal rail transfers.
4. **Cut: Client-Side NetCDF / Raw Scientific Processing:**
   - *Why:* Processing gigabytes of climate model grids in the browser causes memory crashes and slow load times. We pre-computed the bias-aware delta calculations into a lightweight, audited JSON payload (`enriched_plants_data.json`).

---

## 4. How AI Was Used & Where AI Was Wrong

AI tools (large language models and terminal scripting) were used for CMIP6 API querying, data schema design, and rapid UI scaffolding. However, product judgment and domain rigor remained entirely human-driven.

### Where AI Was Wrong & How I Caught It:

#### 1. The Clinker Accounting Trap (Emissions Allocation)
- **The AI Error:** AI initially treated grinding units P07 (Mundra), P08 (Paradip), and P09 (Durgapur) as "98% green" (Scope 1 $< 35\text{ kt}$) and penalized mother kilns P01 (Chittorgarh, 3,125 kt) and P06 (Baloda Bazar, 2,470 kt) with crushing CCTS liabilities (>₹46 Cr/yr).
- **How I Caught It:** I cross-referenced the `clinker_shipped` and `notes` columns in `nimbus_cement_plants.csv`. P01 was shipping 1.12 Mt clinker to P07; P06 was shipping 1.28 Mt to P08/P09. Grinding units burn no fuel—their low chimney emissions are an accounting artifact.
- **The Correction:** I engineered a clinker mass-balance reallocation formula ($E_{\text{transferred}} = \text{Mt}_{\text{shipped}} \times [E_{\text{clinker}} / \text{Mt}_{\text{produced}}]$) and built a boardroom toggle: **"Direct Chimney Emissions"** vs **"Clinker-Adjusted"**, while mathematically proving that fleet total Scope 1 (10,932.0 kt) and fleet CCTS liability remain strictly invariant.

#### 2. The Uncorrected Climate Model Bias (Acute Heat Hallucination)
- **The AI Error:** AI initially pulled raw CMIP6 model grid outputs and flagged P02 Satna (26.8 d/yr) and P03 Chandrapur (37.5 d/yr) as having acute extreme heat ($>25\text{ days/year} \ge 43^\circ\text{C}$).
- **How I Caught It:** I queried the Open-Meteo Historical Archive API (ERA5 reanalysis) for the empirical 2015–2024 baseline. The historical reanalysis revealed that Satna actually experiences only 7.0 days/year $\ge 43^\circ\text{C}$ (not 26.8). The raw CMIP6 model suffered from a pronounced inland warm bias.
- **The Correction:** I replaced the raw model baseline with the **ERA5-based reanalysis (2015–2024)** and computed 2040 projections using the classical **delta method** ($D_{40,\text{2040}} = D_{40,\text{ERA5}} + \Delta D_{40,\text{CMIP6}}$). Under this bias-aware methodology, no plant exceeds 25 days $\ge 43^\circ\text{C}$ (peak is Chandrapur at 19.3 d/yr in 2040). The acute-heat flags were dropped.

#### 3. Unlabelled "Single Headline" Exposure Blending
- **The AI Error:** AI initially summed physical asset damages and regulatory compliance fines into a single blended "Value at Risk" figure without declaring that CCTS compliance was a regulatory policy assumption while heat was an API climate projection.
- **How I Caught It:** Financial auditors require explicit traceability of physical damages versus regulatory penalties.
- **The Correction:** Decoupled exposure across the entire product into a strict **three-way split**: **Heat (`API-based`)**, **Water+Coastal (`assumption`)**, and **CCTS (`assumption`)**, clearly reporting that **under the stated assumptions, 83.3% of the projected exposure increase is regulatory**.
