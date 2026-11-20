# Process note: Nimbus Climate Exposure Ledger

**Author:** Shashwat Sengupta. **Customer:** Meera Iyer, Head of Sustainability, Nimbus Cement.

## What I built, and for whom
One screen for Meera to put in front of a board, an auditor and lenders. It answers "what is our exposure today and by 2040" as three separate numbers: heat, water and coastal, and carbon cost. I chose one transition lever (India's CCTS) and two physical hazards (heat, water), because each can be tied to a plant's EBITDA and defended line by line.

## What I researched
- **Cement:** kilns emit mostly from calcining limestone; grinding units have almost no direct emissions and receive clinker from P01 and P06. That makes plant-level emissions misleading.
- **CCTS:** intensity-based targets set per plant against an FY2023-24 baseline. ICAP reports the notified cement range as 4.7–7.6% for FY2025-26 to FY2026-27.
- **Heat:** Open-Meteo ERA5 reanalysis (2015–24) and CMIP6 HighResMIP (2036–45). I compared raw model output with ERA5 and found a large warm bias.
- **Water and flood:** Open-Meteo Flood API, kept as context only.

## Assumptions (all labelled in the app and in `assumptions.json`)
₹1,000/t EBITDA margin, 330 operating days, ₹1,500/tCO₂, heat loss weights of 10% and 35% (halved for grinding units), water and coastal lost days per plant (judgement, not sourced), CCTS cases of 2.7% / 6.6% (illustrative, not verified) and 10% (stretch), no abatement or growth to 2040.

## What I cut, and why
- **Asset damage and impairment** (flood, cyclone): needs vulnerability curves I cannot defend yet. Named as v1.1.
- **GIS maps:** a 20-minute board slot needs a ranked table, not a map.
- **Login:** one public link keeps circulation easy. Scope 3: it blurs plant-level accountability.
- **Live API calls in the browser:** numbers must be reproducible for an auditor, and free tiers are rate-limited.
- **A single blended headline:** heat is data, water and carbon cost are assumptions, so they stay separate.

## How I used AI
**Tools:** Claude Code (Anthropic) wrote the React app, the data scripts, the audit script and these documents, working from my specification. Open-Meteo supplied the climate data.
**Where it was wrong:** it treated the three grinding units as "98% green" and loaded the carbon cost onto the two mother kilns. I caught it by reading the `clinker_shipped` and `notes` columns: P01 and P06 ship clinker to the grinding units, so their chimney emissions are an accounting artifact. I added a mass-balance reallocation and a toggle.
**Also caught in review:** the AI claimed CCTS totals stay the same under that toggle. They do not at different per-plant rates (₹44.74 Cr vs ₹56.84 Cr), so every ₹ value now uses direct emissions. A first attribution line said 83.3% of the increase was regulatory; it compared 2040 against a zero baseline, so it is now a floor of at least ₹152.06 Cr/yr.
