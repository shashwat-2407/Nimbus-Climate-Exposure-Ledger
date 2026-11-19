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
  Waves
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

  const selectedPlant = plants.find(p => p.plant_id === selectedPlantId) || null

  const handleDownloadCSV = () => {
    const headers = [
      'plant_id',
      'plant_name',
      'town',
      'state',
      'latitude',
      'longitude',
      'plant_type',
      'cement_capacity_mtpa',
      'cement_output_fy2025_26_mt',
      'clinker_produced_fy2025_26_mt',
      'clinker_shipped_fy2025_26_mt',
      'scope1_co2_fy2025_26_kt',
      'water_source',
      'coastal',
      'asset_value_inr_cr',
      'revenue_fy2025_26_inr_cr',
      'employees',
      'notes'
    ]
    const rows = plants.map(p => [
      p.plant_id,
      `"${p.plant_name}"`,
      p.town,
      p.state,
      p.latitude,
      p.longitude,
      `"${p.plant_type}"`,
      p.cement_capacity_mtpa.toFixed(1),
      p.cement_output_fy2025_26_mt.toFixed(2),
      p.clinker_produced_fy2025_26_mt.toFixed(2),
      p.clinker_shipped_fy2025_26_mt.toFixed(2),
      p.emissions.unadjusted_direct_scope1_kt.toFixed(0),
      `"${p.water_source}"`,
      p.coastal,
      p.asset_value_inr_cr.toFixed(0),
      p.revenue_fy2025_26_inr_cr.toFixed(0),
      p.employees,
      `"${p.notes || ''}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'nimbus_cement_plants.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      justification: 'Kiln refractory maintenance, captive quarry safety curtailment, and equipment cooling derating'
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
      value: '₹0.00 Cr / yr (Today)',
      unit: 'baseline penalty',
      status: assumptionsData.ccts_transition_risk_assumptions.baseline_penalty_status.source_status,
      justification: assumptionsData.ccts_transition_risk_assumptions.baseline_penalty_status.justification
    },
    {
      parameter: 'CCTS Reduction Targets',
      value: '3% (lower bound) vs 10% (headline)',
      unit: 'mandated GEI cut',
      status: assumptionsData.ccts_transition_risk_assumptions.ccts_scenarios_evaluated.source_status,
      justification: assumptionsData.ccts_transition_risk_assumptions.ccts_scenarios_evaluated.justification
    }
  ]

  return (
    <div className="min-h-screen bg-white text-oren-navy flex flex-col font-sans">
      {/* Top Bar (White with Navy bold wordmark, download pill, no fake nav) */}
      <header className="border-b border-oren-line bg-white sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-oren-navy flex items-center justify-center text-white font-display font-bold text-base shadow-sm">
              N
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-lg text-oren-navy tracking-tight">
                  Nimbus Climate Exposure
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-oren-soft text-oren-navy font-medium">
                  Meera Iyer · Head of Sustainability
                </span>
              </div>
              <p className="text-xs text-oren-muted">
                Executive Decision Ledger · SEBI BRSR Core & Board Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-oren-soft text-oren-navy hover:bg-oren-line transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-oren-teal" />
              Download source CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Header Hero Band (Dark teal rounded card with question in white) */}
        <section className="bg-gradient-to-r from-oren-deep to-oren-navy text-white rounded-hero p-8 sm:p-10 shadow-oren relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <span className="text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 inline-block">
              Board of Directors & Investor Climate Briefing
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
              What is our business exposure to climate events today and by 2040?
            </h1>
            <p className="text-sm sm:text-base text-chart-grey font-normal leading-relaxed pt-1">
              Nimbus Cement Ltd · 9 manufacturing plants across India · ₹15,450 Cr gross asset base · 23.00 MTPA capacity · 18.35 Mt annual output.
            </p>
          </div>
        </section>

        {/* Three KPI Cards (Heat, Water & Coastal, CCTS) */}
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
                  <span className="text-sm font-medium text-oren-muted">₹ Cr / yr</span>
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
                  <span className="text-sm font-medium text-oren-muted">₹ Cr / yr</span>
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
                  Assumption, illustrative
                </span>
              </div>
              <h2 className="text-xl font-display font-bold text-oren-navy">
                CCTS carbon cost
              </h2>
              <p className="text-xs text-oren-muted leading-relaxed">
                Projected penalty under India's Carbon Credit Trading Scheme @ ₹1,500/tCO₂ above baseline.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-oren-line space-y-4">
              <div>
                <div className="text-xs text-oren-muted mb-1">2040 liability (10% cut case)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-oren-navy tabular-nums">
                    ₹{horizon.ccts_component_case_10pct_annual_inr_cr_per_year.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-oren-muted">₹ Cr / yr</span>
                </div>
              </div>

              <div className="bg-oren-surface rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-oren-muted">3% cut lower case: </span>
                  <span className="font-semibold text-oren-navy tabular-nums">
                    ₹{horizon.ccts_component_case_3pct_annual_inr_cr_per_year.toFixed(2)} Cr/yr
                  </span>
                </div>
                <span className="text-xs text-oren-muted">
                  Today: ₹0.00 Cr/yr*
                </span>
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
                    title={`Regulatory CCTS: ${attribution.pct_of_increase_from_ccts.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${attribution.pct_of_increase_from_water_coastal}%` }}
                    className="bg-chart-water h-full"
                    title={`Water & Coastal: ${attribution.pct_of_increase_from_water_coastal.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${attribution.pct_of_increase_from_heat}%` }}
                    className="bg-chart-heat h-full"
                    title={`Extreme Heat: ${attribution.pct_of_increase_from_heat.toFixed(1)}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-oren-muted tabular-nums">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-oren-navy inline-block" /> CCTS 83.3%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-chart-water inline-block" /> Water 13.8%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-chart-heat inline-block" /> Heat 2.9%
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
              Fleet total: <strong className="text-oren-navy">10,932 kt CO₂</strong> (invariant)
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
              <div className="flex items-center gap-2 text-xs text-oren-muted">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-50 border border-oren-teal"></span>
                <span>API-based</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-oren-amberBg border border-oren-amber border-dashed ml-3"></span>
                <span>Assumption</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-oren-navy">
                <thead className="bg-oren-surface text-xs font-semibold text-oren-muted uppercase tracking-wider border-b border-oren-line sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Plant & Location</th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      Scope 1 CO₂
                      <div className="text-[10px] font-normal lowercase text-oren-muted">
                        {clinkerAdjusted ? 'clinker-adj (kt)' : 'chimney (kt)'}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-orange-50/40">
                      Heat Today
                      <div className="text-[10px] font-normal lowercase text-oren-teal">api-based (₹ Cr/yr)</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-orange-50/40">
                      Heat 2040
                      <div className="text-[10px] font-normal lowercase text-oren-teal">api-based (₹ Cr/yr)</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-green-50/40">
                      Water Today
                      <div className="text-[10px] font-normal lowercase text-oren-amber">assumption (₹ Cr/yr)</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-green-50/40">
                      Water 2040
                      <div className="text-[10px] font-normal lowercase text-oren-amber">assumption (₹ Cr/yr)</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-slate-50">
                      CCTS 2040 (10%)
                      <div className="text-[10px] font-normal lowercase text-oren-amber">assumption (₹ Cr/yr)</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right bg-slate-50">
                      CCTS 2040 (3%)
                      <div className="text-[10px] font-normal lowercase text-oren-amber">assumption (₹ Cr/yr)</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right font-bold text-oren-navy">
                      2040 Total (10%)
                      <div className="text-[10px] font-normal lowercase text-oren-muted">decoupled sum</div>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right font-bold text-[#C87445]">
                      Annual Δ
                      <div className="text-[10px] font-normal lowercase text-oren-muted">2040 vs today</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-oren-line text-sm">
                  {plants.map((plant) => {
                    const scope1 = clinkerAdjusted
                      ? plant.emissions.clinker_reallocated_scope1_kt
                      : plant.emissions.unadjusted_direct_scope1_kt
                    
                    const heatToday = plant.three_component_financial_exposure_inr_cr_per_year.baseline_2015_2024.heat_component_api_based_inr_cr_per_year
                    const heat2040 = plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.heat_component_api_based_inr_cr_per_year
                    
                    const waterToday = plant.three_component_financial_exposure_inr_cr_per_year.baseline_2015_2024.water_coastal_component_judgement_inr_cr_per_year
                    const water2040 = plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.water_coastal_component_judgement_inr_cr_per_year
                    
                    const ccts10 = clinkerAdjusted
                      ? plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_adjusted_inr_cr_per_year
                      : plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_unadjusted_inr_cr_per_year
                    
                    const ccts3 = clinkerAdjusted
                      ? plant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_3pct_adjusted_inr_cr_per_year
                      : (plant.emissions.unadjusted_direct_scope1_kt * 1000 * 0.03 * 1500) / 1e7
                    
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
                        <td className="px-5 py-4">
                          <div className="font-semibold text-oren-navy flex items-center gap-1.5">
                            {plant.plant_name}
                            {plant.plant_type === 'Grinding unit' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-oren-soft text-oren-muted border border-oren-line">
                                GU
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-oren-muted mt-0.5">
                            {plant.town}, {plant.state} · ₹{plant.asset_value_inr_cr.toLocaleString()} Cr asset
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums font-medium text-oren-navy">
                          {scope1.toFixed(1)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums text-oren-navy bg-orange-50/20">
                          ₹{heatToday.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums text-oren-navy font-semibold bg-orange-50/30">
                          ₹{heat2040.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums text-oren-navy bg-green-50/20">
                          ₹{waterToday.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums text-oren-navy font-semibold bg-green-50/30">
                          ₹{water2040.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-oren-navy bg-slate-50/50">
                          ₹{ccts10.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums text-oren-muted bg-slate-50/50">
                          ₹{ccts3.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums font-bold text-oren-navy">
                          ₹{total2040_10.toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums font-bold text-[#C87445]">
                          +₹{netDelta.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Fleet Summary Reconciled Footer */}
                <tfoot className="bg-oren-surface font-bold text-oren-navy border-t-2 border-oren-line text-sm">
                  <tr>
                    <td className="px-5 py-4">
                      <div>Fleet Total (9 Plants Reconciled)</div>
                      <div className="text-xs font-normal text-oren-muted">
                        Asset base: ₹15,450 Cr · Capacity: 23.00 MTPA
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      10,932.0
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums bg-orange-50/40">
                      ₹{baseline.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums bg-orange-50/40">
                      ₹{horizon.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums bg-green-50/40">
                      ₹{baseline.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums bg-green-50/40">
                      ₹{horizon.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums bg-slate-100">
                      ₹{horizon.ccts_component_case_10pct_annual_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums bg-slate-100">
                      ₹{horizon.ccts_component_case_3pct_annual_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-oren-navy">
                      ₹{horizon.component_sum_with_10pct_ccts_inr_cr_per_year.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-[#C87445]">
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
                  Assumptions & Audit Registry (SEBI BRSR Compliance)
                </h3>
                <p className="text-xs text-oren-muted mt-1">
                  Every parameter, empirical data source, and expert judgement entry is registered here with its audit status.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-oren-soft text-oren-navy border border-oren-line">
                v4.0 Final Audited
              </span>
            </div>

            {/* General & Financial Assumptions Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-display font-bold text-oren-navy uppercase tracking-wider">
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
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
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
                <h4 className="text-sm font-display font-bold text-oren-navy uppercase tracking-wider">
                  Site-Level Physical Water & Coastal Days
                </h4>
                <span className="text-xs text-oren-amber font-semibold bg-oren-amberBg px-2.5 py-0.5 rounded-full border border-oren-amber/40 border-dashed">
                  Label: judgement, not sourced
                </span>
              </div>
              <p className="text-xs text-oren-muted">
                Per user audit directive, all basin water stress scores, basin names, and downtime days are documented as expert judgement without unverified external agency claims.
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
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-oren-amberBg text-oren-amber border border-oren-amber/40 border-dashed">
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

              {/* Three Plain English Bullets */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-oren-muted uppercase tracking-wider">
                  Executive Briefing & Diagnosis
                </h4>
                <div className="space-y-2.5 text-xs sm:text-sm text-oren-navy leading-relaxed bg-oren-surface p-4 rounded-xl border border-oren-line">
                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-chart-heat mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Heat Stress & Quarry Hazards: </strong>
                      Experiences {selectedPlant.physical_climate_data_bias_aware.days_above_40c_baseline.toFixed(1)} days/yr ≥40°C today (ERA5 reanalysis), projected to {selectedPlant.physical_climate_data_bias_aware.days_above_40c_2040.toFixed(1)} days/yr in 2040 ({selectedPlant.physical_climate_data_bias_aware.days_above_40c_trend_note}). Heat downtime financial impact grows to ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-chart-water mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">Water Source Curtailment: </strong>
                      Relies on {selectedPlant.water_source.toLowerCase()} in {selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.basin_name}. Projected to face {selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.water_lost_days_2040.toFixed(1)} water-lost days/yr in 2040 ({selectedPlant.coastal === 'Y' ? `plus ${selectedPlant.physical_climate_data_bias_aware.water_and_coastal_assessment.coastal_lost_days_2040.toFixed(1)} coastal shutdown days` : 'inland kiln'}), generating ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr in operating margin curtailment (assumption).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-oren-navy mt-1.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold">CCTS Regulatory Compliance: </strong>
                      Emits {selectedPlant.emissions.unadjusted_direct_scope1_kt.toFixed(0)} kt direct Scope 1 CO₂ ({selectedPlant.emissions.clinker_reallocated_scope1_kt.toFixed(0)} kt clinker-adjusted). Under a 10% emission intensity reduction target @ ₹1,500/tCO₂, annual carbon liability is projected at ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_10pct_adjusted_inr_cr_per_year.toFixed(2)} Cr/yr (or ₹{selectedPlant.three_component_financial_exposure_inr_cr_per_year.horizon_2040.ccts_component_case_3pct_adjusted_inr_cr_per_year.toFixed(2)} Cr/yr at 3% cut).
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

      {/* Footer */}
      <footer className="border-t border-oren-line bg-oren-surface py-6 text-xs text-oren-muted mt-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong>Nimbus Climate Exposure Decision Ledger</strong> · Designed for Board, SEBI BRSR Core & Institutional Due Diligence.
          </div>
          <div className="flex items-center gap-4">
            <span>Deterministic JSON Data Contract</span>
            <span>·</span>
            <span>Zero Client-Side Simulation</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
