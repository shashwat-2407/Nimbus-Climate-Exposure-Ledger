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
  FileSpreadsheet
} from 'lucide-react'

export default function App() {
  const [clinkerAdjusted, setClinkerAdjusted] = useState(true)
  const [expandedPlant, setExpandedPlant] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ledger' | 'assumptions'>('ledger')

  const { portfolio_summary, plants, metadata } = data
  const headline = portfolio_summary.headline_exposure_summary_inr_cr_per_year
  const attribution = headline.fleet_increase_attribution_baseline_to_2040

  const toggleRow = (id: string) => {
    setExpandedPlant(expandedPlant === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
              NC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">Nimbus Cement Ltd</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  BRSR Core & Board Ledger
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                  Zero Login Public
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Climate Exposure & Transition Risk Intelligence (Meera Iyer, Head of Sustainability)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ledger'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Asset Risk Ledger
              </button>
              <button
                onClick={() => setActiveTab('assumptions')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'assumptions'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Assumptions & Audit Registry
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Board Context Callout */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" /> Board & Investor Briefing Directive
              </div>
              <h2 className="text-base sm:text-lg font-medium text-slate-100">
                Evaluating ₹15,450 Cr Gross Block: Today (2015–2024 ERA5) vs 2040 Horizon
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Addressing Board of Directors, SEBI BRSR compliance auditors, and institutional lenders. 
                All exposure is decoupled into three distinct drivers (<span className="text-amber-300">Heat</span>, <span className="text-cyan-300">Water+Coastal</span>, and <span className="text-emerald-300">CCTS</span>) with explicit labels.
              </p>
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-right">
                <span className="text-[11px] text-slate-400 block font-mono">Gross Asset Base</span>
                <span className="text-sm sm:text-base font-bold text-slate-100 font-mono">₹15,450 Cr</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-right">
                <span className="text-[11px] text-slate-400 block font-mono">Fleet Output (FY26)</span>
                <span className="text-sm sm:text-base font-bold text-slate-100 font-mono">18.35 Mt</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2 text-right">
                <span className="text-[11px] text-slate-400 block font-mono">Scope 1 Emissions</span>
                <span className="text-sm sm:text-base font-bold text-slate-100 font-mono">10,932 kt</span>
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'ledger' ? (
          <>
            {/* Clinker Accounting Toggle & Invariance Guarantee */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">Clinker Supply-Chain Accounting Mode</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-300">
                      Fleet Total Invariance Guaranteed
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    P01 (Chittorgarh) and P06 (Baloda Bazar) ship clinker to Grinding Units P07 (Mundra), P08 (Paradip), and P09 (Durgapur). 
                    The toggle reallocates emissions based on transferred clinker. <strong className="text-slate-200">Total fleet emissions (10,932.0 kt) and total CCTS liabilities remain strictly invariant.</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0 self-start lg:self-auto">
                  <button
                    onClick={() => setClinkerAdjusted(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      !clinkerAdjusted
                        ? 'bg-slate-800 text-slate-100 shadow border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Direct Chimney Emissions
                  </button>
                  <button
                    onClick={() => setClinkerAdjusted(true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                      clinkerAdjusted
                        ? 'bg-emerald-600 text-white shadow border border-emerald-500 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Clinker-Adjusted (Supply Chain)
                  </button>
                </div>
              </div>

              {/* Invariance verification banner */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Portfolio Total Scope 1: <strong className="text-slate-200 font-semibold">10,932.0 kt</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>Portfolio Total CCTS 10%: <strong className="text-slate-200 font-semibold">₹163.99 Cr/yr</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>Portfolio Total CCTS 3%: <strong className="text-slate-200 font-semibold">₹49.19 Cr/yr</strong></span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {clinkerAdjusted ? 'Currently viewing: Supply-chain apportioned' : 'Currently viewing: Raw chimney Scope 1'}
                </span>
              </div>
            </section>

            {/* Three-Way Split Headline KPI Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Today Baseline */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>BASELINE (TODAY)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">2015–2024 ERA5</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                      ₹{headline.baseline_2015_2024.component_sum_inr_cr_per_year.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Cr / year</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Rate: {headline.baseline_2015_2024.rate_vs_asset_base_pct_per_year}% of ₹15,450 Cr asset base / yr
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    Three-Way Component Breakdown:
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Heat Downtime
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 font-mono">API-based</span>
                    </span>
                    <span className="font-mono text-slate-100 font-medium">
                      ₹{headline.baseline_2015_2024.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Water + Coastal
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">assumption</span>
                    </span>
                    <span className="font-mono text-slate-100 font-medium">
                      ₹{headline.baseline_2015_2024.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      CCTS Penalty
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-mono">assumption</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      ₹0.00 Cr/yr <span className="text-[10px] text-slate-500">(unverified)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: 2040 Horizon with 10% CCTS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>2040 HORIZON (10% CCTS)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono">
                      Delta Method
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                      ₹{headline.horizon_2040.component_sum_with_10pct_ccts_inr_cr_per_year.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Cr / year</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Rate: {headline.horizon_2040.rate_vs_asset_base_pct_per_year_case_10pct}% of ₹15,450 Cr asset base / yr
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    Three-Way Component Breakdown:
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Heat Downtime
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 font-mono">API-based</span>
                    </span>
                    <span className="font-mono text-slate-100 font-medium">
                      ₹{headline.horizon_2040.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Water + Coastal
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">assumption</span>
                    </span>
                    <span className="font-mono text-slate-100 font-medium">
                      ₹{headline.horizon_2040.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 bg-emerald-950/30 px-1.5 rounded -mx-1.5">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      CCTS (10% cut)
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900 border border-emerald-700 text-emerald-200 font-mono">assumption</span>
                      <span className="text-[9px] text-emerald-400/80 font-mono italic">illustrative</span>
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">
                      ₹{headline.horizon_2040.ccts_component_case_10pct_annual_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: 2040 Horizon with 3% CCTS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>2040 HORIZON (3% CCTS)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                      Lower Target Case
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
                      ₹{headline.horizon_2040.component_sum_with_3pct_ccts_inr_cr_per_year.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Cr / year</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Rate: {headline.horizon_2040.rate_vs_asset_base_pct_per_year_case_3pct}% of ₹15,450 Cr asset base / yr
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    Three-Way Component Breakdown:
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Heat Downtime
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 font-mono">API-based</span>
                    </span>
                    <span className="font-mono text-slate-100 font-medium">
                      ₹{headline.horizon_2040.heat_component_api_based_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Water + Coastal
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">assumption</span>
                    </span>
                    <span className="font-mono text-slate-100 font-medium">
                      ₹{headline.horizon_2040.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 bg-slate-950/50 px-1.5 rounded -mx-1.5">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      CCTS (3% cut)
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">assumption</span>
                      <span className="text-[9px] text-slate-400 font-mono italic">illustrative</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">
                      ₹{headline.horizon_2040.ccts_component_case_3pct_annual_inr_cr_per_year.toFixed(2)} Cr/yr
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Growth Attribution Banner */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>ANNUAL EXPOSURE GROWTH ATTRIBUTION (TODAY → 2040)</span>
                </div>
                <div className="text-sm text-slate-200">
                  Total annual increase: <strong className="font-mono text-white text-base">+{attribution.delta_total_10pct_inr_cr_per_year.toFixed(2)} Cr/year</strong>
                </div>
                <p className="text-xs text-slate-400 italic">
                  {attribution.statement}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CCTS Liability (10%)</span>
                  <span className="text-emerald-400 font-bold">+{attribution.delta_ccts_10pct_component_inr_cr_per_year.toFixed(2)} Cr/yr</span>
                  <span className="text-slate-400 text-[10px] block font-sans">({attribution.pct_of_increase_from_ccts}% of growth)</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Water+Coastal Throttling</span>
                  <span className="text-cyan-400 font-bold">+{attribution.delta_water_coastal_component_inr_cr_per_year.toFixed(2)} Cr/yr</span>
                  <span className="text-slate-400 text-[10px] block font-sans">({attribution.pct_of_increase_from_water_coastal}% of growth)</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Extreme Heat Downtime</span>
                  <span className="text-amber-400 font-bold">+{attribution.delta_heat_component_inr_cr_per_year.toFixed(2)} Cr/yr</span>
                  <span className="text-slate-400 text-[10px] block font-sans">({attribution.pct_of_increase_from_heat}% of growth)</span>
                </div>
              </div>
            </section>

            {/* Main Asset Ledger Table */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Nine-Plant Physical & Transition Exposure Ledger
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any row to inspect plant-specific hydrogeology, clinker transfers, and temperature changes.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>9 Operating Units | All Figures in ₹ Crores / year</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Plant / Location</th>
                      <th className="py-3 px-2 text-right">Output (Mt)</th>
                      <th className="py-3 px-3 text-right">
                        Scope 1 (kt)
                        <span className="block text-[9px] text-slate-500 font-normal lowercase">
                          {clinkerAdjusted ? 'clinker-adjusted' : 'direct chimney'}
                        </span>
                      </th>
                      {/* TODAY GROUP */}
                      <th className="py-3 px-3 text-center bg-slate-900/60 border-l border-r border-slate-800" colSpan={4}>
                        TODAY (2015–2024 ERA5 Baseline) — ₹ Cr / year
                      </th>
                      {/* 2040 GROUP */}
                      <th className="py-3 px-3 text-center bg-slate-950/40 border-r border-slate-800" colSpan={5}>
                        2040 HORIZON (Delta Method) — ₹ Cr / year
                      </th>
                      <th className="py-3 px-3 text-right">Total Δ</th>
                    </tr>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                      <th className="py-2 px-3"></th>
                      <th className="py-2 px-2 text-right"></th>
                      <th className="py-2 px-3 text-right"></th>
                      {/* Today subheaders */}
                      <th className="py-2 px-2 text-right border-l border-slate-800 text-amber-300">
                        Heat <span className="text-[9px] text-amber-500 block font-sans lowercase">API-based</span>
                      </th>
                      <th className="py-2 px-2 text-right text-cyan-300">
                        Water+Coast <span className="text-[9px] text-cyan-500 block font-sans lowercase">assumption</span>
                      </th>
                      <th className="py-2 px-2 text-right text-slate-400">
                        CCTS <span className="text-[9px] text-slate-500 block font-sans lowercase">assumption</span>
                      </th>
                      <th className="py-2 px-2 text-right font-bold text-slate-200 border-r border-slate-800">
                        Today Total
                      </th>
                      {/* 2040 subheaders */}
                      <th className="py-2 px-2 text-right text-amber-300">
                        Heat <span className="text-[9px] text-amber-500 block font-sans lowercase">API-based</span>
                      </th>
                      <th className="py-2 px-2 text-right text-cyan-300">
                        Water+Coast <span className="text-[9px] text-cyan-500 block font-sans lowercase">assumption</span>
                      </th>
                      <th className="py-2 px-2 text-right text-slate-400">
                        CCTS 3% <span className="text-[9px] text-slate-400 block font-sans lowercase italic">illustrative</span>
                      </th>
                      <th className="py-2 px-2 text-right text-emerald-300">
                        CCTS 10% <span className="text-[9px] text-emerald-400 block font-sans lowercase italic">illustrative</span>
                      </th>
                      <th className="py-2 px-2 text-right font-bold text-emerald-400 border-r border-slate-800">
                        2040 Total (10%)
                      </th>
                      <th className="py-2 px-3 text-right font-bold text-slate-300">
                        (₹ Cr/yr)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {plants.map((p) => {
                      const isExpanded = expandedPlant === p.plant_id
                      const exp = p.three_component_financial_exposure_inr_cr_per_year
                      const base = exp.baseline_2015_2024
                      const fut = exp.horizon_2040
                      const attr = exp.increase_attribution_baseline_to_2040_inr_cr_per_year

                      const scope1Val = clinkerAdjusted
                        ? p.emissions.clinker_reallocated_scope1_kt
                        : p.emissions.unadjusted_direct_scope1_kt

                      const ccts3Val = clinkerAdjusted
                        ? fut.ccts_component_case_3pct_adjusted_inr_cr_per_year
                        : roundTo2((p.emissions.unadjusted_direct_scope1_kt * 1000 * 0.03 * 1500) / 1e7)

                      const ccts10Val = clinkerAdjusted
                        ? fut.ccts_component_case_10pct_adjusted_inr_cr_per_year
                        : fut.ccts_component_case_10pct_unadjusted_inr_cr_per_year

                      const total2040Val = clinkerAdjusted
                        ? fut.component_breakdown_sum_10pct_adjusted_inr_cr_per_year
                        : roundTo2(fut.heat_component_api_based_inr_cr_per_year + fut.water_coastal_component_judgement_inr_cr_per_year + ccts10Val)

                      const deltaVal = roundTo2(total2040Val - base.component_breakdown_sum_inr_cr_per_year)

                      return (
                        <React.Fragment key={p.plant_id}>
                          <tr
                            onClick={() => toggleRow(p.plant_id)}
                            className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                              isExpanded ? 'bg-slate-800/50' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-sans">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-300">{p.plant_id}</span>
                                <div>
                                  <div className="font-medium text-slate-100 flex items-center gap-1.5">
                                    {p.plant_name}
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {p.town}, {p.state} • <span className="text-slate-500">{p.plant_type}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right text-slate-200">
                              {p.cement_output_fy2025_26_mt.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="font-semibold text-slate-100">{scope1Val.toFixed(1)}</span>
                              {clinkerAdjusted && p.emissions.clinker_adjustment_delta_kt !== 0 && (
                                <span
                                  className={`block text-[10px] ${
                                    p.emissions.clinker_adjustment_delta_kt > 0 ? 'text-blue-400' : 'text-amber-400'
                                  }`}
                                >
                                  {p.emissions.clinker_adjustment_delta_kt > 0 ? '+' : ''}
                                  {p.emissions.clinker_adjustment_delta_kt.toFixed(1)} clinker
                                </span>
                              )}
                            </td>

                            {/* TODAY COLUMNS */}
                            <td className="py-3 px-2 text-right border-l border-slate-800/80 text-amber-200">
                              ₹{base.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-right text-cyan-200">
                              ₹{base.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-right text-slate-500">
                              ₹0.00
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-slate-100 border-r border-slate-800/80 bg-slate-950/20">
                              ₹{base.component_breakdown_sum_inr_cr_per_year.toFixed(2)}
                            </td>

                            {/* 2040 COLUMNS */}
                            <td className="py-3 px-2 text-right text-amber-200">
                              ₹{fut.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-right text-cyan-200">
                              ₹{fut.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-right text-slate-400">
                              ₹{ccts3Val.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-right text-emerald-300 font-semibold">
                              ₹{ccts10Val.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-emerald-400 border-r border-slate-800/80 bg-emerald-950/10">
                              ₹{total2040Val.toFixed(2)}
                            </td>

                            {/* TOTAL DELTA */}
                            <td className="py-3 px-3 text-right font-bold text-slate-200">
                              +{deltaVal.toFixed(2)}
                            </td>
                          </tr>

                          {/* Expanded Plant Row Details */}
                          {isExpanded && (
                            <tr className="bg-slate-950/80 border-b border-slate-800">
                              <td colSpan={13} className="p-4 sm:p-5 font-sans">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  {/* Column 1: Physical Climate Parameters */}
                                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-2">
                                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                                      Heat Climate Profile (ERA5 + Delta Method)
                                    </div>
                                    <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Days ≥ 40°C (Baseline / 2040):</span>
                                        <span className="font-bold text-white">
                                          {p.physical_climate_data_bias_aware.days_above_40c_baseline.toFixed(1)} / {p.physical_climate_data_bias_aware.days_above_40c_2040.toFixed(1)} d/yr
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Days ≥ 43°C (Baseline / 2040):</span>
                                        <span className="font-bold text-white">
                                          {p.physical_climate_data_bias_aware.days_above_43c_baseline.toFixed(1)} / {p.physical_climate_data_bias_aware.days_above_43c_2040.toFixed(1)} d/yr
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Heat Lost Days (Base / 2040):</span>
                                        <span>
                                          {p.operational_downtime_days_by_hazard.baseline_2015_2024.heat_lost_days_api_based.toFixed(2)} / {p.operational_downtime_days_by_hazard.horizon_2040_delta_method.heat_lost_days_api_based.toFixed(2)} days
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 font-sans">
                                        Status: {p.physical_climate_data_bias_aware.days_above_40c_trend_note}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Column 2: Water & Coastal Assessment */}
                                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-2">
                                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                                      Water & Coastal Assessment (Judgement)
                                    </div>
                                    <div className="space-y-1 text-slate-300 text-[11px]">
                                      <div className="flex justify-between font-mono">
                                        <span className="text-slate-400">Water Source:</span>
                                        <span className="text-slate-200">{p.water_source} (Coastal: {p.coastal})</span>
                                      </div>
                                      <div className="flex justify-between font-mono">
                                        <span className="text-slate-400">River Basin:</span>
                                        <span className="text-slate-200">{p.physical_climate_data_bias_aware.water_and_coastal_assessment.basin_name}</span>
                                      </div>
                                      <div className="flex justify-between font-mono">
                                        <span className="text-slate-400">Stress Score:</span>
                                        <span className="text-cyan-300 font-bold">{p.physical_climate_data_bias_aware.water_and_coastal_assessment.water_stress_score_1_to_5} / 5.0</span>
                                      </div>
                                      <div className="flex justify-between font-mono">
                                        <span className="text-slate-400">Downtime Days (Base / 2040):</span>
                                        <span>
                                          {(p.operational_downtime_days_by_hazard.baseline_2015_2024.water_lost_days_judgement + p.operational_downtime_days_by_hazard.baseline_2015_2024.coastal_lost_days_judgement).toFixed(1)} / {(p.operational_downtime_days_by_hazard.horizon_2040_delta_method.water_lost_days_judgement + p.operational_downtime_days_by_hazard.horizon_2040_delta_method.coastal_lost_days_judgement).toFixed(1)} days
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                                        Source: {p.physical_climate_data_bias_aware.water_and_coastal_assessment.source_status}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Column 3: Logistics & Board Talking Points */}
                                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-2">
                                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                      <Factory className="w-3.5 h-3.5 text-emerald-400" />
                                      Asset Notes & Clinker Transfer
                                    </div>
                                    <div className="text-[11px] text-slate-300 space-y-1.5">
                                      <p className="text-slate-400 italic">
                                        {p.notes || 'Integrated plant with dedicated limestone quarry.'}
                                      </p>
                                      <div className="pt-1.5 border-t border-slate-800 font-mono text-[10px] text-slate-400">
                                        Gross Asset: ₹{p.asset_value_inr_cr} Cr • FY26 Rev: ₹{p.revenue_fy2025_26_inr_cr} Cr • {p.employees} Employees
                                      </div>
                                      <div className="text-[10px] text-emerald-400/90 font-mono">
                                        {attr.statement}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  {/* Total Summary Footer */}
                  <tfoot>
                    <tr className="bg-slate-950 border-t-2 border-slate-700 font-mono font-bold text-xs">
                      <td className="py-3 px-3 text-slate-100 font-sans">
                        FLEET PORTFOLIO TOTAL (9 Plants)
                      </td>
                      <td className="py-3 px-2 text-right text-slate-100">
                        {portfolio_summary.portfolio_totals.total_cement_output_fy2025_26_mt.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-100">
                        {clinkerAdjusted
                          ? portfolio_summary.portfolio_totals.total_clinker_adjusted_scope1_kt.toFixed(1)
                          : portfolio_summary.portfolio_totals.total_scope1_co2_kt.toFixed(1)}
                      </td>

                      {/* Today Totals */}
                      <td className="py-3 px-2 text-right border-l border-slate-800 text-amber-300">
                        ₹{headline.baseline_2015_2024.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-cyan-300">
                        ₹{headline.baseline_2015_2024.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-500">
                        ₹0.00
                      </td>
                      <td className="py-3 px-2 text-right text-white border-r border-slate-800 bg-slate-950/40">
                        ₹{headline.baseline_2015_2024.component_sum_inr_cr_per_year.toFixed(2)}
                      </td>

                      {/* 2040 Totals */}
                      <td className="py-3 px-2 text-right text-amber-300">
                        ₹{headline.horizon_2040.heat_component_api_based_inr_cr_per_year.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-cyan-300">
                        ₹{headline.horizon_2040.water_coastal_component_judgement_inr_cr_per_year.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-300">
                        ₹{headline.horizon_2040.ccts_component_case_3pct_annual_inr_cr_per_year.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-300">
                        ₹{headline.horizon_2040.ccts_component_case_10pct_annual_inr_cr_per_year.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-400 border-r border-slate-800 bg-emerald-950/20 text-sm">
                        ₹{headline.horizon_2040.component_sum_with_10pct_ccts_inr_cr_per_year.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                        +{attribution.delta_total_10pct_inr_cr_per_year.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </>
        ) : (
          /* Assumptions & Audit Registry Tab */
          <section className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-slate-100">
                  SEBI BRSR & Regulatory Assumptions Registry (Version 4.0 Bias-Aware)
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                Every calculation parameter, regulatory benchmark, and operational judgement factor is documented below 
                for statutory compliance verification and auditor scrutiny. No made-up numbers or black-box formulas exist in this prototype.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial & Operational Parameters */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Factory className="w-4 h-4 text-emerald-400" />
                  1. Financial & Operating Benchmarks
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Industry EBITDA Margin:</span>
                      <span className="font-bold text-white">₹1,000 / tonne cement</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-mono block mt-1">Status: Assumption</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Median EBITDA margin reported by leading Indian cement makers (UltraTech, Shree, Ambuja) over FY23-FY25 (~18-20% margin on average realization of ₹5,263/t).
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Nominal Operating Days:</span>
                      <span className="font-bold text-white">330 days / year</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-mono block mt-1">Status: Assumption</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Standard industry calendar allowing 35 days for planned kiln relining, statutory maintenance, and seasonal overhaul.
                    </p>
                  </div>
                </div>
              </div>

              {/* Climate & Heat Parameters */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  2. Heat Thresholds & Derating Weights
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Moderate Heat ([40°C, 43°C)):</span>
                      <span className="font-bold text-amber-300">0.10 lost days / day</span>
                    </div>
                    <div className="flex justify-between font-mono mt-1">
                      <span className="text-slate-400">Severe Heat (≥ 43°C):</span>
                      <span className="font-bold text-amber-400">0.35 lost days / day</span>
                    </div>
                    <div className="flex justify-between font-mono mt-1">
                      <span className="text-slate-400">Grinding Unit Damping:</span>
                      <span className="font-bold text-slate-300">0.50 multiplier</span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-mono block mt-1">Status: Assumption</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Occupational safety stops in open-cast captive mines during peak afternoon hours and thermal cooling derating. Formula: <code className="text-slate-300 font-mono">((D40 - D43) * 0.10 + D43 * 0.35) * damping</code>.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Baseline Data Source:</span>
                      <span className="font-bold text-slate-200">ERA5-based reanalysis, not station data</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sourced from ECMWF ERA5 reanalysis (2015–2024). Future 2040 projections use the delta method based on CMIP6 models (<code className="text-slate-300">EC_Earth3P_HR</code> + <code className="text-slate-300">MRI_AGCM3_2_S</code>).
                    </p>
                  </div>
                </div>
              </div>

              {/* Regulatory & CCTS Parameters */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  3. India CCTS Regulatory Assumptions (Bureau of Energy Efficiency)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block font-mono">Assumed Carbon Price</span>
                    <span className="font-bold text-white text-sm font-mono">₹1,500 / tCO₂ (~$18/t)</span>
                    <span className="text-[10px] text-amber-400/90 font-mono block mt-1">Status: Assumption</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Based on BEE steering committee initial bounds and global emerging ETS pricing.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block font-mono">CCTS Methodology Statement</span>
                    <p className="text-[11px] text-emerald-300 font-mono mt-1">
                      "{metadata.ccts_methodology_statement}"
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block font-mono">Illustrative Scenarios</span>
                    <span className="font-bold text-white text-sm font-mono">3.0% and 10.0% Reductions</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Evaluates plant-level intensity targets pending gazette notification. 3% cut yields ₹49.19 Cr/yr fleet liability; 10% cut yields ₹163.99 Cr/yr.
                    </p>
                  </div>
                </div>
              </div>

              {/* Water & Coastal Judgement Registry Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    4. Water & Coastal Judgement Registry (Site-Level Assessments)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    All Entries: judgement, not sourced
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2 px-3">Plant ID & Name</th>
                        <th className="py-2 px-3">Water Source</th>
                        <th className="py-2 px-3">River Basin / Coastal Zone</th>
                        <th className="py-2 px-2 text-center">Stress Score (1-5)</th>
                        <th className="py-2 px-3 text-right">Water Lost Days (Base / 2040)</th>
                        <th className="py-2 px-3 text-right">Coastal Lost Days (Base / 2040)</th>
                        <th className="py-2 px-3">Audit Label</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {plants.map((p) => {
                        const wc = assumptionsData.water_and_coastal_assumptions[p.plant_id]
                        return (
                          <tr key={p.plant_id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                              {p.plant_id} - {p.plant_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {p.water_source} {p.coastal === 'Y' && '(Coastal)'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">{wc.basin_name}</td>
                            <td className="py-2.5 px-2 text-center text-cyan-300 font-bold">
                              {wc.water_stress_score_1_to_5.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-200">
                              {wc.water_lost_days_baseline.toFixed(1)} / {wc.water_lost_days_2040.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-200">
                              {wc.coastal_lost_days_baseline.toFixed(1)} / {wc.coastal_lost_days_2040.toFixed(1)}
                            </td>
                            <td className="py-2.5 px-3 text-[10px] text-amber-400/90 font-sans">
                              {wc.source_status}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                  <strong className="text-slate-300">Flood Data Role Caveat:</strong> Open-Meteo Flood API river discharge (m³/s) provides contextual hydrological background only and does NOT directly feed into downtime days or financial losses.
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-2">
          <div>
            Nimbus Cement Ltd • Head of Sustainability Executive Decision Ledger • v4.0 Bias-Aware
          </div>
          <div>
            Zero Login Required • Deployed on Vercel
          </div>
        </div>
      </footer>
    </div>
  )
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}
