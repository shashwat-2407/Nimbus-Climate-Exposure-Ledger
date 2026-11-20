# Nimbus Climate Exposure Dashboard — Oren Design System Specification

## Voice and Look
- **Target Audience:** Meera Iyer (Head of Sustainability) presenting to Board of Directors, SEBI BRSR Core Auditors, and Institutional Lenders.
- **Tone:** Calm, plain, and specific. Sentence case headings. No exclamation marks, no marketing fluff. Every number explicitly states what it is, per year or total, and its methodological source.
- **Visual Identity:** White page with Oren navy text (`#1E2B56`), deep teal-navy action gradient (`#1E2B56` to `#1F5F66`), soft rounded cards (`20px` radius), pill buttons (`rounded-full`), and muted earth-tone palette (orange, sage, sand). Light, authoritative, and trustworthy.

## Typography
- **Headings:** `Figtree`, weights 600 & 700. Tight letter spacing (`-0.01em` / `tracking-tight`). Sentence case. Line height 1.25.
- **Body & Tabular Data:** `Lato`, weights 400 & 700. Line height 1.5. Numeric cells styled with `font-variant-numeric: tabular-nums`.
- **Scale:**
  - 12px: Caption / Provenance badges / Sublabels
  - 14px: Table data / Units
  - 16px: Body text / Control labels
  - 20px: Card titles / Drawer section headers
  - 28px: Section headings
  - 40px: Page title
  - 48px: Headline KPI metrics

## Colour Palette & Tokens
| Token | Hex | Role / Usage |
| :--- | :--- | :--- |
| `background` | `#FFFFFF` | Page canvas |
| `surface` | `#F4F7F8` | Card backgrounds, sticky table headers |
| `soft` | `#E7EFF0` | Soft teal tint: hover states, segmented control track, chips |
| `line` | `#D5DDE0` | Card borders, grid lines, dividers |
| `text` | `#1E2B56` | Primary headings, table text, metrics (Oren Navy) |
| `textDark` | `#141D3B` | High-contrast text on dark backgrounds |
| `muted` | `#4B5578` | Secondary labels, units, subtext |
| `primaryAction` | `#1E2B56` → `#1F5F66` | Gradient pill buttons & active segment controls (solid: `#24405A`) |
| `tealAccent` | `#0F766E` | Links, active rings, "API-based" badge |
| `deepTeal` | `#0F3D3E` | Hero / header band background |
| `error` | `#DF3434` | Critical alerts |
| `amber` | `#A16207` | Text for assumption chips |
| `amberBg` | `#FDF3DC` | Background for assumption chips |
| `heat` | `#EA9A6E` | Extreme heat downtime (muted orange) |
| `water` | `#8CB080` | Water & coastal curtailment (sage green) |
| `ccts` | `#1E2B56` | CCTS regulatory carbon liability (navy) |
| `sand` | `#E3C06B` | Secondary chart accent |

## Component Visual Rules
1. **Three-Way Exposure Decoupling:** Heat, Water+Coastal, and CCTS must never be summed into an unlabelled total.
2. **Provenance Badging:**
   - **Heat:** Solid orange bar/indicator + Teal pill chip (`API-based`).
   - **Water & Coastal:** Sage bar/indicator + Amber pill chip (`Assumption`, dashed border).
   - **CCTS Carbon Liability:** Navy bar/indicator + Amber pill chip (`Assumption, illustrative`, dashed border).
3. **Assumption Visual Styling:** Dashed 1px borders (`border-dashed border-amber-300`) on assumption cells/cards with amber chip (`#A16207` on `#FDF3DC`).
4. **Today vs 2040 Visual Encoding:** "Today" is solid filled. "2040" is the same hue with a darker, prominent outline. Two distinct hues are never used for the two years.
5. **Clinker Toggle:** Single pill segmented control in the ledger table header, switching between "Direct chimney" and "Clinker-adjusted". Track `surface` with 1px `line` border, active segment navy-to-teal gradient with white text, 40px high, visible focus ring, `aria-pressed`. It changes only the Scope 1 and intensity columns; all ₹ values use direct emissions.
6. **Assumptions Panel:** Plain white, full-width inline audit section on the page (not in a modal, not a tab), opened by a plain "View assumptions" button.
