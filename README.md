# Nimbus Climate Exposure Ledger

A static executive dashboard showing what climate events cost Nimbus Cement Ltd, today and by 2040, across its 9 plants. Built for the Head of Sustainability to present to a board, statutory auditors and lenders.

![Top of the page: headline question and the Today vs 2040 bars](docs/screenshots/screenshot_top_of_page.png)

## What it shows

Exposure is always split into three parts and never summed into one unlabelled number.

| Component | Label | Source |
| :--- | :--- | :--- |
| Extreme heat downtime | `API-based` | ERA5 reanalysis 2015–2024, plus a CMIP6 delta method for 2040 |
| Water and coastal curtailment | `Assumption` | Site-level judgement, labelled "judgement, not sourced" |
| CCTS carbon liability | `Assumption, scenario` | Emissions × % cut × ₹1,500/tCO₂ |

Fleet facts: 9 plants, ₹15,450 Cr gross asset base, 23.00 MTPA capacity, 18.35 Mt output, 10,932 kt direct Scope 1 CO₂.

### Things to know before presenting

- **CCTS today is not computable.** The CSV has no FY2023-24 baseline. The Today bar shows a hatched upper bound at illustrative rates (≤ ₹44.74 Cr/yr) that is not part of the ₹46.90 Cr/yr total.
- **The increase is a floor.** Today's CCTS is only an upper bound, so the banner says "at least ₹152.06 Cr/yr", with CCTS at least 78.4%. At illustrative rates the CCTS increase is ₹0.00 because emissions are held flat.
- **The CCTS rates are illustrative, not verified.** The 2.7% integrated / 6.6% grinding split is not confirmed against the notified rules. ICAP reports the notified cement range as 4.7–7.6% for FY2025-26 to FY2026-27, set per plant. No gazetted target runs to 2040, so both 2040 cases (illustrative, and stretch 10%) are scenarios.
- **The clinker toggle changes Scope 1 and intensity only.** Every ₹ value, including CCTS, uses direct chimney emissions in both views. Fleet Scope 1 is 10,932 kt either way, but CCTS totals would differ at these rates (₹44.74 vs ₹56.84 Cr/yr), so adjusted CCTS is not shown.
- **The ledger is sortable** by any column (default: 2040 total, descending) and the plant column stays pinned when scrolling.
- **Flood API data is context only.** River discharge does not feed any ₹ figure.

| Ledger with clinker toggle | Assumptions section | Plant drawer |
| :---: | :---: | :---: |
| ![Ledger](docs/screenshots/screenshot_clinker_adjusted.png) | ![Assumptions](docs/screenshots/screenshot_assumptions_panel.png) | ![Drawer](docs/screenshots/screenshot_drawer_grinding_unit.png) |

## Run it

Requires Node 18+.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

Deep links for review and screenshots: `?clinker=direct`, `?assumptions=open`, `?drawer=P07`.

## Verify the data

```bash
python3 verify_audit.py
```

Checks that CSV totals match the brief, that every plant row in the JSON matches the CSV, that fleet figures equal the sum of plant rows, and that the CCTS and attribution figures shown in the UI reconcile. It uses only the Python standard library.

## Repository layout

| Path | Purpose |
| :--- | :--- |
| `src/App.tsx` | The whole UI (React 18, Tailwind) |
| `src/data/` | Data the UI reads: `enriched_plants_data.json`, `assumptions.json` |
| `tailwind.config.js`, `src/index.css` | Oren design tokens |
| `design.md` | Design system specification |
| `nimbus_cement_plants.csv`, `public/` | Source CSV and the copy served for download |
| `build_v*.py`, `enrich_data.py` | Scripts that produced the enriched JSON |
| `open_meteo_*_cache.json` | Cached Open-Meteo responses, so the data can be rebuilt without refetching |
| `verify_audit.py` | Audit and reconciliation checks |
| `DEVELOPER_TICKET.md` | Engineering specification |
| `PROCESS_NOTE.md` | Research, assumptions, scope cuts, and where AI was wrong |

`enriched_plants_data.json` exists at the repo root (read by `verify_audit.py`) and in `src/data/` (read by the app). Keep the two identical.

## Status

Prototype. Heat figures are model-derived from reanalysis, not station data. Water, coastal and CCTS figures rest on stated assumptions listed in the in-app assumptions section and in `assumptions.json`.
