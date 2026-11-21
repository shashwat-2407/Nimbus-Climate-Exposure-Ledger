import React, { useRef, useState } from 'react'
import data from './data/enriched_plants_data.json'
import assumptionsData from './data/assumptions.json'
import {
  Factory,
  Flame,
  Droplets,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  Building2,
  HelpCircle,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  Thermometer,
  Waves,
  BarChart3
} from 'lucide-react'

type SortKey = 'plant' | 'scope1' | 'intensity' | 'heatToday' | 'heat2040' | 'waterToday' | 'water2040' | 'cctsNotified' | 'ccts10' | 'total2040' | 'delta'

export default function App() {
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search || window.location.hash.replace(/^#\??/, '')) 
    : new URLSearchParams()
  const [clinkerAdjusted, setClinkerAdjusted] = useState(searchParams.get('clinker') === 'direct' ? false : true)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(searchParams.get('drawer') || null)
  const [assumptionsOpen, setAssumptionsOpen] = useState(searchParams.get('assumptions') === 'open')

  const { portfolio_summary, plants } = data
  const headline = portfolio_summary.headline_exposure_summary_inr_cr_per_year
  const baseline = headline.baseline_2015_2024
  const horizon = headline.horizon_2040
  const attribution = headline.fleet_increase_attribution_baseline_to_2040
  const chartData = headline.chart_stacked_today_vs_2040

  const selectedPlant = plants.find(p => p.plant_id === selectedPlantId) || null
  const assumptionsRef = useRef<HTMLElement | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'total2040', dir: 'desc' })
  const toggleSort = (key: SortKey) =>
    setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'plant' ? 'asc' : 'desc' }))

  // CCTS is always computed on direct (unadjusted) emissions. The clinker toggle
  // never feeds a ₹ value; it only changes the Scope 1 and intensity columns.
  const cctsTodayUpperBound = baseline.ccts_upper_bound_at_notified_averages_inr_cr_per_year
  const cctsNotified2040 = horizon.ccts_component_notified_annual_direct_inr_cr_per_year
  const ccts10 = horizon.ccts_component_case_10pct_annual_unadjusted_inr_cr_per_year
  const total2040Notified = horizon.heat_component_api_based_inr_cr_per_year + horizon.water_coastal_component_judgement_inr_cr_per_year + cctsNotified2040

  // Attribution: CCTS has no measured baseline, so its increase is a floor
  // (2040 stretch minus today's upper bound). Heat and water are exact deltas.
  const deltaHeat = attribution.delta_heat_component_inr_cr_per_year
  const deltaWater = attribution.delta_water_coastal_component_inr_cr_per_year
  const deltaCcts = ccts10 - cctsTodayUpperBound
  const deltaTotal = deltaHeat + deltaWater + deltaCcts
  const pctHeat = (deltaHeat / deltaTotal) * 100
  const pctWater = (deltaWater / deltaTotal) * 100
  const pctCcts = (deltaCcts / deltaTotal) * 100

  const rows = plants.map(plant => {
    const fin = plant.three_component_financial_exposure_inr_cr_per_year
    const heatToday = fin.baseline_2015_2024.heat_component_api_based_inr_cr_per_year
    const heat2040 = fin.horizon_2040.heat_component_api_based_inr_cr_per_year
    const waterToday = fin.baseline_2015_2024.water_coastal_component_judgement_inr_cr_per_year
    const water2040 = fin.horizon_2040.water_coastal_component_judgement_inr_cr_per_year
    const cctsTodayUB = fin.baseline_2015_2024.ccts_today_upper_bound_inr_cr_per_year
    // Direct emissions only, regardless of the clinker toggle.
    const cctsNotified = fin.horizon_2040.ccts_component_notified_unadjusted_inr_cr_per_year
    const ccts10Plant = fin.horizon_2040.ccts_component_case_10pct_unadjusted_inr_cr_per_year
    const total2040 = heat2040 + water2040 + ccts10Plant
    return {
      plant,
      plant_name: plant.plant_name,
      scope1: clinkerAdjusted ? plant.emissions.clinker_reallocated_scope1_kt : plant.emissions.unadjusted_direct_scope1_kt,
      intensity: clinkerAdjusted ? plant.emissions.adjusted_intensity_tco2_per_t : plant.emissions.unadjusted_intensity_tco2_per_t,
      heatToday, heat2040, waterToday, water2040, cctsNotified,
      ccts10: ccts10Plant,
      total2040,
      delta: total2040 - (heatToday + waterToday + cctsTodayUB),
    }
  })
  const sortedRows = [...rows].sort((a, b) => {
    const av = sort.key === 'plant' ? a.plant_name : a[sort.key]
    const bv = sort.key === 'plant' ? b.plant_name : b[sort.key]
    const c = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sort.dir === 'asc' ? c : -c
  })

  const toggleAssumptions = () => {
    const next = !assumptionsOpen
    setAssumptionsOpen(next)
    if (next) {
      setTimeout(() => assumptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }
  }

  // Flatten general assumptions for audit registry table
  const auditRegistryGeneral = [
    {
      parameter: 'Nominal Operating Days',
      value: `${assumptionsData.financial_assumptions.nominal_operating_days_per_year.value} days/yr`,
      unit: assumptionsData.financial_assumptions.nominal_operating_days_per_year.unit,
      status: assumptionsData.financial_assumptions.nominal_operating_days_per_year.source_status,
      justification: assumptionsData.financial_assumptions.nominal_operating_days_per_year.justification
    },
    {
      parameter: 'EBITDA Margin',
      value: `₹${assumptionsData.financial_assumptions.industry_ebitda_margin_per_tonne.value} / t`,
      unit: assumptionsData.financial_assumptions.industry_ebitda_margin_per_tonne.unit,
      status: assumptionsData.financial_assumptions.industry_ebitda_margin_per_tonne.source_status,
      justification: assumptionsData.financial_assumptions.industry_ebitda_margin_per_tonne.justification
    },
    {
      parameter: 'Heat Baseline Source',
      value: '2015–2024 ERA5',
      unit: '10-yr daily reanalysis',
      status: 'API-based (ERA5 reanalysis, not station data)',
      justification: assumptionsData.heat_lost_days_assumptions.baseline_data.provider
    },
    {
      parameter: 'Heat 2040 Delta Method',
      value: 'EC_Earth3P_HR + MRI_AGCM3_2_S',
      unit: 'CMIP6 HighResMIP',
      status: 'Model-derived (Delta method)',
      justification: assumptionsData.heat_lost_days_assumptions.climate_models_used_for_delta.aggregation
    },
    {
      parameter: 'Heat Downtime Weights',
      value: '10% [40-43°C), 35% [≥43°C]',
      unit: 'loss factor (50% GU damping)',
      status: 'Assumption',
      justification: 'Refractory protection, captive quarry health & safety curtailment, equipment cooling derating'
    },
    {
      parameter: 'CCTS Carbon Price',
      value: `₹${assumptionsData.ccts_transition_risk_assumptions.carbon_price_per_tco2.value} / tCO₂`,
      unit: assumptionsData.ccts_transition_risk_assumptions.carbon_price_per_tco2.unit,
      status: assumptionsData.ccts_transition_risk_assumptions.carbon_price_per_tco2.source_status,
      justification: 'Illustrative price pending exchange price discovery; applied to direct (chimney) Scope 1 emissions only.'
    },
    {
      parameter: 'CCTS Compliance Baseline',
      value: 'Not computable from CSV (no FY2023-24 baseline)',
      unit: 'historical GEI baseline',
      status: 'Data Limitation',
      justification: 'Compliance under BEE rules requires plant-specific FY2023-24 emissions intensity baselines not present in the current CSV.'
    },
    {
      parameter: 'CCTS Reduction Rates',
      value: 'Illustrative rates (integrated 2.7%, grinding 6.6%) vs Stretch 10% (scenario)',
      unit: 'mandated GEI cut',
      status: 'Illustrative Scenario',
      justification: 'The 2.7% / 6.6% split is illustrative and not verified against the notified rules. ICAP reports the notified cement range as 4.7%–7.6% for FY2025-26 to FY2026-27, set per plant against an FY2023-24 baseline. No gazetted target runs to 2040.'
    }
  ]

  return (
    <div className="min-h-screen bg-white text-oren-navy flex flex-col font-sans">
      {/* Top Bar (Unified Product Name: Nimbus Climate Exposure Ledger) */}
      <header className="border-b border-oren-line bg-white sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-oren-navy flex items-center justify-center text-white font-display font-bold text-base shadow-sm">
              N
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-base sm:text-lg text-oren-navy tracking-tight">
                  Nimbus Climate Exposure Ledger
                </span>
              </div>
              <p className="hidden sm:block text-xs text-oren-muted">
                Climate exposure today and by 2040 · Heat, water and coastal, and CCTS carbon cost
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="./nimbus_cement_plants.csv"
              download="nimbus_cement_plants.csv"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-oren-soft text-oren-navy hover:bg-oren-line transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-oren-teal" />
              <span className="hidden sm:inline">Download source CSV</span><span className="sm:hidden">CSV</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Header Hero Band (Dark teal rounded card with question in white) */}
        <section className="bg-gradient-to-r from-oren-deep to-oren-navy text-white rounded-hero p-8 sm:p-10 shadow-oren relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <span className="text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 inline-block">
              Executive briefing
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              What is our business exposure to climate events today and by 2040?
            </h1>
            <p className="text-xs sm:text-sm text-oren-soft font-normal leading-relaxed pt-1">
              Nimbus Cement Ltd · 9 plants across India · ₹15,450 Cr gross asset base · 23.00 MTPA capacity · 18.35 Mt annual output.
            </p>
          </div>
        </section>

        {/* Stacked Today vs 2040 Chart (Oren Look and Feel) */}
        <section className="bg-white rounded-card p-6 border border-oren-line shadow-oren space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-oren-line pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <BarChart3 className="w-4 h-4 shrink-0 text-oren-teal" />
                <h2 className="text-xl font-display font-bold text-oren-navy">
                  Portfolio climate exposure: today vs 2040
                </h2>
                <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-amberBg text-oren-amber border border-dashed border-oren-amber/40">
                  includes assumptions
                </span>
              </div>
              <p className="text-xs text-oren-muted mt-0.5">
                Annual financial exposure in ₹ Crores / year comparing empirical baseline against 2040 projections.
              </p>
              <p className="text-xs text-oren-muted">
                Data as of: Open-Meteo ERA5 reanalysis 2015–2024 and CMIP6 HighResMIP (EC_Earth3P_HR, MRI_AGCM3_2_S), 2036–2045 window, snapshot cached in this build. Plant data: FY2025-26 CSV.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-chart-heat" /> Heat (API-based)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-chart-water" /> Water & Coastal (Assumption)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-chart-ccts" /> CCTS Carbon (Scenario)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-hatch-ccts border border-oren-navy" /> CCTS today, upper bound
              </span>
            </div>
          </div>

          {/* Stacked Bars Comparison */}
          <div className="space-y-4 pt-1">
            {/* Row 1: Today */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-oren-navy">
                <span className="flex items-center gap-2">
                  <span>Today (2015–2024 baseline)</span>
                  <span className="text-xs text-oren-muted font-normal">
                    (heat + water only; CCTS shown hatched as an upper bound)
                  </span>
                </span>
                <span className="tabular-nums font-bold text-oren-navy">
                  ₹{chartData.today.total_inr_cr_per_year.toFixed(2)} Cr / yr
                </span>
              </div>
              <div className="h-8 rounded-xl bg-oren-surface flex overflow-hidden border border-oren-line">
                <div
                  style={{ width: `${(chartData.today.heat_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-heat h-full flex items-center justify-center text-xs font-bold text-oren-navyDark px-2"
                  title={`Extreme Heat: ₹${chartData.today.heat_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.today.heat_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.today.water_coastal_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-water h-full flex items-center justify-center text-xs font-bold text-oren-navyDark px-2"
                  title={`Water & Coastal: ₹${chartData.today.water_coastal_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.today.water_coastal_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(cctsTodayUpperBound / 250) * 100}%` }}
                  className="bg-hatch-ccts h-full flex items-center justify-center text-xs font-bold text-oren-navy px-2 border-l border-dashed border-oren-navy"
                  title={`CCTS today, upper bound at illustrative rates: up to ₹${cctsTodayUpperBound.toFixed(2)} Cr/yr (direct emissions)`}
                >
                  <span className="bg-white/85 rounded px-1">≤ ₹{cctsTodayUpperBound.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-oren-muted">
                Hatched segment: CCTS today, upper bound at illustrative rates (integrated 2.7%, grinding 6.6%, not verified against the notified rules) on direct emissions. It is not part of the ₹{chartData.today.total_inr_cr_per_year.toFixed(2)} Cr / yr total, because no FY2023-24 baseline exists in the CSV.
              </p>
            </div>

            {/* Row 2: 2040 Horizon (Stretch 10% Scenario) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-oren-navy">
                <span className="flex items-center gap-2">
                  <span>2040, stretch 10% scenario</span>
                </span>
                <span className="tabular-nums font-bold text-oren-navy">
                  ₹{chartData.horizon_2040_stretch_10pct.total_inr_cr_per_year.toFixed(2)} Cr / yr
                </span>
              </div>
              <div className="h-8 rounded-xl bg-oren-surface flex overflow-hidden border border-oren-line">
                <div
                  style={{ width: `${(chartData.horizon_2040_stretch_10pct.heat_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-heat h-full flex items-center justify-center text-xs font-bold text-oren-navyDark px-2"
                  title={`Extreme Heat: ₹${chartData.horizon_2040_stretch_10pct.heat_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_stretch_10pct.heat_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.horizon_2040_stretch_10pct.water_coastal_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-water h-full flex items-center justify-center text-xs font-bold text-oren-navyDark px-2"
                  title={`Water & Coastal: ₹${chartData.horizon_2040_stretch_10pct.water_coastal_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_stretch_10pct.water_coastal_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.horizon_2040_stretch_10pct.ccts_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-ccts h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`CCTS Carbon (10%): ₹${chartData.horizon_2040_stretch_10pct.ccts_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_stretch_10pct.ccts_inr_cr_per_year.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Row 3: 2040 Horizon (Illustrative Rates Case) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-oren-navy">
                <span className="flex items-center gap-2">
                  <span>2040, illustrative rates (integrated 2.7%, grinding 6.6%)</span>
                </span>
                <span className="tabular-nums font-bold text-oren-navy">
                  ₹{total2040Notified.toFixed(2)} Cr / yr
                </span>
              </div>
              <div className="h-8 rounded-xl bg-oren-surface flex overflow-hidden border border-oren-line">
                <div
                  style={{ width: `${(chartData.horizon_2040_notified_rates.heat_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-heat h-full flex items-center justify-center text-xs font-bold text-oren-navyDark px-2"
                  title={`Extreme Heat: ₹${chartData.horizon_2040_notified_rates.heat_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_notified_rates.heat_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-chart-water h-full flex items-center justify-center text-xs font-bold text-oren-navyDark px-2"
                  title={`Water & Coastal: ₹${chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(cctsNotified2040 / 250) * 100}%` }}
                  className="bg-chart-ccts h-full flex items-center justify-center text-xs font-bold text-white px-2 opacity-90"
                  title={`CCTS illustrative: ₹${cctsNotified2040.toFixed(2)} Cr/yr (direct emissions)`}
                >
                  ₹{cctsNotified2040.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Decoupled KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI Card 1: Extreme Heat */}
          <div className="bg-white rounded-card p-6 border border-oren-line shadow-oren flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                  Physical risk 1
                </span>
                <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-oren-teal border border-oren-teal/20">
                  API-based
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                Extreme heat downtime
              </h2>
              <p className="text-sm text-oren-muted leading-relaxed">
                Kiln & quarry curtailment on days ≥40°C from ERA5 reanalysis and CMIP6 multi-model delta.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-oren-line space-y-4">
              <div>
                <div className="text-xs text-oren-muted mb-1">2040 projected exposure</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-oren-navy tabular-nums">
                    ₹{horizon.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-oren-muted">₹ Cr / yr</span>
                </div>
              </div>

              <div className="bg-oren-surface rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-oren-muted">Today (2015–24): </span>
                  <span className="font-semibold text-oren-navy tabular-nums">
                    ₹{baseline.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr
                  </span>
                </div>
                <span className="text-xs font-bold text-[#C87445] bg-chart-heat/15 px-2 py-0.5 rounded-full tabular-nums">
                  +₹{attribution.delta_heat_component_inr_cr_per_year.toFixed(2)} Cr/yr
                </span>
              </div>
            </div>
          </div>

          {/* KPI Card 2: Water & Coastal */}
          <div className="bg-white rounded-card p-6 border border-dashed border-amber-300 shadow-oren flex flex-col justify-between bg-hatch-assumption">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                  Physical risk 2
                </span>
                <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-amberBg text-oren-amber border border-dashed border-oren-amber/40">
                  Assumption
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                Water & coastal curtailment
              </h2>
              <p className="text-sm text-oren-muted leading-relaxed">
                Cooling tower curtailment & cyclone shutdowns based on basin water stress judgement.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-oren-line space-y-4">
              <div>
                <div className="text-xs text-oren-muted mb-1">2040 projected exposure</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-oren-navy tabular-nums">
                    ₹{horizon.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-oren-muted">₹ Cr / yr</span>
                </div>
              </div>

              <div className="bg-oren-surface rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-oren-muted">Today: </span>
                  <span className="font-semibold text-oren-navy tabular-nums">
                    ₹{baseline.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr
                  </span>
                </div>
                <span className="text-xs font-bold text-[#5F8354] bg-chart-water/20 px-2 py-0.5 rounded-full tabular-nums">
                  +₹{attribution.delta_water_coastal_component_inr_cr_per_year.toFixed(2)} Cr/yr
                </span>
              </div>
            </div>
          </div>

          {/* KPI Card 3: CCTS Carbon Cost */}
          <div className="bg-white rounded-card p-6 border border-dashed border-amber-300 shadow-oren flex flex-col justify-between bg-hatch-assumption">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                  Transition risk
                </span>
                <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-amberBg text-oren-amber border border-dashed border-oren-amber/40">
                  Assumption · Scenario
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                CCTS carbon cost
              </h2>
              <p className="text-sm text-oren-muted leading-relaxed">
                India's Carbon Credit Trading Scheme @ ₹1,500/tCO₂ on direct emissions. No target runs to 2040.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-oren-line space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-oren-muted mb-0.5">Stretch 10% scenario</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-oren-navy tabular-nums">
                      ₹{ccts10.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-oren-muted">Cr/yr</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-oren-muted mb-0.5">Illustrative (2.7% / 6.6%)</div>
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-3xl font-display font-bold text-oren-navy tabular-nums">
                      ₹{cctsNotified2040.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-oren-muted">Cr/yr</span>
                  </div>
                </div>
              </div>

              <div className="bg-oren-surface rounded-xl p-2.5 space-y-1 text-xs">
                <div className="font-semibold text-oren-navy">
                  Today: no FY2023-24 baseline in CSV, so shown as an upper bound only
                </div>
                <div className="text-oren-muted">
                  Upper bound at illustrative rates: ₹{cctsTodayUpperBound.toFixed(2)} Cr/yr (direct emissions)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attribution Banner / Key Takeaway Card */}
        <section className="bg-oren-surface rounded-card p-6 border border-oren-line shadow-oren" aria-label="Attribution of the increase">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-oren-navy uppercase tracking-wider">
                  Attribution of the increase
                </span>
                <span className="text-xs text-oren-muted">
                  Today to 2040 stretch 10% scenario
                </span>
              </div>
              <p className="text-sm text-oren-navy leading-relaxed font-normal">
                Heat (+₹{deltaHeat.toFixed(2)} Cr/yr) and water & coastal (+₹{deltaWater.toFixed(2)} Cr/yr) are measured against today's baseline. CCTS has no baseline in the CSV, so its increase is a floor: ₹{ccts10.toFixed(2)} Cr/yr in 2040 minus the ₹{cctsTodayUpperBound.toFixed(2)} Cr/yr upper bound today, which is at least +₹{deltaCcts.toFixed(2)} Cr/yr. At illustrative rates the CCTS increase is ₹0.00, because the same emissions and rates apply today and in 2040. All CCTS figures use direct emissions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 bg-white rounded-xl p-4 border border-oren-line">
              <div className="space-y-1">
                <div className="text-xs text-oren-muted">Projected net annual increase, at least</div>
                <div className="text-2xl font-display font-bold text-oren-navy tabular-nums">
                  +₹{deltaTotal.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-oren-muted">Cr / yr</span>
                </div>
              </div>

              <div className="h-10 w-px bg-oren-line hidden sm:block"></div>

              {/* Stacked Proportional Bar */}
              <div className="w-full sm:w-56 space-y-1.5">
                <div className="h-3 rounded-full overflow-hidden flex bg-oren-soft">
                  <div
                    style={{ width: `${pctCcts}%` }}
                    className="bg-oren-navy h-full"
                    title={`CCTS: at least ${pctCcts.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${pctWater}%` }}
                    className="bg-chart-water h-full"
                    title={`Water & Coastal: up to ${pctWater.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${pctHeat}%` }}
                    className="bg-chart-heat h-full"
                    title={`Extreme Heat: up to ${pctHeat.toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-xs text-oren-muted tabular-nums">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-oren-navy inline-block" /> CCTS ≥{pctCcts.toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-chart-water inline-block" /> Water ≤{pctWater.toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-chart-heat inline-block" /> Heat ≤{pctHeat.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ASSET RISK LEDGER TABLE */}
        <section className="bg-white rounded-card border border-oren-line shadow-oren overflow-hidden" aria-label="9-plant climate exposure ledger">
          <div className="p-6 border-b border-oren-line flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-oren-navy">
                  9-plant exposure ledger
                </h2>
                <p className="text-sm text-oren-muted mt-0.5">
                  Select a plant row for its detail. Column headers sort the table; Heat and Water sort by their 2040 value.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAssumptions}
                aria-expanded={assumptionsOpen}
                aria-controls="assumptions-section"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-oren-line bg-white text-sm font-semibold text-oren-navy hover:bg-oren-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oren-teal focus-visible:ring-offset-2 transition-colors self-start"
              >
                View assumptions
                {assumptionsOpen ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span id="clinker-label" className="text-sm font-semibold text-oren-navy">
                  Clinker accounting
                </span>
                <div
                  role="group"
                  aria-labelledby="clinker-label"
                  className="inline-flex items-stretch h-10 rounded-full bg-oren-surface border border-oren-line p-0.5 box-border text-sm font-semibold"
                >
                  {[
                    { label: 'Direct chimney', value: false },
                    { label: 'Clinker-adjusted', value: true },
                  ].map(opt => {
                    const active = clinkerAdjusted === opt.value
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setClinkerAdjusted(opt.value)}
                        className={`px-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oren-teal focus-visible:ring-offset-2 ${
                          active
                            ? 'bg-gradient-to-r from-oren-navy to-oren-tealAction text-white'
                            : 'text-oren-muted hover:text-oren-navy'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-oren-muted max-w-md">
                Changes only the Scope 1 and intensity columns. Every ₹ value, including CCTS, uses direct chimney emissions in both views.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-oren-teal font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-50 border border-oren-teal"></span>
                API-based
              </span>
              <span className="flex items-center gap-1.5 text-oren-amber font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-oren-amberBg border border-oren-amber border-dashed"></span>
                Assumption / Scenario
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-oren-navy border-collapse">
              <thead className="bg-oren-surface text-xs font-semibold text-oren-muted uppercase tracking-wider border-b border-oren-line">
                <tr>
                  {([
                    { key: 'plant', label: 'Plant and location', sub: '', subCls: '', cls: 'px-4 min-w-[153px] text-left sticky left-0 z-10 bg-oren-surface shadow-[1px_0_0_#D5DDE0]' },
                    { key: 'scope1', label: 'Scope 1 (kt)', sub: clinkerAdjusted ? 'clinker-adjusted' : 'direct chimney', subCls: 'lowercase text-oren-muted', cls: 'px-2.5 min-w-[112px]' },
                    { key: 'intensity', label: 'Intensity', sub: `tCO₂/t · ${clinkerAdjusted ? 'adjusted' : 'direct'}`, subCls: 'normal-case text-oren-muted', cls: 'px-2.5 min-w-[132px]' },
                    { key: 'heat2040', label: 'Heat', sub: 'today → 2040 · API-based', subCls: 'normal-case text-oren-teal', cls: 'px-2.5 bg-orange-50/40' },
                    { key: 'water2040', label: 'Water and coastal', sub: 'today → 2040 · assumption', subCls: 'normal-case text-oren-amber', cls: 'px-2.5 bg-green-50/40' },
                    { key: 'cctsNotified', label: 'CCTS illustrative', sub: '2.7% / 6.6%', subCls: 'lowercase text-oren-amber', cls: 'px-2.5 bg-slate-100' },
                    { key: 'ccts10', label: 'CCTS stretch', sub: '10% scenario', subCls: 'lowercase text-oren-amber', cls: 'px-2.5 bg-slate-100' },
                    { key: 'total2040', label: '2040 total', sub: 'stretch scenario', subCls: 'lowercase font-semibold text-oren-amber', cls: 'px-2.5 font-bold text-oren-navy' },
                    { key: 'delta', label: 'Increase, at least', sub: 'vs today', subCls: 'normal-case text-oren-muted', cls: 'px-2.5 font-bold text-[#C87445]' },
                  ] as { key: SortKey; label: string; sub: string; subCls: string; cls: string }[]).map(col => {
                    const active = sort.key === col.key
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={`py-3 align-bottom ${col.key === 'plant' ? '' : 'text-right'} ${col.cls}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className={`inline-flex flex-col ${col.key === 'plant' ? 'items-start' : 'items-end'} uppercase tracking-wide font-[inherit] ${col.key === 'plant' ? 'text-left' : 'text-right'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oren-teal rounded`}
                        >
                          <span className="inline-flex items-center gap-1 whitespace-normal">
                            {col.label}
                            <span aria-hidden="true" className={active ? 'text-oren-navy' : 'text-oren-line'}>
                              {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                            </span>
                          </span>
                          {col.sub && <span className={`text-xs font-normal whitespace-nowrap ${col.subCls}`}>{col.sub}</span>}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-oren-line text-sm">
                {sortedRows.map((row) => {
                  const { plant, scope1, intensity, heatToday, heat2040, waterToday, water2040, cctsNotified, ccts10: ccts10Plant, total2040: total2040_10, delta: deltaFloor } = row
                  const isSelected = selectedPlantId === plant.plant_id

                  return (
                    <tr
                      key={plant.plant_id}
                      onClick={() => setSelectedPlantId(isSelected ? null : plant.plant_id)}
                      className={`cursor-pointer transition-colors hover:bg-oren-soft/60 ${
                        isSelected ? 'bg-oren-soft font-medium' : ''
                      }`}
                    >
                      <td className={`px-4 py-3.5 sticky left-0 z-10 shadow-[1px_0_0_#D5DDE0] ${isSelected ? 'bg-oren-soft' : 'bg-white'}`}>
                        <div className="font-semibold text-oren-navy flex items-center gap-1.5">
                          {plant.plant_name}
                          {plant.plant_type === 'Grinding unit' && (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-soft text-oren-navy border border-oren-line">
                              GU
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-oren-muted mt-0.5">
                          {plant.town}, {plant.state}
                        </div>
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums font-medium text-oren-navy">
                        {scope1.toFixed(1)}
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums text-oren-navy">
                        {intensity.toFixed(3)}
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums text-oren-navy bg-orange-50/30 whitespace-nowrap">
                        <span className="text-oren-muted">₹{heatToday.toFixed(2)}</span> <span aria-hidden="true" className="text-oren-muted">→</span> <span className="font-semibold">₹{heat2040.toFixed(2)}</span>
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums text-oren-navy bg-green-50/30 whitespace-nowrap">
                        <span className="text-oren-muted">₹{waterToday.toFixed(2)}</span> <span aria-hidden="true" className="text-oren-muted">→</span> <span className="font-semibold">₹{water2040.toFixed(2)}</span>
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums font-semibold text-oren-navy bg-slate-50/60">
                        ₹{cctsNotified.toFixed(2)}
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums text-oren-muted bg-slate-50/60">
                        ₹{ccts10Plant.toFixed(2)}
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums font-bold text-oren-navy">
                        ₹{total2040_10.toFixed(2)}
                      </td>

                      <td className="px-2.5 py-3.5 text-right tabular-nums font-bold text-[#C87445]">
                        +₹{deltaFloor.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Fleet Summary Reconciled Footer */}
              <tfoot className="bg-oren-surface font-bold text-oren-navy border-t-2 border-oren-line text-sm">
                <tr>
                  <td className="px-4 py-3.5 sticky left-0 z-10 bg-oren-surface shadow-[1px_0_0_#D5DDE0]">
                    <div>Fleet total (9 plants, reconciled)</div>
                    <div className="text-xs font-normal text-oren-muted">
                      Asset base: ₹15,450 Cr · Capacity: 23.00 MTPA
                    </div>
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums">
                    {(clinkerAdjusted ? portfolio_summary.portfolio_totals.total_clinker_adjusted_scope1_kt : portfolio_summary.portfolio_totals.total_scope1_co2_kt).toFixed(1)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums">
                    {((clinkerAdjusted ? portfolio_summary.portfolio_totals.total_clinker_adjusted_scope1_kt : portfolio_summary.portfolio_totals.total_scope1_co2_kt) / (portfolio_summary.portfolio_totals.total_cement_output_fy2025_26_mt * 1000)).toFixed(3)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums bg-orange-50/40 whitespace-nowrap">
                    <span className="text-oren-muted font-normal">₹{baseline.heat_component_api_based_inr_cr_per_year.toFixed(2)}</span> → ₹{horizon.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums bg-green-50/40 whitespace-nowrap">
                    <span className="text-oren-muted font-normal">₹{baseline.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}</span> → ₹{horizon.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums bg-slate-100">
                    ₹{cctsNotified2040.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums bg-slate-100">
                    ₹{ccts10.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums text-oren-navy">
                    ₹{horizon.component_sum_with_10pct_ccts_inr_cr_per_year.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3.5 text-right tabular-nums text-[#C87445]">
                    +₹{deltaTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ASSUMPTIONS & AUDIT REGISTRY (inline section, opened by "View assumptions") */}
        {assumptionsOpen && (
          <section
            id="assumptions-section"
            ref={assumptionsRef}
            aria-label="Assumptions and methodology registry"
            className="scroll-mt-28 bg-white rounded-card border border-oren-line shadow-oren p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-oren-line pb-4">
              <div>
                <h2 className="text-xl font-display font-bold text-oren-navy">
                  Assumptions and methodology
                </h2>
                <p className="text-xs text-oren-muted mt-1">
                  Every parameter and data source, with its evidence status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssumptionsOpen(false)}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-oren-line bg-white text-sm font-semibold text-oren-navy hover:bg-oren-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oren-teal focus-visible:ring-offset-2"
              >
                Hide assumptions
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* General & Financial Assumptions Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-display font-bold text-oren-navy uppercase tracking-wider">
                Financial, operational and regulatory parameters
              </h4>
              <div className="overflow-x-auto rounded-xl border border-oren-line">
                <table className="w-full text-left text-sm text-oren-navy">
                  <thead className="bg-oren-surface text-xs text-oren-muted font-semibold uppercase tracking-wider border-b border-oren-line">
                    <tr>
                      <th className="px-4 py-3">Parameter</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Source and justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oren-line">
                    {auditRegistryGeneral.map((param, idx) => (
                      <tr key={idx} className="hover:bg-oren-surface/50">
                        <td className="px-4 py-3 font-semibold text-oren-navy">{param.parameter}</td>
                        <td className="px-4 py-3 tabular-nums font-bold text-oren-navy">{param.value}</td>
                        <td className="px-4 py-3 text-oren-muted">{param.unit}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              (param.status || '').includes('API') || (param.status || '').includes('historical') || (param.status || '').includes('Model')
                                ? 'bg-teal-50 text-oren-teal border border-oren-teal/20'
                                : 'bg-oren-amberBg text-oren-amber border border-dashed border-oren-amber/40'
                            }`}
                          >
                            {param.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-oren-muted">{param.justification}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Site-Level Water & Coastal Judgement Entries */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-display font-bold text-oren-navy uppercase tracking-wider">
                  Site-level water and coastal days
                </h4>
                <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-amberBg text-oren-amber border border-dashed border-oren-amber/40">
                  Judgement, not sourced
                </span>
              </div>
              <p className="text-xs text-oren-muted">
                All basin names and lost days are judgement, not sourced from an agency dataset.
              </p>
              <div className="overflow-x-auto rounded-xl border border-oren-line">
                <table className="w-full text-left text-sm text-oren-navy">
                  <thead className="bg-oren-surface text-xs text-oren-muted font-semibold uppercase tracking-wider border-b border-oren-line">
                    <tr>
                      <th className="px-4 py-3">Plant</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Water source</th>
                      <th className="px-4 py-3">Basin</th>
                      <th className="px-4 py-3 text-right">Water lost, today</th>
                      <th className="px-4 py-3 text-right">Water lost, 2040</th>
                      <th className="px-4 py-3 text-right">Coastal lost, today</th>
                      <th className="px-4 py-3 text-right">Coastal lost, 2040</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oren-line">
                    {plants.map((plant) => {
                      const w = plant.physical_climate_data_bias_aware.water_and_coastal_assessment
                      return (
                        <tr key={plant.plant_id} className="hover:bg-oren-surface/50">
                          <td className="px-4 py-3 font-semibold">{plant.plant_id}</td>
                          <td className="px-4 py-3">{plant.plant_name}</td>
                          <td className="px-4 py-3 text-oren-muted">{plant.water_source}</td>
                          <td className="px-4 py-3 text-oren-muted">{w.basin_name}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">{w.water_lost_days_baseline.toFixed(1)} d</td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-oren-navy">{w.water_lost_days_2040.toFixed(1)} d</td>
                          <td className="px-4 py-3 text-right tabular-nums">{w.coastal_lost_days_baseline.toFixed(1)} d</td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-oren-navy">{w.coastal_lost_days_2040.toFixed(1)} d</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-amberBg text-oren-amber border border-dashed border-oren-amber/40">
                              {w.source_status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* PLANT DETAIL SLIDE-OUT DRAWER */}
      {selectedPlant && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-oren-navyDark/30 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedPlantId(null)}
        >
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-oren-line rounded-l-hero p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-oren-line pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-soft text-oren-navy border border-oren-line">
                      {selectedPlant.plant_id}
                    </span>
                    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-surface text-oren-muted border border-oren-line">
                      {selectedPlant.plant_type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-oren-navy">
                    {selectedPlant.plant_name}
                  </h3>
                  <p className="text-xs text-oren-muted mt-0.5">
                    {selectedPlant.town}, {selectedPlant.state} · GPS ({selectedPlant.latitude.toFixed(4)}, {selectedPlant.longitude.toFixed(4)})
                  </p>
                </div>
                <button
                  aria-label="Close plant details"
                  onClick={() => setSelectedPlantId(null)}
                  className="p-2 rounded-full hover:bg-oren-soft text-oren-muted hover:text-oren-navy transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exactly Three Short Crisp Bullets (Following Toggle, No 'inland kiln' for GUs) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                    Briefing
                  </h4>
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold bg-oren-soft text-oren-navy border border-oren-line">
                    {clinkerAdjusted ? 'Clinker-adjusted view' : 'Direct chimney view'}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-oren-navy leading-relaxed bg-oren-surface p-4 rounded-xl border border-oren-line">
                  {/* Bullet 1: Operations & Emissions (Following Toggle) */}
                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-oren-navy mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Operations and Scope 1: </strong>
                      {selectedPlant.plant_type === 'Grinding unit'
                        ? clinkerAdjusted
                          ? `Grinding unit producing ${selectedPlant.cement_output_fy2025_26_mt.toFixed(2)} Mt cement. Under clinker accounting, incorporates transferred intermediate clinker emissions for an adjusted total of ${selectedPlant.emissions.clinker_reallocated_scope1_kt.toFixed(0)} kt CO₂.`
                          : `Grinding unit producing ${selectedPlant.cement_output_fy2025_26_mt.toFixed(2)} Mt cement with low direct chimney smoke (${selectedPlant.emissions.unadjusted_direct_scope1_kt.toFixed(0)} kt CO₂) because clinker is calcined off-site.`
                        : clinkerAdjusted
                          ? `Integrated manufacturing kiln producing ${selectedPlant.cement_output_fy2025_26_mt.toFixed(2)} Mt cement. Adjusting for ${selectedPlant.clinker_shipped_fy2025_26_mt.toFixed(2)} Mt clinker shipped off-site by rail brings net on-site emissions to ${selectedPlant.emissions.clinker_reallocated_scope1_kt.toFixed(0)} kt CO₂.`
                          : `Integrated manufacturing kiln producing ${selectedPlant.cement_output_fy2025_26_mt.toFixed(2)} Mt cement, generating ${selectedPlant.emissions.unadjusted_direct_scope1_kt.toFixed(0)} kt direct chimney Scope 1 CO₂.`
                      }
                    </div>
                  </div>

                  {/* Bullet 2: Physical Hazards (No 'inland kiln' for grinding units) */}
                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-chart-heat mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Physical hazards: </strong>
                      Experiences {selectedPlant.physical_climate_data_bias_aware.days_above_40c_baseline.toFixed(1)} days/yr ≥40°C today (ERA5 reanalysis), reaching {selectedPlant.physical_climate_data_bias_aware.days_above_40c_2040.toFixed(1)} days/yr in 2040 (₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr heat risk). Water supply from {selectedPlant.water_source.toLowerCase()} in {selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.basin_name} entails ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr in curtailment exposure ({selectedPlant.coastal === 'Y' ? `${selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.coastal_lost_days_2040.toFixed(1)} coastal cyclone shutdown days` : selectedPlant.plant_type === 'Grinding unit' ? 'inland grinding facility' : 'inland kiln facility'}).
                    </div>
                  </div>

                  {/* Bullet 3: Transition Risk & CCTS Scenarios */}
                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-chart-water mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Carbon cost: </strong>
                      CCTS today is not computable from the CSV (no FY2023-24 baseline); the upper bound at illustrative rates is ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.baseline_2015_2024.ccts_today_upper_bound_inr_cr_per_year.toFixed(2)} Cr/yr. On direct emissions, the 2040 liability at illustrative rates ({selectedPlant.plant_type === 'Integrated' ? '2.7%' : '6.6%'}) is ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_notified_unadjusted_inr_cr_per_year.toFixed(2)} Cr/yr, rising to ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_unadjusted_inr_cr_per_year.toFixed(2)} Cr/yr under the stretch 10% scenario. The clinker view does not change these values.
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Inputs Used Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                  Inputs used in the calculation
                </h4>
                <div className="rounded-xl border border-oren-line overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-oren-line">
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">Asset value and revenue</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          ₹{selectedPlant.asset_value_inr_cr.toLocaleString()} Cr / ₹{selectedPlant.revenue_fy2025_26_inr_cr.toLocaleString()} Cr
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-oren-muted">Cement capacity and output</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          {selectedPlant.cement_capacity_mtpa.toFixed(1)} MTPA / {selectedPlant.cement_output_fy2025_26_mt.toFixed(2)} Mt
                        </td>
                      </tr>
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">Daily operating EBITDA</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.rates.daily_ebitda_inr_cr_per_day.toFixed(4)} Cr / day (330 days)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-oren-muted">Clinker produced and shipped</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          {selectedPlant.clinker_produced_fy2025_26_mt.toFixed(2)} Mt produced · {selectedPlant.clinker_shipped_fy2025_26_mt.toFixed(2)} Mt shipped
                        </td>
                      </tr>
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">ERA5 baseline (2015–2024)</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          D40: {selectedPlant.physical_climate_data_bias_aware.days_above_40c_baseline.toFixed(1)} d · D43: {selectedPlant.physical_climate_data_bias_aware.days_above_43c_baseline.toFixed(1)} d
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-oren-muted">2040, CMIP6 delta method</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          D40: {selectedPlant.physical_climate_data_bias_aware.days_above_40c_2040.toFixed(1)} d · D43: {selectedPlant.physical_climate_data_bias_aware.days_above_43c_2040.toFixed(1)} d
                        </td>
                      </tr>
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">Flood API discharge (context)</td>
                        <td className="px-4 py-2.5 text-oren-muted tabular-nums text-right">
                          {selectedPlant.physical_climate_data_bias_aware.hydrological_context_flood_api.river_discharge_max_m3s.toFixed(2)} m³/s discharge (contextual only)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drawer Close Button */}
            <div className="pt-6 border-t border-oren-line">
              <button
                onClick={() => setSelectedPlantId(null)}
                className="w-full h-10 rounded-full bg-oren-navy text-white text-sm font-semibold hover:bg-oren-navyDark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer (Unified Product Name) */}
      <footer className="border-t border-oren-line bg-oren-surface py-6 text-xs text-oren-muted mt-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong>Nimbus Climate Exposure Ledger</strong> · For board, auditor and lender review.
          </div>
          <div className="flex items-center gap-4">
            <span>Static data, no live calls</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
