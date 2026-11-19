import React, { useState } from 'react'
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

export default function App() {
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search || window.location.hash.replace(/^#\??/, '')) 
    : new URLSearchParams()
  const [clinkerAdjusted, setClinkerAdjusted] = useState(searchParams.get('clinker') === 'direct' ? false : true)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(searchParams.get('drawer') || null)
  const [activeTab, setActiveTab] = useState<'ledger' | 'assumptions'>(searchParams.get('tab') === 'assumptions' ? 'assumptions' : 'ledger')

  const { portfolio_summary, plants } = data
  const headline = portfolio_summary.headline_exposure_summary_inr_cr_per_year
  const baseline = headline.baseline_2015_2024
  const horizon = headline.horizon_2040
  const attribution = headline.fleet_increase_attribution_baseline_to_2040
  const chartData = headline.chart_stacked_today_vs_2040

  const selectedPlant = plants.find(p => p.plant_id === selectedPlantId) || null

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
      justification: assumptionsData.ccts_transition_risk_assumptions.carbon_price_per_tco2.justification
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
      value: 'Notified averages (integrated 2.7%, grinding 6.6%) vs Stretch 10% (scenario)',
      unit: 'mandated GEI cut',
      status: 'Illustrative Scenario',
      justification: 'Evaluates official notified rates against a 10% stretch scenario. No gazetted target runs to 2040.'
    }
  ]

  return (
    <div className="min-h-screen bg-white text-oren-navy flex flex-col font-sans">
      {/* Top Bar (Unified Product Name: Nimbus Climate Exposure Ledger) */}
      <header className="border-b border-oren-line bg-white sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-oren-navy flex items-center justify-center text-white font-display font-bold text-base shadow-sm">
              N
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-lg text-oren-navy tracking-tight">
                  Nimbus Climate Exposure Ledger
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-oren-soft text-oren-navy font-medium">
                  Meera Iyer · Head of Sustainability
                </span>
              </div>
              <p className="text-xs text-oren-muted">
                Executive Decision Ledger · Physical Climate & Regulatory Transition Intelligence
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
              Download source CSV
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
              Nimbus Climate Exposure Ledger · Executive Briefing
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              What is our business exposure to climate events today and by 2040?
            </h1>
            <p className="text-xs sm:text-sm text-chart-grey font-normal leading-relaxed pt-1">
              Nimbus Cement Ltd · 9 manufacturing plants across India · ₹15,450 Cr gross asset base · 23.00 MTPA capacity · 18.35 Mt annual output.
            </p>
          </div>
        </section>

        {/* Stacked Today vs 2040 Chart (Oren Look and Feel) */}
        <section className="bg-white rounded-card p-6 sm:p-7 border border-oren-line shadow-oren space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-oren-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-oren-teal" />
                <h2 className="text-lg font-display font-bold text-oren-navy">
                  Portfolio Climate Exposure: Today vs 2040
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed">
                  includes assumptions
                </span>
              </div>
              <p className="text-xs text-oren-muted mt-0.5">
                Annual financial exposure in ₹ Crores / year comparing empirical baseline against 2040 projections.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-[#EA9A6E]" /> Heat (API-based)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-[#8CB080]" /> Water & Coastal (Assumption)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-oren-navy">
                <span className="w-3 h-3 rounded-full bg-[#1E2B56]" /> CCTS Carbon (Scenario)
              </span>
            </div>
          </div>

          {/* Stacked Bars Comparison */}
          <div className="space-y-4 pt-1">
            {/* Row 1: Today */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-oren-navy">
                <span className="flex items-center gap-2">
                  <span>Today (2015–2024 Empirical Baseline)</span>
                  <span className="text-xs text-oren-muted font-normal">
                    (CCTS baseline not computable from CSV)
                  </span>
                </span>
                <span className="tabular-nums font-bold text-oren-navy">
                  ₹{chartData.today.total_inr_cr_per_year.toFixed(2)} Cr / yr
                </span>
              </div>
              <div className="h-8 rounded-xl bg-oren-surface flex overflow-hidden border border-oren-line">
                <div
                  style={{ width: `${(chartData.today.heat_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#EA9A6E] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`Extreme Heat: ₹${chartData.today.heat_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.today.heat_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.today.water_coastal_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#8CB080] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`Water & Coastal: ₹${chartData.today.water_coastal_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.today.water_coastal_inr_cr_per_year.toFixed(2)}
                </div>
                <div className="flex-1 bg-oren-surface border-l border-dashed border-oren-line flex items-center px-3 text-xs text-oren-muted italic">
                  CCTS: Not computable from CSV (no FY2023-24 baseline)
                </div>
              </div>
            </div>

            {/* Row 2: 2040 Horizon (Stretch 10% Scenario) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-oren-navy">
                <span className="flex items-center gap-2">
                  <span>2040 Horizon (with Stretch 10% Scenario)</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed">
                    includes assumptions
                  </span>
                </span>
                <span className="tabular-nums font-bold text-oren-navy">
                  ₹{chartData.horizon_2040_stretch_10pct.total_inr_cr_per_year.toFixed(2)} Cr / yr
                </span>
              </div>
              <div className="h-8 rounded-xl bg-oren-surface flex overflow-hidden border border-oren-line">
                <div
                  style={{ width: `${(chartData.horizon_2040_stretch_10pct.heat_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#EA9A6E] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`Extreme Heat: ₹${chartData.horizon_2040_stretch_10pct.heat_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_stretch_10pct.heat_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.horizon_2040_stretch_10pct.water_coastal_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#8CB080] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`Water & Coastal: ₹${chartData.horizon_2040_stretch_10pct.water_coastal_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_stretch_10pct.water_coastal_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.horizon_2040_stretch_10pct.ccts_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#1E2B56] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`CCTS Carbon (10%): ₹${chartData.horizon_2040_stretch_10pct.ccts_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_stretch_10pct.ccts_inr_cr_per_year.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Row 3: 2040 Horizon (Notified Rates Case) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-oren-navy">
                <span className="flex items-center gap-2">
                  <span>2040 Horizon (with Notified Rates: Integrated 2.7%, Grinding 6.6%)</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed">
                    includes assumptions
                  </span>
                </span>
                <span className="tabular-nums font-bold text-oren-navy">
                  ₹{(chartData.horizon_2040_notified_rates.heat_inr_cr_per_year + chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year + (clinkerAdjusted ? headline.horizon_2040.ccts_component_notified_annual_adjusted_inr_cr_per_year : headline.horizon_2040.ccts_component_notified_annual_direct_inr_cr_per_year)).toFixed(2)} Cr / yr
                </span>
              </div>
              <div className="h-8 rounded-xl bg-oren-surface flex overflow-hidden border border-oren-line">
                <div
                  style={{ width: `${(chartData.horizon_2040_notified_rates.heat_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#EA9A6E] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`Extreme Heat: ₹${chartData.horizon_2040_notified_rates.heat_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_notified_rates.heat_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${(chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year / 250) * 100}%` }}
                  className="bg-[#8CB080] h-full flex items-center justify-center text-xs font-bold text-white px-2"
                  title={`Water & Coastal: ₹${chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year.toFixed(2)} Cr/yr`}
                >
                  ₹{chartData.horizon_2040_notified_rates.water_coastal_inr_cr_per_year.toFixed(2)}
                </div>
                <div
                  style={{ width: `${((clinkerAdjusted ? headline.horizon_2040.ccts_component_notified_annual_adjusted_inr_cr_per_year : headline.horizon_2040.ccts_component_notified_annual_direct_inr_cr_per_year) / 250) * 100}%` }}
                  className="bg-[#1E2B56] h-full flex items-center justify-center text-xs font-bold text-white px-2 opacity-90"
                  title={`CCTS Notified: ₹${(clinkerAdjusted ? headline.horizon_2040.ccts_component_notified_annual_adjusted_inr_cr_per_year : headline.horizon_2040.ccts_component_notified_annual_direct_inr_cr_per_year).toFixed(2)} Cr/yr`}
                >
                  ₹{(clinkerAdjusted ? headline.horizon_2040.ccts_component_notified_annual_adjusted_inr_cr_per_year : headline.horizon_2040.ccts_component_notified_annual_direct_inr_cr_per_year).toFixed(2)}
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
                  Physical Risk 01
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-oren-teal border border-oren-teal/20 font-semibold">
                  API-based
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                Extreme heat downtime
              </h2>
              <p className="text-xs text-oren-muted leading-relaxed">
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
                <span className="text-xs font-bold text-[#C87445] bg-[#EA9A6E]/15 px-2 py-0.5 rounded-full tabular-nums">
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
                  Physical Risk 02
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed font-semibold">
                  Assumption
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                Water & coastal curtailment
              </h2>
              <p className="text-xs text-oren-muted leading-relaxed">
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
                <span className="text-xs font-bold text-[#5F8354] bg-[#8CB080]/20 px-2 py-0.5 rounded-full tabular-nums">
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
                  Transition Risk
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed font-semibold">
                  Assumption · Scenario
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                CCTS carbon cost
              </h2>
              <p className="text-xs text-oren-muted leading-relaxed">
                India's Carbon Credit Trading Scheme @ ₹1,500/tCO₂ above plant baseline. No target runs to 2040.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-oren-line space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-oren-muted mb-0.5">Stretch 10% scenario</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-bold text-oren-navy tabular-nums">
                      ₹{horizon.ccts_component_case_10pct_annual_inr_cr_per_year.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-oren-muted">Cr/yr</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-oren-muted mb-0.5">Notified rates (2.7% / 6.6%)</div>
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-2xl font-display font-bold text-oren-navy tabular-nums">
                      ₹{(clinkerAdjusted ? horizon.ccts_component_notified_annual_adjusted_inr_cr_per_year : horizon.ccts_component_notified_annual_direct_inr_cr_per_year).toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-oren-muted">Cr/yr</span>
                  </div>
                </div>
              </div>

              <div className="bg-oren-surface rounded-xl p-2.5 space-y-1 text-xs">
                <div className="font-semibold text-oren-navy">
                  Today: not computable from CSV (no FY2023-24 baseline)
                </div>
                <div className="text-oren-muted">
                  Upper bound at notified averages: ₹{(clinkerAdjusted ? baseline.ccts_upper_bound_at_notified_averages_adjusted_inr_cr_per_year : baseline.ccts_upper_bound_at_notified_averages_inr_cr_per_year).toFixed(2)} Cr/yr
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attribution Banner / Key Takeaway Card */}
        <section className="bg-oren-surface rounded-card p-6 border border-oren-line shadow-oren">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-oren-navy uppercase tracking-wider">
                  Attribution Analysis
                </span>
                <span className="text-xs text-oren-muted">
                  Baseline to 2040 Horizon
                </span>
              </div>
              <p className="text-sm text-oren-navy leading-relaxed font-normal">
                {attribution.statement}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 bg-white rounded-xl p-4 border border-oren-line">
              <div className="space-y-1">
                <div className="text-xs text-oren-muted">Projected net annual increase</div>
                <div className="text-2xl font-display font-bold text-oren-navy tabular-nums">
                  +₹{attribution.delta_total_10pct_inr_cr_per_year.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-oren-muted">Cr / yr</span>
                </div>
              </div>

              <div className="h-10 w-px bg-oren-line hidden sm:block"></div>

              {/* Stacked Proportional Bar */}
              <div className="w-full sm:w-48 space-y-1.5">
                <div className="h-3 rounded-full overflow-hidden flex bg-oren-soft">
                  <div
                    style={{ width: `${attribution.pct_of_increase_from_ccts}%` }}
                    className="bg-oren-navy h-full"
                    title={`Regulatory CCTS: ${attribution.pct_of_increase_from_ccts}%`}
                  />
                  <div
                    style={{ width: `${attribution.pct_of_increase_from_water_coastal}%` }}
                    className="bg-chart-water h-full"
                    title={`Water & Coastal: ${attribution.pct_of_increase_from_water_coastal}%`}
                  />
                  <div
                    style={{ width: `${attribution.pct_of_increase_from_heat}%` }}
                    className="bg-chart-heat h-full"
                    title={`Extreme Heat: ${attribution.pct_of_increase_from_heat}%`}
                  />
                </div>
                <div className="flex justify-between text-xs text-oren-muted tabular-nums">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-oren-navy inline-block" /> CCTS {attribution.pct_of_increase_from_ccts}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-chart-water inline-block" /> Water {attribution.pct_of_increase_from_water_coastal}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-chart-heat inline-block" /> Heat {attribution.pct_of_increase_from_heat}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation & Clinker Toggle Toolbar */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* View Tab Buttons */}
          <div className="inline-flex rounded-full bg-oren-soft p-1 border border-oren-line text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-5 py-2 rounded-full transition-all ${
                activeTab === 'ledger'
                  ? 'bg-gradient-to-r from-oren-navy to-[#1F5F66] text-white shadow-sm'
                  : 'text-oren-muted hover:text-oren-navy'
              }`}
            >
              Asset risk ledger (9 plants)
            </button>
            <button
              onClick={() => setActiveTab('assumptions')}
              className={`px-5 py-2 rounded-full transition-all ${
                activeTab === 'assumptions'
                  ? 'bg-gradient-to-r from-oren-navy to-[#1F5F66] text-white shadow-sm'
                  : 'text-oren-muted hover:text-oren-navy'
              }`}
            >
              Assumptions & audit registry
            </button>
          </div>

          {/* Clinker Segmented Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-oren-muted font-medium">
              <span>Emissions accounting:</span>
            </div>
            <div className="inline-flex rounded-full bg-oren-soft p-1 border border-oren-line text-xs font-semibold">
              <button
                onClick={() => setClinkerAdjusted(false)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  !clinkerAdjusted
                    ? 'bg-oren-navy text-white shadow-sm'
                    : 'text-oren-muted hover:text-oren-navy'
                }`}
              >
                Direct chimney
              </button>
              <button
                onClick={() => setClinkerAdjusted(true)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  clinkerAdjusted
                    ? 'bg-oren-navy text-white shadow-sm'
                    : 'text-oren-muted hover:text-oren-navy'
                }`}
              >
                Clinker-adjusted
              </button>
            </div>
            <div className="text-xs text-oren-muted bg-white px-3 py-1 rounded-full border border-oren-line font-medium tabular-nums">
              Fleet total: <strong className="text-oren-navy">{portfolio_summary.portfolio_totals.total_scope1_co2_kt.toLocaleString()} kt CO₂</strong> (invariant)
            </div>
          </div>
        </section>

        {/* TAB 1: ASSET RISK LEDGER TABLE */}
        {activeTab === 'ledger' && (
          <section className="bg-white rounded-card border border-oren-line shadow-oren overflow-hidden">
            <div className="p-6 border-b border-oren-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-oren-navy">
                  9-Plant Asset Risk Ledger
                </h3>
                <p className="text-xs text-oren-muted mt-0.5">
                  Click any factory row to inspect local physical hazards and transition calculations.
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
              <table className="w-full text-left text-xs text-oren-navy border-collapse">
                <thead className="bg-[#F4F7F8] text-xs font-semibold text-oren-muted uppercase tracking-wider border-b border-oren-line sticky top-[69px] z-20 shadow-sm">
                  <tr>
                    <th scope="col" className="px-4 py-3 min-w-[190px]">
                      Plant & Location
                    </th>
                    <th scope="col" className="px-3 py-3 text-right whitespace-nowrap">
                      Scope 1 (kt)
                      <div className="text-xs font-normal lowercase text-oren-muted">
                        {clinkerAdjusted ? 'clinker-adj' : 'chimney'}
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right bg-orange-50/40 whitespace-nowrap">
                      Heat Today
                      <div className="text-xs font-normal lowercase text-oren-teal">api-based</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right bg-orange-50/40 whitespace-nowrap">
                      Heat 2040
                      <div className="text-xs font-normal lowercase text-oren-teal">api-based</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right bg-green-50/40 whitespace-nowrap">
                      Water Today
                      <div className="text-xs font-normal lowercase text-oren-amber">assumption</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right bg-green-50/40 whitespace-nowrap">
                      Water 2040
                      <div className="text-xs font-normal lowercase text-oren-amber">assumption</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right bg-slate-100 whitespace-nowrap">
                      CCTS Notified
                      <div className="text-xs font-normal lowercase text-oren-amber">2.7% / 6.6%</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right bg-slate-100 whitespace-nowrap">
                      CCTS Stretch
                      <div className="text-xs font-normal lowercase text-oren-amber">10% scenario</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-bold text-oren-navy whitespace-nowrap">
                      2040 Total
                      <div className="text-xs font-semibold text-oren-amber">includes assumptions</div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-bold text-[#C87445] whitespace-nowrap">
                      Annual Δ
                      <div className="text-xs font-normal lowercase text-oren-muted">2040 vs today</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oren-line text-xs">
                  {plants.map((plant) => {
                    const scope1 = clinkerAdjusted
                      ? plant.emissions.clinker_reallocated_scope1_kt
                      : plant.emissions.unadjusted_direct_scope1_kt
                    
                    const heatToday = plant.three_component_financial_exposure_inr_cr_per_year.baseline_2015_2024.heat_component_api_based_inr_cr_per_year
                    const heat2040 = plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.heat_component_api_based_inr_cr_per_year
                    
                    const waterToday = plant.three_component_financial_exposure_inr_cr_per_year.baseline_2015_2024.water_coastal_component_judgement_inr_cr_per_year
                    const water2040 = plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.water_coastal_component_judgement_inr_cr_per_year
                    
                    const cctsNotified = clinkerAdjusted
                      ? plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_notified_adjusted_inr_cr_per_year
                      : plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_notified_unadjusted_inr_cr_per_year
                    
                    const ccts10 = clinkerAdjusted
                      ? plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_adjusted_inr_cr_per_year
                      : plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_unadjusted_inr_cr_per_year
                    
                    const total2040_10 = heat2040 + water2040 + ccts10
                    const netDelta = total2040_10 - (heatToday + waterToday)

                    const isSelected = selectedPlantId === plant.plant_id

                    return (
                      <tr
                        key={plant.plant_id}
                        onClick={() => setSelectedPlantId(isSelected ? null : plant.plant_id)}
                        className={`cursor-pointer transition-colors hover:bg-oren-soft/60 ${
                          isSelected ? 'bg-oren-soft font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-oren-navy flex items-center gap-1.5">
                            {plant.plant_name}
                            {plant.plant_type === 'Grinding unit' && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-oren-soft text-oren-muted border border-oren-line">
                                GU
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-oren-muted mt-0.5">
                            {plant.town}, {plant.state} · ₹{plant.asset_value_inr_cr.toLocaleString()} Cr asset
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-medium text-oren-navy">
                          {scope1.toFixed(1)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums text-oren-navy bg-orange-50/20">
                          ₹{heatToday.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums text-oren-navy font-semibold bg-orange-50/30">
                          ₹{heat2040.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums text-oren-navy bg-green-50/20">
                          ₹{waterToday.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums text-oren-navy font-semibold bg-green-50/30">
                          ₹{water2040.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-oren-navy bg-slate-50/60">
                          ₹{cctsNotified.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums text-oren-muted bg-slate-50/60">
                          ₹{ccts10.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-bold text-oren-navy">
                          ₹{total2040_10.toFixed(2)}
                        </td>

                        <td className="px-3 py-3.5 text-right tabular-nums font-bold text-[#C87445]">
                          +₹{netDelta.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Fleet Summary Reconciled Footer */}
                <tfoot className="bg-[#F4F7F8] font-bold text-oren-navy border-t-2 border-oren-line text-xs">
                  <tr>
                    <td className="px-4 py-3.5">
                      <div>Fleet Total (9 Plants Reconciled)</div>
                      <div className="text-xs font-normal text-oren-muted">
                        Asset base: ₹15,450 Cr · Capacity: 23.00 MTPA
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums">
                      {portfolio_summary.portfolio_totals.total_scope1_co2_kt.toFixed(1)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums bg-orange-50/40">
                      ₹{baseline.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums bg-orange-50/40">
                      ₹{horizon.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums bg-green-50/40">
                      ₹{baseline.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums bg-green-50/40">
                      ₹{horizon.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums bg-slate-100">
                      ₹{(clinkerAdjusted ? horizon.ccts_component_notified_annual_adjusted_inr_cr_per_year : horizon.ccts_component_notified_annual_direct_inr_cr_per_year).toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums bg-slate-100">
                      ₹{horizon.ccts_component_case_10pct_annual_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-oren-navy">
                      ₹{horizon.component_sum_with_10pct_ccts_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right tabular-nums text-[#C87445]">
                      +₹{attribution.delta_total_10pct_inr_cr_per_year.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: ASSUMPTIONS & AUDIT REGISTRY */}
        {activeTab === 'assumptions' && (
          <section className="bg-white rounded-card border border-oren-line shadow-oren p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-oren-line pb-4">
              <div>
                <h3 className="text-xl font-display font-bold text-oren-navy">
                  Assumptions & Methodology Registry
                </h3>
                <p className="text-xs text-oren-muted mt-1">
                  Every parameter, empirical data source, and expert judgement entry is registered here with its audit status.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-oren-soft text-oren-navy border border-oren-line">
                Audited Parameters
              </span>
            </div>

            {/* General & Financial Assumptions Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-display font-bold text-oren-navy uppercase tracking-wider">
                Financial, Operational & Regulatory Parameters
              </h4>
              <div className="overflow-x-auto rounded-xl border border-oren-line">
                <table className="w-full text-left text-xs text-oren-navy">
                  <thead className="bg-oren-surface text-oren-muted font-semibold uppercase tracking-wider border-b border-oren-line">
                    <tr>
                      <th className="px-4 py-3">Parameter</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Audit Source / Justification</th>
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
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              (param.status || '').includes('API') || (param.status || '').includes('historical') || (param.status || '').includes('Model')
                                ? 'bg-teal-50 text-oren-teal border border-oren-teal/20'
                                : 'bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed'
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
                  Site-Level Physical Water & Coastal Days
                </h4>
                <span className="text-xs text-oren-amber font-semibold bg-oren-amberBg px-2.5 py-0.5 rounded-full border border-oren-amber/40 border-dashed">
                  Label: judgement, not sourced
                </span>
              </div>
              <p className="text-xs text-oren-muted">
                Expert judgement documentation: all basin water stress scores, basin names, and downtime days are documented as expert judgement without unverified external agency claims.
              </p>
              <div className="overflow-x-auto rounded-xl border border-oren-line">
                <table className="w-full text-left text-xs text-oren-navy">
                  <thead className="bg-oren-surface text-oren-muted font-semibold uppercase tracking-wider border-b border-oren-line">
                    <tr>
                      <th className="px-4 py-3">Plant ID</th>
                      <th className="px-4 py-3">Plant Name</th>
                      <th className="px-4 py-3">Water Source</th>
                      <th className="px-4 py-3">Basin Name</th>
                      <th className="px-4 py-3 text-right">Water Lost (Today)</th>
                      <th className="px-4 py-3 text-right">Water Lost (2040)</th>
                      <th className="px-4 py-3 text-right">Coastal Lost (Today)</th>
                      <th className="px-4 py-3 text-right">Coastal Lost (2040)</th>
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
                            <span className="text-xs px-2 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed">
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
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-oren-soft text-oren-navy font-bold">
                      {selectedPlant.plant_id}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-oren-surface text-oren-muted border border-oren-line">
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
                    Executive Briefing & Diagnosis
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-oren-soft text-oren-navy">
                    {clinkerAdjusted ? 'Clinker-adjusted view' : 'Direct chimney view'}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-oren-navy leading-relaxed bg-oren-surface p-4 rounded-xl border border-oren-line">
                  {/* Bullet 1: Operations & Emissions (Following Toggle) */}
                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-oren-navy mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Operations & Scope 1: </strong>
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
                      <strong className="font-semibold">Physical Climate Hazards: </strong>
                      Experiences {selectedPlant.physical_climate_data_bias_aware.days_above_40c_baseline.toFixed(1)} days/yr ≥40°C today (ERA5 reanalysis), reaching {selectedPlant.physical_climate_data_bias_aware.days_above_40c_2040.toFixed(1)} days/yr in 2040 (₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr heat risk). Water supply from {selectedPlant.water_source.toLowerCase()} in {selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.basin_name} entails ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr in curtailment exposure ({selectedPlant.coastal === 'Y' ? `${selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.coastal_lost_days_2040.toFixed(1)} coastal cyclone shutdown days` : selectedPlant.plant_type === 'Grinding unit' ? 'inland grinding facility' : 'inland kiln facility'}).
                    </div>
                  </div>

                  {/* Bullet 3: Transition Risk & CCTS Scenarios */}
                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-chart-water mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Regulatory Transition: </strong>
                      CCTS baseline penalty today is not computable from CSV. Under notified rates ({selectedPlant.plant_type === 'Integrated' ? '2.7%' : '6.6%'}), liability is ₹{(clinkerAdjusted ? selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_notified_adjusted_inr_cr_per_year : selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_notified_unadjusted_inr_cr_per_year).toFixed(2)} Cr/yr, rising to ₹{(clinkerAdjusted ? selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_adjusted_inr_cr_per_year : selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_unadjusted_inr_cr_per_year).toFixed(2)} Cr/yr under the stretch 10% scenario.
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Inputs Used Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                  Inputs Used in Calculation
                </h4>
                <div className="rounded-xl border border-oren-line overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-oren-line">
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">Asset Value & Revenue</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          ₹{selectedPlant.asset_value_inr_cr.toLocaleString()} Cr / ₹{selectedPlant.revenue_fy2025_26_inr_cr.toLocaleString()} Cr
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-oren-muted">Cement Capacity & Output</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          {selectedPlant.cement_capacity_mtpa.toFixed(1)} MTPA / {selectedPlant.cement_output_fy2025_26_mt.toFixed(2)} Mt
                        </td>
                      </tr>
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">Daily Operating EBITDA</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.rates.daily_ebitda_inr_cr_per_day.toFixed(4)} Cr / day (330 days)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-oren-muted">Clinker Production & Rail Shipments</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          {selectedPlant.clinker_produced_fy2025_26_mt.toFixed(2)} Mt produced · {selectedPlant.clinker_shipped_fy2025_26_mt.toFixed(2)} Mt shipped
                        </td>
                      </tr>
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">ERA5 Empirical Baseline (2015–2024)</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          D40: {selectedPlant.physical_climate_data_bias_aware.days_above_40c_baseline.toFixed(1)} d · D43: {selectedPlant.physical_climate_data_bias_aware.days_above_43c_baseline.toFixed(1)} d
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-oren-muted">CMIP6 2040 Delta Method</td>
                        <td className="px-4 py-2.5 font-semibold text-oren-navy tabular-nums text-right">
                          D40: {selectedPlant.physical_climate_data_bias_aware.days_above_40c_2040.toFixed(1)} d · D43: {selectedPlant.physical_climate_data_bias_aware.days_above_43c_2040.toFixed(1)} d
                        </td>
                      </tr>
                      <tr className="bg-oren-surface">
                        <td className="px-4 py-2.5 text-oren-muted">Hydrological Context (Flood API)</td>
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
                className="w-full py-2.5 rounded-full bg-oren-navy text-white text-xs font-semibold hover:bg-oren-navyDark transition-colors"
              >
                Close Plant Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer (Unified Product Name) */}
      <footer className="border-t border-oren-line bg-oren-surface py-6 text-xs text-oren-muted mt-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong>Nimbus Climate Exposure Ledger</strong> · Designed for Board & Institutional Decision Support.
          </div>
          <div className="flex items-center gap-4">
            <span>Deterministic JSON Data Contract</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
