# CLIM-101: Nimbus Climate Exposure Ledger, v1

**For:** an engineer building v1 for real. **User:** Meera Iyer, Head of Sustainability, Nimbus Cement (9 plants), who must tell her board what climate events could cost the company today and by 2040. **Prototype:** this repo, data baked in. `verify_audit.py` holds the golden numbers.

## 1. What you build
A hosted ledger that gives the same answer as the prototype, but from a tested calculation and a **scheduled** data refresh. It is not a live-data product: weather data is fetched by an offline job, saved as a dated snapshot, and the page reads the snapshot. That keeps every number reproducible for an auditor. The only external data source in v1 is Open-Meteo. NGFS, BEE and other sources are out of v1 because they need decisions from Meera first (§6).

- **Step A, ship first.** (1) One tested calculation module. (2) An offline job that refreshes weather data. The page looks the same and §4 still matches.
- **Step B.** (3) Validated plant upload. (4) Editable, versioned assumptions with an edit log.
- **Step C, after sign-off.** (5) WRI Aqueduct 4.0 scores replace the judgement water days. Do not start until product agrees how a score maps to lost days.

**Out of scope:** asset damage (flood, cyclone), Scope 3, maps, login, multi-company, live API calls from the browser.

## 2. Rules that must not break
- Heat, Water and coastal, and CCTS are never summed into one unlabelled number. Each is labelled API-based, assumption, or scenario. Units are ₹ Cr per year.
- Every total is the sum of plant rows.
- The clinker toggle changes only the Scope 1 and intensity columns. All ₹ values use direct emissions.
- CCTS today is not computable (no FY2023-24 baseline), so it stays outside the Today total.

## 3. Calculations
Formulas are in `src/App.tsx`; `build_data.py` builds the JSON the page reads. The script that fetched the weather caches (`open_meteo_*_cache.json`) is not in the repo; you write it in A2.
- **Daily EBITDA** (₹ Cr/day) = output (Mt) × 100 / 330, from ₹1,000/t margin and 330 operating days.
- **Heat data**, daily `temperature_2m_max` per plant: ERA5 from `archive-api.open-meteo.com/v1/archive`, 2015 to 2024. CMIP6 from `climate-api.open-meteo.com/v1/climate`, `models=EC_Earth3P_HR,MRI_AGCM3_2_S`, for 2015 to 2024 and 2036 to 2045. D40 and D43 = average days a year at ≥ 40 and ≥ 43 °C; average the two models.
- **2040 days** = ERA5 baseline + (CMIP6 2036 to 2045 − CMIP6 2015 to 2024), floored at 0, D43 ≤ D40.
- **Heat ₹** = [(D40 − D43) × 0.10 + D43 × 0.35] × damping (1.0 kiln, 0.5 grinding unit) × daily EBITDA.
- **Water and coastal ₹** = (water days + coastal days) × daily EBITDA. Days are judgement, in `build_data.py`.
- **CCTS ₹** = direct Scope 1 (kt) × 1000 × cut % × ₹1,500 / 10⁷, with current intensity as the baseline. Cases: illustrative 2.7% integrated and 6.6% grinding, and 10% stretch. No abatement or growth.
- **Clinker reallocation:** a kiln's Scope 1 per Mt clinker produced × clinker shipped moves to the receiving unit. The CSV holds destinations only as text in `notes`: P01 to P07 (1.12 Mt), P06 to P08 (0.68 Mt) and P09 (0.60 Mt). Add a `clinker_destination` column.

## 4. Acceptance: golden values (₹ Cr/yr)
- Heat 22.11 today, 27.73 in 2040. Water and coastal 24.79 today, 51.98 in 2040. Today total 46.90.
- CCTS: illustrative 44.74, stretch 163.99. 2040 totals 124.45 (illustrative) and 243.70 (stretch). Today's CCTS shows as a hatched bound of at most 44.74.
- Increase vs today: heat +5.62, water +27.19, CCTS at least +119.25, total at least +152.06.
- Fleet Scope 1 is 10,932.0 kt in both toggle states; every ₹ value is identical in both.
- Ledger sorts by any column (default 2040 total, descending), first column sticky. No horizontal page scroll at 1280×900.

## 5. Data contract and edge cases
- Plant CSV as in `nimbus_cement_plants.csv`. Reject a file if `scope1` is non-numeric, shipped clinker exceeds produced, a grinding unit has produced clinker, or fleet totals do not tie to the rows.
- Heat deltas use one 10-year window and two models, so they are noisy; P06 falls by 2040, treat as noise. ERA5 is reanalysis, not station data.
- Open-Meteo's free tier is non-commercial and rate-limited: check the licence, add retry and caching. The UI shows a "data as of" date from the latest snapshot.

## 6. Open questions, with the default to ship meanwhile
1. **CCTS rates (Meera).** 2.7% / 6.6% is unverified; ICAP reports a notified range of 4.7 to 7.6%, set per plant. *Default:* keep, labelled illustrative. Needs the Gazette rules and Nimbus's FY2023-24 baselines.
2. Headline includes CCTS? *Default:* yes, as a labelled scenario outside the Today total.
3. ₹1,500/tCO₂, or an NGFS or exchange price path? *Default:* ₹1,500, editable in step B.
4. Asset damage for coastal Paradip and Mundra in v1.1? *Default:* out of scope.
5. Who signs off the Aqueduct score to lost-days mapping? *Default:* keep judgement days.
