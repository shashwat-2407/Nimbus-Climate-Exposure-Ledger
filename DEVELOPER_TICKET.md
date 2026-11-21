# CLIM-101: Nimbus Climate Exposure Ledger, v1

**For:** an engineer building v1 for real. **User:** Meera Iyer, Head of Sustainability, Nimbus Cement (9 plants), presenting to her board. **Prototype:** this repo; `verify_audit.py` holds the golden numbers.

**Start here:** the prototype works with baked-in data. Your job is to (1) move the maths into a tested module, (2) automate the data refresh, (3) add a validated plant upload, (4) make assumptions editable, (5) swap guessed water days for Aqueduct. Plain-language version: README, "For the developer".

## 1. Goal
Answer one question: *what is our business exposure to climate events today and by 2040?* Three parts, never summed into one unlabelled number: **Heat** (data-based), **Water & coastal** (assumption), **CCTS carbon cost** (scenario). Every figure states its unit (₹ Cr per year) and its provenance.

## 2. In scope for v1
Everything the prototype shows today.
**Out of scope:** asset damage and impairment (flood, cyclone), Scope 3, GIS maps, login, multi-company, live API calls from the browser.

## 3. Build order
1. **Calculation module with tests.** Port the formulas in §4 into a pure function. Tests assert the golden values in §6.
2. **Data pipeline (offline job).** Fetch ERA5 (2015–24) and CMIP6 (2036–45) from Open-Meteo, store versioned snapshots with the retrieval date. The UI shows "data as of".
3. **Plant upload.** Replace the bundled CSV with a validated upload (schema in §5).
4. **Editable assumptions.** Move days, margin, carbon price, rates and water days into versioned config. Each edit is logged.
5. **Replace water judgement** with WRI Aqueduct 4.0 scores (offline spatial join).

## 4. Calculations (single path: every total is the sum of plant rows)
- Daily EBITDA (₹ Cr/day) = output (Mt) × 100 / 330. Assumes ₹1,000/t margin and 330 operating days.
- Heat days: D40/D43 = days with Tmax ≥ 40/43 °C. 2040 value = ERA5 baseline + [CMIP6(2036–45) − CMIP6(2015–24)], mean of EC_Earth3P_HR and MRI_AGCM3_2_S, floored at 0, D43 ≤ D40.
- Heat lost days = [(D40−D43)×0.10 + D43×0.35] × damping (1.0 kiln, 0.5 grinding unit). Heat ₹ = lost days × daily EBITDA.
- Water & coastal ₹ = (water days + coastal days) × daily EBITDA. Days are judgement per plant.
- CCTS ₹ = Scope 1 (kt) × 1000 × cut % × ₹1,500 / 10⁷, **on direct (unadjusted) Scope 1**. Cases: illustrative 2.7% integrated / 6.6% grinding, and 10% stretch. No abatement, no growth.
- Clinker reallocation: transferred kt = clinker shipped (Mt) × (mother plant Scope 1 / clinker produced). Used only for the Scope 1 and intensity columns.

## 5. Data contract
Plant CSV columns as in `nimbus_cement_plants.csv`. Reject files where `scope1` is non-numeric, shipped clinker exceeds produced, or a grinding unit has produced clinker. Fleet totals must tie out to the rows.

## 6. Acceptance criteria (golden values)
- Heat today ₹22.11, 2040 ₹27.73 Cr/yr. Water today ₹24.79, 2040 ₹51.98. Today total ₹46.90 (excludes CCTS).
- CCTS direct: illustrative ₹44.74, stretch ₹163.99. 2040 totals ₹124.45 (illustrative) and ₹243.70 (stretch).
- Today's CCTS is **not computable** (no FY2023-24 baseline). Show ≤ ₹44.74 as a hatched bound, outside the Today total.
- Attribution: heat +5.62, water +27.19, CCTS at least +119.25, total at least +₹152.06 Cr/yr. At illustrative rates the CCTS increase is 0.
- **Clinker toggle** (control in the ledger header; 40 px; `aria-pressed`; visible focus): changes only Scope 1 and intensity. Every ₹ value is identical in both states. Fleet Scope 1 is 10,932.0 kt in both.
- Ledger sortable by any column (default 2040 total, descending); first column sticky; footer unaffected by sort.
- "View assumptions" opens an inline section, not tabs or a modal. 1280×900 renders without horizontal page scroll.

## 7. Edge cases
- Grinding units have near-zero direct Scope 1, so direct CCTS is about ₹0.3 Cr each.
- Heat deltas use one 10-year window and two models, so they are noisy. P06 falls by 2040; treat it as noise, not signal.
- ERA5 is reanalysis, not station data; CMIP6 is one scenario.
- Open-Meteo free tier is non-commercial and rate-limited. Check the licence before production.

## 8. Open questions (owner: product unless stated)
1. **CCTS rates.** The 2.7% / 6.6% split is unverified. ICAP reports the notified cement range as 4.7–7.6% for FY2025-26 to FY2026-27, per plant, against FY2023-24. Needs the Gazette rules and Nimbus's own baselines (Meera).
2. Should the headline include CCTS at all while today's value is unknown?
3. Is ₹1,500/tCO₂ acceptable, or should it follow an NGFS or exchange price path?
4. Will the board want asset damage (flood, cyclone) in v1.1? Paradip and Mundra are coastal.
5. Replace judgement water days with Aqueduct scores: who signs off the mapping from score to lost days?
