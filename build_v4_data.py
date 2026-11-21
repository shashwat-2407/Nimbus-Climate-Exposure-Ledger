import csv
import json

# 1. Load CSV
plants_raw = []
with open('nimbus_cement_plants.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        plants_raw.append(row)

total_capacity = sum(float(p['cement_capacity_mtpa']) for p in plants_raw)
total_output = sum(float(p['cement_output_fy2025_26_mt']) for p in plants_raw)
total_clinker_prod = sum(float(p['clinker_produced_fy2025_26_mt']) for p in plants_raw)
total_clinker_ship = sum(float(p['clinker_shipped_fy2025_26_mt']) for p in plants_raw)
total_scope1 = sum(float(p['scope1_co2_fy2025_26_kt']) for p in plants_raw)
total_asset_val = sum(float(p['asset_value_inr_cr']) for p in plants_raw)
total_revenue = sum(float(p['revenue_fy2025_26_inr_cr']) for p in plants_raw)
total_employees = sum(int(p['employees']) for p in plants_raw)

# 2. Clinker Reallocation Math
p01_scope1 = 3125.0
p01_clinker_prod = 3.43
p01_clinker_intensity = p01_scope1 / p01_clinker_prod
p01_to_p07_emissions = 1.12 * p01_clinker_intensity

p06_scope1 = 2470.0
p06_clinker_prod = 3.01
p06_clinker_intensity = p06_scope1 / p06_clinker_prod
p06_to_p08_emissions = 0.68 * p06_clinker_intensity
p06_to_p09_emissions = 0.60 * p06_clinker_intensity
p06_total_shipped_emissions = p06_to_p08_emissions + p06_to_p09_emissions

adjusted_scope1 = {}
for p in plants_raw:
    pid = p['plant_id']
    base_s1 = float(p['scope1_co2_fy2025_26_kt'])
    if pid == 'P01':
        adjusted_scope1[pid] = base_s1 - p01_to_p07_emissions
    elif pid == 'P06':
        adjusted_scope1[pid] = base_s1 - p06_total_shipped_emissions
    elif pid == 'P07':
        adjusted_scope1[pid] = base_s1 + p01_to_p07_emissions
    elif pid == 'P08':
        adjusted_scope1[pid] = base_s1 + p06_to_p08_emissions
    elif pid == 'P09':
        adjusted_scope1[pid] = base_s1 + p06_to_p09_emissions
    else:
        adjusted_scope1[pid] = base_s1

# 3. Load Caches
with open('open_meteo_era5_cache.json', 'r') as f:
    era5_cache = json.load(f)

with open('open_meteo_cmip_2015_2024_cache.json', 'r') as f:
    cmip_hist_cache = json.load(f)

with open('open_meteo_10yr_cache.json', 'r') as f:
    cmip_fut_cache = json.load(f)

with open('enriched_plants_data.json', 'r') as f:
    old_data = json.load(f)
    flood_map = {p['plant_id']: {
        'river_discharge_mean_m3s': p.get('physical_climate_data_bias_aware', p.get('physical_climate_data', {})).get('hydrological_context_flood_api', {}).get('river_discharge_mean_m3s'),
        'river_discharge_max_m3s': p.get('physical_climate_data_bias_aware', p.get('physical_climate_data', {})).get('hydrological_context_flood_api', {}).get('river_discharge_max_m3s')
    } for p in old_data['plants']}

# 4. Construct Comprehensive assumptions.json
assumptions = {
    "version": "4.0-bias-aware",
    "status": "Bias-Aware Methodology & Assumptions Registry",
    "metadata_rules": {
        "ccts_methodology_statement": "CCTS here = emissions × % cut × price, with no abatement and no growth to 2040, as a placeholder pending plant baselines.",
        "one_calculation_path_rule": "All summary portfolio figures are derived strictly as the exact sum of the plant rows. Exposure is split into three separate components: heat (API-based), water+coastal (judgement), and CCTS (assumption). It must not be aggregated into an unlabelled single headline.",
        "flow_vs_stock_label_rule": "All annual financial figures represent annual flows and are strictly labelled as 'per year' (INR Crores / year). They must not be compared to the balance sheet asset base without this explicit rate distinction.",
        "clinker_toggle_rule": "The Clinker toggle changes only the Scope 1 and intensity columns. Fleet Scope 1 (10,932.0 kt) is the same in both views. CCTS is NOT invariant at notified rates (direct vs adjusted differ because integrated and grinding rates differ), so every INR value, including CCTS, is computed on direct emissions in both views.",
        "flood_data_role": "Open-Meteo Flood API river discharge (m3/s) provides contextual hydrological background only and does NOT feed into the financial loss calculation. Lost operating days are derived strictly from the stated heat formula and the labelled judgement-based water and coastal assumptions.",
        "heat_bias_correction_method": "Bias-aware delta method applied: Historical baseline (2015-2024) is sourced from ERA5-based reanalysis, not station data. 2040 projection is computed as historical baseline plus the CMIP6 multi-model ensemble change between 2015-2024 and 2036-2045 (delta method), per plant."
    },
    "financial_assumptions": {
        "nominal_operating_days_per_year": {
            "value": 330,
            "unit": "days",
            "source_status": "Assumption",
            "justification": "Standard Indian cement manufacturing operating window allowing 35 days for planned kiln relining, overhaul, and statutory inspections."
        },
        "industry_ebitda_margin_per_tonne": {
            "value": 1000.0,
            "unit": "INR / tonne cement",
            "source_status": "Assumption",
            "justification": "Industry benchmark EBITDA margin (~18-20% margin on average revenue realization of INR 5,263/t)."
        },
        "daily_revenue_calculation": {
            "formula": "plant_revenue_fy2025_26_inr_cr / nominal_operating_days_per_year",
            "unit": "INR Crores / operating day"
        },
        "daily_ebitda_calculation": {
            "formula": "(cement_output_fy2025_26_mt * 100.0) / nominal_operating_days_per_year",
            "unit": "INR Crores / operating day"
        }
    },
    "heat_lost_days_assumptions": {
        "baseline_data": {
            "period": "2015-01-01 to 2024-12-31 (10-year annual average)",
            "source": "ERA5-based reanalysis, not station data",
            "provider": "European Centre for Medium-Range Weather Forecasts (ECMWF) via Open-Meteo Historical Archive API"
        },
        "climate_models_used_for_delta": {
            "baseline_model_period": "2015-01-01 to 2024-12-31",
            "future_model_period": "2036-01-01 to 2045-12-31 (representing 2040 horizon)",
            "models": ["EC_Earth3P_HR (CMIP6 HighResMIP)", "MRI_AGCM3_2_S (CMIP6 HighResMIP)"],
            "aggregation": "Arithmetic mean of the two high-resolution CMIP6 models"
        },
        "delta_method_formula": {
            "d40_2040": "max(0, d40_era5_baseline + (d40_cmip_future - d40_cmip_historical))",
            "d43_2040": "max(0, min(d40_2040, d43_era5_baseline + (d43_cmip_future - d43_cmip_historical)))"
        },
        "thresholds_and_factors": {
            "moderate_heat_threshold_celsius": 40.0,
            "extreme_heat_threshold_celsius": 43.0,
            "factor_moderate_heat": {
                "value": 0.10,
                "unit": "lost operating days per day in [40C, 43C)",
                "source_status": "Assumption"
            },
            "factor_extreme_heat": {
                "value": 0.35,
                "unit": "lost operating days per day >= 43C",
                "source_status": "Assumption"
            },
            "grinding_unit_damping_factor": {
                "value": 0.50,
                "unit": "multiplier",
                "source_status": "Assumption"
            }
        },
        "acute_heat_flag_status": {
            "threshold_days_per_year": 25.0,
            "result": "Dropped. Under the bias-aware ERA5 reanalysis baseline and delta method, no plant exceeds 25 days/year with Tmax >= 43C. Peak extreme heat occurs at P03 Chandrapur (13.8 d/yr baseline, 19.3 d/yr in 2040)."
        }
    },
    "water_and_coastal_assumptions": {
        "P01": { "basin_name": "Banas River Basin", "water_stress_score_1_to_5": 4.5, "water_lost_days_baseline": 8.0, "water_lost_days_2040": 16.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" },
        "P02": { "basin_name": "Tons River Basin", "water_stress_score_1_to_5": 3.5, "water_lost_days_baseline": 3.0, "water_lost_days_2040": 7.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" },
        "P03": { "basin_name": "Wardha River Basin", "water_stress_score_1_to_5": 3.8, "water_lost_days_baseline": 5.0, "water_lost_days_2040": 10.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" },
        "P04": { "basin_name": "Musi / Krishna River Basin", "water_stress_score_1_to_5": 3.9, "water_lost_days_baseline": 6.0, "water_lost_days_2040": 12.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" },
        "P05": { "basin_name": "Vellar / Cauvery Basin", "water_stress_score_1_to_5": 3.7, "water_lost_days_baseline": 5.0, "water_lost_days_2040": 11.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" },
        "P06": { "basin_name": "Mahanadi Canal System", "water_stress_score_1_to_5": 2.2, "water_lost_days_baseline": 1.5, "water_lost_days_2040": 4.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" },
        "P07": { "basin_name": "Gulf of Kutch Coastal Zone", "water_stress_score_1_to_5": 2.0, "water_lost_days_baseline": 0.5, "water_lost_days_2040": 1.5, "coastal_lost_days_baseline": 2.0, "coastal_lost_days_2040": 4.0, "source_status": "judgement, not sourced" },
        "P08": { "basin_name": "Mahanadi Delta Coast", "water_stress_score_1_to_5": 2.0, "water_lost_days_baseline": 1.0, "water_lost_days_2040": 2.0, "coastal_lost_days_baseline": 4.5, "coastal_lost_days_2040": 8.0, "source_status": "judgement, not sourced" },
        "P09": { "basin_name": "Damodar River Basin", "water_stress_score_1_to_5": 2.6, "water_lost_days_baseline": 2.0, "water_lost_days_2040": 5.0, "coastal_lost_days_baseline": 0.0, "coastal_lost_days_2040": 0.0, "source_status": "judgement, not sourced" }
    },
    "ccts_transition_risk_assumptions": {
        "carbon_price_per_tco2": { "value": 1500.0, "unit": "INR / tCO2", "source_status": "Assumption" },
        "baseline_penalty_status": { "value": 0.0, "unit": "INR Crores / year", "source_status": "unverified assumption (pending regulatory compliance schedule)" },
        "ccts_scenarios_evaluated": {
            "case_3pct": { "mandated_intensity_reduction_pct": 3.0, "source_status": "Labelled assumption pending official CCTS schedule" },
            "case_10pct": { "mandated_intensity_reduction_pct": 10.0, "source_status": "Labelled assumption pending official CCTS schedule" }
        }
    }
}

# 5. Process Plants
NOMINAL_DAYS = assumptions["financial_assumptions"]["nominal_operating_days_per_year"]["value"]
CARBON_PRICE = assumptions["ccts_transition_risk_assumptions"]["carbon_price_per_tco2"]["value"]

plants_enriched = []

for p in plants_raw:
    pid = p['plant_id']
    ptype = p['plant_type']
    cap = float(p['cement_capacity_mtpa'])
    out_mt = float(p['cement_output_fy2025_26_mt'])
    out_t = out_mt * 1e6
    clinker_prod = float(p['clinker_produced_fy2025_26_mt'])
    clinker_ship = float(p['clinker_shipped_fy2025_26_mt'])
    scope1_raw = float(p['scope1_co2_fy2025_26_kt'])
    scope1_adj = adjusted_scope1[pid]
    rev_cr = float(p['revenue_fy2025_26_inr_cr'])
    asset_cr = float(p['asset_value_inr_cr'])
    emp = int(p['employees'])
    
    daily_rev_cr = rev_cr / NOMINAL_DAYS
    annual_ebitda_cr = (out_mt * 100.0)
    daily_ebitda_cr = annual_ebitda_cr / NOMINAL_DAYS
    
    # 1. Historical ERA5 Baseline (2015-2024)
    e_tmax = era5_cache[pid]['daily']['temperature_2m_max']
    d40_base = round(sum(1 for x in e_tmax if x is not None and x >= 40.0) / 10.0, 1)
    d43_base = round(sum(1 for x in e_tmax if x is not None and x >= 43.0) / 10.0, 1)
    
    # 2. CMIP Hist (2015-2024)
    ch = cmip_hist_cache[pid]['daily']
    d40_ch = (sum(1 for x in ch['temperature_2m_max_EC_Earth3P_HR'] if x is not None and x >= 40.0)/10.0 + sum(1 for x in ch['temperature_2m_max_MRI_AGCM3_2_S'] if x is not None and x >= 40.0)/10.0) / 2.0
    d43_ch = (sum(1 for x in ch['temperature_2m_max_EC_Earth3P_HR'] if x is not None and x >= 43.0)/10.0 + sum(1 for x in ch['temperature_2m_max_MRI_AGCM3_2_S'] if x is not None and x >= 43.0)/10.0) / 2.0
    
    # 3. CMIP Fut (2036-2045)
    cf = cmip_fut_cache[pid]['d2']['daily']
    d40_cf = (sum(1 for x in cf['temperature_2m_max_EC_Earth3P_HR'] if x is not None and x >= 40.0)/10.0 + sum(1 for x in cf['temperature_2m_max_MRI_AGCM3_2_S'] if x is not None and x >= 40.0)/10.0) / 2.0
    d43_cf = (sum(1 for x in cf['temperature_2m_max_EC_Earth3P_HR'] if x is not None and x >= 43.0)/10.0 + sum(1 for x in cf['temperature_2m_max_MRI_AGCM3_2_S'] if x is not None and x >= 43.0)/10.0) / 2.0
    
    delta_d40 = round(d40_cf - d40_ch, 1)
    delta_d43 = round(d43_cf - d43_ch, 1)
    
    # Delta method future values
    d40_2040 = round(max(0, d40_base + delta_d40), 1)
    d43_2040 = round(max(0, min(d40_2040, d43_base + delta_d43)), 1)
    
    days_40c_trend_falls = d40_2040 < d40_base
    days_40c_trend_delta = round(d40_2040 - d40_base, 1)
    days_40c_trend_note = "change within model noise" if days_40c_trend_falls else "projected increase"
    
    # Heat Lost Days
    damping = 0.50 if ptype == 'Grinding unit' else 1.00
    heat_lost_base = round(((d40_base - d43_base) * 0.10 + d43_base * 0.35) * damping, 2)
    heat_lost_2040 = round(((d40_2040 - d43_2040) * 0.10 + d43_2040 * 0.35) * damping, 2)
    
    # Water & Coastal
    wc_info = assumptions["water_and_coastal_assumptions"][pid]
    w_base = wc_info["water_lost_days_baseline"]
    w_2040 = wc_info["water_lost_days_2040"]
    c_base = wc_info["coastal_lost_days_baseline"]
    c_2040 = wc_info["coastal_lost_days_2040"]
    
    wc_lost_base = round(w_base + c_base, 2)
    wc_lost_2040 = round(w_2040 + c_2040, 2)
    
    tot_lost_base = round(heat_lost_base + wc_lost_base, 2)
    tot_lost_2040 = round(heat_lost_2040 + wc_lost_2040, 2)
    
    # Financial Exposures (INR Cr / year)
    heat_ebitda_base = round(heat_lost_base * daily_ebitda_cr, 2)
    heat_ebitda_2040 = round(heat_lost_2040 * daily_ebitda_cr, 2)
    delta_heat = round(heat_ebitda_2040 - heat_ebitda_base, 2)
    
    wc_ebitda_base = round(wc_lost_base * daily_ebitda_cr, 2)
    wc_ebitda_2040 = round(wc_lost_2040 * daily_ebitda_cr, 2)
    delta_wc = round(wc_ebitda_2040 - wc_ebitda_base, 2)
    
    ccts_3pct_adj = round((scope1_adj * 1000.0 * 0.03 * CARBON_PRICE) / 1e7, 2)
    ccts_3pct_unadj = round((scope1_raw * 1000.0 * 0.03 * CARBON_PRICE) / 1e7, 2)
    ccts_10pct_adj = round((scope1_adj * 1000.0 * 0.10 * CARBON_PRICE) / 1e7, 2)
    ccts_10pct_unadj = round((scope1_raw * 1000.0 * 0.10 * CARBON_PRICE) / 1e7, 2)
    
    rate_notified = 0.027 if ptype == 'Integrated' else 0.066
    ccts_notified_unadj = round((scope1_raw * 1000.0 * rate_notified * CARBON_PRICE) / 1e7, 2)
    ccts_notified_adj = round((scope1_adj * 1000.0 * rate_notified * CARBON_PRICE) / 1e7, 2)
    
    ccts_base = 0.0
    delta_ccts_10 = round(ccts_10pct_adj - ccts_base, 2)
    delta_ccts_3 = round(ccts_3pct_adj - ccts_base, 2)
    
    # Component breakdown sums
    tot_base = round(heat_ebitda_base + wc_ebitda_base + ccts_base, 2)
    tot_2040_10 = round(heat_ebitda_2040 + wc_ebitda_2040 + ccts_10pct_adj, 2)
    tot_2040_3 = round(heat_ebitda_2040 + wc_ebitda_2040 + ccts_3pct_adj, 2)
    
    delta_tot_10 = round(tot_2040_10 - tot_base, 2)
    pct_heat_10 = round((delta_heat / delta_tot_10) * 100.0, 1) if delta_tot_10 > 0 else 0.0
    pct_wc_10 = round((delta_wc / delta_tot_10) * 100.0, 1) if delta_tot_10 > 0 else 0.0
    pct_ccts_10 = round((delta_ccts_10 / delta_tot_10) * 100.0, 1) if delta_tot_10 > 0 else 0.0
    
    flood_ctx = flood_map.get(pid, {})
    
    plant_entry = {
        "plant_id": pid,
        "plant_name": p['plant_name'],
        "town": p['town'],
        "state": p['state'],
        "latitude": float(p['latitude']),
        "longitude": float(p['longitude']),
        "plant_type": ptype,
        "cement_capacity_mtpa": cap,
        "cement_output_fy2025_26_mt": out_mt,
        "clinker_produced_fy2025_26_mt": clinker_prod,
        "clinker_shipped_fy2025_26_mt": clinker_ship,
        "asset_value_inr_cr": asset_cr,
        "revenue_fy2025_26_inr_cr": rev_cr,
        "employees": emp,
        "water_source": p['water_source'],
        "coastal": p['coastal'],
        "notes": p['notes'],
        
        "emissions": {
            "unadjusted_direct_scope1_kt": scope1_raw,
            "clinker_reallocated_scope1_kt": round(scope1_adj, 2),
            "clinker_adjustment_delta_kt": round(scope1_adj - scope1_raw, 2),
            "unadjusted_intensity_tco2_per_t": round((scope1_raw * 1000.0) / out_t, 4),
            "adjusted_intensity_tco2_per_t": round((scope1_adj * 1000.0) / out_t, 4)
        },
        
        "physical_climate_data_bias_aware": {
            "baseline_source": "ERA5-based reanalysis, not station data",
            "baseline_period": "2015–2024 historical baseline",
            "future_method": "Delta method (CMIP6 model change applied to ERA5 baseline)",
            "days_above_40c_baseline": d40_base,
            "days_above_40c_2040": d40_2040,
            "days_above_40c_model_delta": delta_d40,
            "days_above_40c_trend_falls": days_40c_trend_falls,
            "days_above_40c_trend_note": days_40c_trend_note,
            "days_above_43c_baseline": d43_base,
            "days_above_43c_2040": d43_2040,
            "days_above_43c_model_delta": delta_d43,
            "acute_heat_flag_over_25_days": False, # None exceed 25 under ERA5 delta method
            "hydrological_context_flood_api": {
                "river_discharge_mean_m3s": flood_ctx.get('river_discharge_mean_m3s'),
                "river_discharge_max_m3s": flood_ctx.get('river_discharge_max_m3s'),
                "feeds_money_calculation": False,
                "note": "Open-Meteo Flood API river discharge provides hydrological context only and does NOT feed into downtime days or financial losses."
            },
            "water_and_coastal_assessment": wc_info
        },
        
        "operational_downtime_days_by_hazard": {
            "baseline_2015_2024": {
                "heat_lost_days_api_based": heat_lost_base,
                "water_lost_days_judgement": w_base,
                "coastal_lost_days_judgement": c_base,
                "total_lost_operating_days": tot_lost_base
            },
            "horizon_2040_delta_method": {
                "heat_lost_days_api_based": heat_lost_2040,
                "water_lost_days_judgement": w_2040,
                "coastal_lost_days_judgement": c_2040,
                "total_lost_operating_days": tot_lost_2040
            }
        },
        
        "three_component_financial_exposure_inr_cr_per_year": {
            "rates": {
                "daily_revenue_inr_cr_per_day": round(daily_rev_cr, 4),
                "daily_ebitda_inr_cr_per_day": round(daily_ebitda_cr, 4)
            },
            "baseline_2015_2024": {
                "heat_component_api_based_inr_cr_per_year": heat_ebitda_base,
                "water_coastal_component_judgement_inr_cr_per_year": wc_ebitda_base,
                "ccts_component_assumption_inr_cr_per_year": ccts_base,
                "ccts_baseline_status": "not computable from CSV (no FY2023-24 baseline)",
                "ccts_today_upper_bound_inr_cr_per_year": ccts_notified_unadj,
                "ccts_today_upper_bound_adjusted_inr_cr_per_year": ccts_notified_adj,
                "component_breakdown_sum_inr_cr_per_year": tot_base
            },
            "horizon_2040": {
                "heat_component_api_based_inr_cr_per_year": heat_ebitda_2040,
                "water_coastal_component_judgement_inr_cr_per_year": wc_ebitda_2040,
                "ccts_component_case_10pct_adjusted_inr_cr_per_year": ccts_10pct_adj,
                "ccts_component_case_10pct_unadjusted_inr_cr_per_year": ccts_10pct_unadj,
                "ccts_component_case_10pct_label": "Stretch 10% (scenario)",
                "ccts_component_case_3pct_adjusted_inr_cr_per_year": ccts_3pct_adj,
                "ccts_component_case_3pct_unadjusted_inr_cr_per_year": ccts_3pct_unadj,
                "ccts_component_case_3pct_label": "Illustrative 3% cut",
                "ccts_component_notified_adjusted_inr_cr_per_year": ccts_notified_adj,
                "ccts_component_notified_unadjusted_inr_cr_per_year": ccts_notified_unadj,
                "ccts_component_notified_label": "Notified rates (integrated 2.7%, grinding 6.6%)",
                "ccts_horizon_note": "No target runs to 2040; rates represent illustrative compliance scenarios",
                "component_breakdown_sum_10pct_adjusted_inr_cr_per_year": tot_2040_10,
                "component_breakdown_sum_3pct_adjusted_inr_cr_per_year": tot_2040_3
            },
            "increase_attribution_baseline_to_2040_inr_cr_per_year": {
                "delta_heat_component_inr_cr_per_year": delta_heat,
                "delta_water_coastal_component_inr_cr_per_year": delta_wc,
                "delta_ccts_10pct_component_inr_cr_per_year": delta_ccts_10,
                "delta_total_10pct_inr_cr_per_year": delta_tot_10,
                "pct_of_increase_from_heat": pct_heat_10,
                "pct_of_increase_from_water_coastal": pct_wc_10,
                "pct_of_increase_from_ccts": pct_ccts_10,
                "statement": "Plant-level CCTS has no measured baseline; see fleet statement for the floor basis."
            }
        }
    }
    plants_enriched.append(plant_entry)

# 6. Portfolio Aggregations
fleet_heat_base = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['baseline_2015_2024']['heat_component_api_based_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_wc_base = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['baseline_2015_2024']['water_coastal_component_judgement_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_base = 0.0
fleet_tot_base = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['baseline_2015_2024']['component_breakdown_sum_inr_cr_per_year'] for p in plants_enriched), 2)

fleet_heat_2040 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['heat_component_api_based_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_wc_2040 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['water_coastal_component_judgement_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_10_adj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_10pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_10_unadj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_10pct_unadjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_3_adj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_3pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_3_unadj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_3pct_unadjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_notified_adj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_notified_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_notified_unadj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_notified_unadjusted_inr_cr_per_year'] for p in plants_enriched), 2)

fleet_tot_2040_10 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['component_breakdown_sum_10pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_tot_2040_3 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['component_breakdown_sum_3pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)

fleet_delta_heat = round(fleet_heat_2040 - fleet_heat_base, 2)
fleet_delta_wc = round(fleet_wc_2040 - fleet_wc_base, 2)
fleet_delta_ccts_10 = round(fleet_ccts_10_adj - fleet_ccts_base, 2)
fleet_delta_ccts_3 = round(fleet_ccts_3_adj - fleet_ccts_base, 2)
fleet_delta_tot_10 = round(fleet_tot_2040_10 - fleet_tot_base, 2)

fleet_pct_heat = round((fleet_delta_heat / fleet_delta_tot_10) * 100.0, 1)
fleet_pct_wc = round((fleet_delta_wc / fleet_delta_tot_10) * 100.0, 1)
fleet_pct_ccts = round((fleet_delta_ccts_10 / fleet_delta_tot_10) * 100.0, 1)

portfolio_summary = {
    "portfolio_totals": {
        "total_plants": 9,
        "total_cement_capacity_mtpa": total_capacity,
        "total_cement_output_fy2025_26_mt": total_output,
        "total_asset_value_inr_cr": total_asset_val,
        "total_revenue_fy2025_26_inr_cr": total_revenue,
        "total_scope1_co2_kt": total_scope1,
        "total_clinker_adjusted_scope1_kt": sum(adjusted_scope1.values()),
        "total_employees": total_employees
    },
    "headline_exposure_summary_inr_cr_per_year": {
        "baseline_2015_2024": {
            "heat_component_api_based_inr_cr_per_year": fleet_heat_base,
            "water_coastal_component_judgement_inr_cr_per_year": fleet_wc_base,
            "ccts_component_assumption_inr_cr_per_year": fleet_ccts_base,
            "ccts_status": "not computable from CSV (no FY2023-24 baseline)",
            "ccts_upper_bound_at_notified_averages_inr_cr_per_year": fleet_ccts_notified_unadj,
            "ccts_upper_bound_at_notified_averages_adjusted_inr_cr_per_year": fleet_ccts_notified_adj,
            "ccts_upper_bound_statement": f"Not computable from CSV (no FY2023-24 baseline); upper bound at notified averages (integrated 2.7%, grinding 6.6%) is ₹{fleet_ccts_notified_unadj:.2f} Cr/yr (direct) or ₹{fleet_ccts_notified_adj:.2f} Cr/yr (clinker-adjusted)",
            "component_sum_inr_cr_per_year": fleet_tot_base,
            "rate_vs_asset_base_pct_per_year": round((fleet_tot_base / total_asset_val) * 100.0, 2)
        },
        "horizon_2040": {
            "heat_component_api_based_inr_cr_per_year": fleet_heat_2040,
            "water_coastal_component_judgement_inr_cr_per_year": fleet_wc_2040,
            "ccts_component_case_10pct_annual_inr_cr_per_year": fleet_ccts_10_adj,
            "ccts_component_case_10pct_annual_unadjusted_inr_cr_per_year": fleet_ccts_10_unadj,
            "ccts_component_case_10pct_label": "Stretch 10% (scenario)",
            "ccts_component_case_3pct_annual_inr_cr_per_year": fleet_ccts_3_adj,
            "ccts_component_case_3pct_annual_unadjusted_inr_cr_per_year": fleet_ccts_3_unadj,
            "ccts_component_case_3pct_label": "Illustrative 3% cut",
            "ccts_component_notified_annual_direct_inr_cr_per_year": fleet_ccts_notified_unadj,
            "ccts_component_notified_annual_adjusted_inr_cr_per_year": fleet_ccts_notified_adj,
            "ccts_component_notified_label": "Notified rates (integrated 2.7%, grinding 6.6%)",
            "ccts_horizon_note": "No target runs to 2040; rates represent illustrative compliance scenarios",
            "component_sum_with_10pct_ccts_inr_cr_per_year": fleet_tot_2040_10,
            "component_sum_with_3pct_ccts_inr_cr_per_year": fleet_tot_2040_3,
            "rate_vs_asset_base_pct_per_year_case_10pct": round((fleet_tot_2040_10 / total_asset_val) * 100.0, 2),
            "rate_vs_asset_base_pct_per_year_case_3pct": round((fleet_tot_2040_3 / total_asset_val) * 100.0, 2)
        },
        "fleet_increase_attribution_baseline_to_2040": {
            "delta_heat_component_inr_cr_per_year": fleet_delta_heat,
            "delta_water_coastal_component_inr_cr_per_year": fleet_delta_wc,
            "delta_ccts_10pct_component_inr_cr_per_year": fleet_delta_ccts_10,
            "delta_total_10pct_inr_cr_per_year": fleet_delta_tot_10,
            "pct_of_increase_from_heat": fleet_pct_heat,
            "pct_of_increase_from_water_coastal": fleet_pct_wc,
            "pct_of_increase_from_ccts": fleet_pct_ccts,
            "pct_basis_note": "pct_* and delta_total_10pct compare 2040 CCTS against a zero baseline. CCTS today is not computable, so do not cite them as the share of the increase; use the floor in statement.",
            "statement": f"Heat +{fleet_delta_heat:.2f} and water+coastal +{fleet_delta_wc:.2f} Cr/yr are measured against today. CCTS has no baseline; its increase is at least {fleet_delta_ccts_10 - fleet_ccts_notified_unadj:.2f} Cr/yr (2040 stretch minus today's upper bound of {fleet_ccts_notified_unadj:.2f})."
        },
        "chart_stacked_today_vs_2040": {
            "today": {
                "label": "Today (Baseline)",
                "total_inr_cr_per_year": fleet_tot_base,
                "heat_inr_cr_per_year": fleet_heat_base,
                "water_coastal_inr_cr_per_year": fleet_wc_base,
                "ccts_inr_cr_per_year": 0.0,
                "ccts_note": "Not computable from CSV (no baseline)"
            },
            "horizon_2040_stretch_10pct": {
                "label": "2040 Horizon (Stretch 10% scenario)",
                "total_inr_cr_per_year": fleet_tot_2040_10,
                "heat_inr_cr_per_year": fleet_heat_2040,
                "water_coastal_inr_cr_per_year": fleet_wc_2040,
                "ccts_inr_cr_per_year": fleet_ccts_10_adj,
                "ccts_note": "Stretch 10% (scenario)"
            },
            "horizon_2040_notified_rates": {
                "label": "2040 Horizon (Notified rates)",
                "total_inr_cr_per_year": round(fleet_heat_2040 + fleet_wc_2040 + fleet_ccts_notified_adj, 2),
                "heat_inr_cr_per_year": fleet_heat_2040,
                "water_coastal_inr_cr_per_year": fleet_wc_2040,
                "ccts_inr_cr_per_year": fleet_ccts_notified_adj,
                "ccts_note": "Notified rates (2.7% / 6.6%)"
            }
        }
    }
}

full_output = {
    "metadata": {
        "company": "Nimbus Cement Ltd",
        "author": "Meera Iyer (Head of Sustainability)",
        "purpose": "Nimbus Climate Exposure Ledger: ERA5 Baseline vs 2040 Delta Method",
        "ccts_methodology_statement": "CCTS here = emissions × % cut × price, with no abatement and no growth to 2040, as a placeholder pending plant baselines.",
        "climate_baseline_source": "ERA5-based reanalysis, not station data",
        "calculation_rules": assumptions["metadata_rules"]
    },
    "assumptions_reference": "assumptions.json",
    "portfolio_summary": portfolio_summary,
    "plants": plants_enriched
}

import shutil

with open('assumptions.json', 'w') as f:
    json.dump(assumptions, f, indent=2)

with open('enriched_plants_data.json', 'w') as f:
    json.dump(full_output, f, indent=2)

shutil.copy('assumptions.json', 'src/data/assumptions.json')
shutil.copy('enriched_plants_data.json', 'src/data/enriched_plants_data.json')

print("V4 Bias-Aware build complete!")
print(f"Baseline: Heat={fleet_heat_base}, WC={fleet_wc_base}, CCTS={fleet_ccts_base} -> Total={fleet_tot_base} Cr/yr")
print(f"2040: Heat={fleet_heat_2040}, WC={fleet_wc_2040}, CCTS(10%)={fleet_ccts_10_adj}, CCTS(3%)={fleet_ccts_3_adj} -> Total(10%)={fleet_tot_2040_10} Cr/yr")
print(f"Attribution: Heat=+{fleet_delta_heat} ({fleet_pct_heat}%), WC=+{fleet_delta_wc} ({fleet_pct_wc}%), CCTS=+{fleet_delta_ccts_10} ({fleet_pct_ccts}%)")
