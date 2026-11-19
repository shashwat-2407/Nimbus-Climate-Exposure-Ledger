import csv
import json

# 1. Load CSV
plants_raw = []
with open('nimbus_cement_plants.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        plants_raw.append(row)

# 2. Verify all CSV Totals
total_capacity = sum(float(p['cement_capacity_mtpa']) for p in plants_raw)
total_output = sum(float(p['cement_output_fy2025_26_mt']) for p in plants_raw)
total_clinker_prod = sum(float(p['clinker_produced_fy2025_26_mt']) for p in plants_raw)
total_clinker_ship = sum(float(p['clinker_shipped_fy2025_26_mt']) for p in plants_raw)
total_scope1 = sum(float(p['scope1_co2_fy2025_26_kt']) for p in plants_raw)
total_asset_val = sum(float(p['asset_value_inr_cr']) for p in plants_raw)
total_revenue = sum(float(p['revenue_fy2025_26_inr_cr']) for p in plants_raw)
total_employees = sum(int(p['employees']) for p in plants_raw)

# 3. Clinker Reallocation Math
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

# 4. Load 10-year multi-model climate cache & flood data
with open('open_meteo_10yr_cache.json', 'r') as f:
    climate_cache = json.load(f)

with open('enriched_plants_data.json', 'r') as f:
    old_data = json.load(f)
    flood_map = {p['plant_id']: {
        'river_discharge_mean_m3s': p['physical_climate_data'].get('hydrological_context_flood_api', {}).get('river_discharge_mean_m3s'),
        'river_discharge_max_m3s': p['physical_climate_data'].get('hydrological_context_flood_api', {}).get('river_discharge_max_m3s')
    } for p in old_data['plants']}

# 5. Define Comprehensive assumptions.json
assumptions = {
    "version": "3.0-audited",
    "status": "Labelled Assumptions & Judgement Registry",
    "metadata_rules": {
        "ccts_methodology_statement": "CCTS here = emissions × % cut × price, with no abatement and no growth to 2040, as a placeholder pending plant baselines.",
        "one_calculation_path_rule": "All summary portfolio figures are derived strictly as the exact sum of the plant rows. Exposure is split into three separate components: heat (API-based), water+coastal (judgement), and CCTS (assumption). It must not be aggregated into an unlabelled single headline.",
        "flow_vs_stock_label_rule": "All annual financial figures represent annual flows and are strictly labelled as 'per year' (INR Crores / year). They must not be compared to the balance sheet asset base without this explicit rate distinction.",
        "clinker_toggle_rule": "The Clinker Reallocation toggle changes only the inter-plant distribution of emissions and CCTS liabilities between mother kilns (P01, P06) and grinding units (P07, P08, P09). The fleet-wide total Scope 1 emissions (10,932.0 kt) and total CCTS liabilities remain strictly invariant.",
        "flood_data_role": "Open-Meteo Flood API river discharge (m3/s) provides contextual hydrological background only and does NOT feed into the financial loss calculation. Lost operating days are derived strictly from the stated heat formula and the labelled judgement-based water and coastal assumptions.",
        "model_uncorrected_caveat": "Climate model outputs from CMIP6 EC_Earth3P_HR and MRI_AGCM3_2_S are raw and uncorrected (no empirical quantile mapping or station-level bias correction applied)."
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
        "climate_data_windows": {
            "window_1": "2021–2030 model average (10-year annual average)",
            "window_2": "2036–2045 model average (representing 2040 horizon)",
            "models_used": [
                "EC_Earth3P_HR (CMIP6 HighResMIP)",
                "MRI_AGCM3_2_S (CMIP6 HighResMIP)"
            ],
            "aggregation": "Arithmetic mean of the two high-resolution CMIP6 models over 10-year windows",
            "model_bias_correction": "Uncorrected (raw model grid outputs)"
        },
        "thresholds_and_factors": {
            "moderate_heat_threshold_celsius": 40.0,
            "extreme_heat_threshold_celsius": 43.0,
            "acute_extreme_heat_flag_threshold_days": 25.0,
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
                "source_status": "Assumption",
                "justification": "Grinding units operate enclosed grinding circuits without open-cast captive quarries."
            }
        },
        "formula_specification": {
            "integrated_plants": "heat_lost_days = (days_40c - days_43c) * 0.10 + days_43c * 0.35",
            "grinding_units": "heat_lost_days = ((days_40c - days_43c) * 0.10 + days_43c * 0.35) * 0.50"
        }
    },
    "water_and_coastal_assumptions": {
        "P01": {
            "basin_name": "Banas River Basin",
            "water_stress_score_1_to_5": 4.5,
            "water_lost_days_2021_2030": 8.0,
            "water_lost_days_2040": 16.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P02": {
            "basin_name": "Tons River Basin",
            "water_stress_score_1_to_5": 3.5,
            "water_lost_days_2021_2030": 3.0,
            "water_lost_days_2040": 7.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P03": {
            "basin_name": "Wardha River Basin",
            "water_stress_score_1_to_5": 3.8,
            "water_lost_days_2021_2030": 5.0,
            "water_lost_days_2040": 10.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P04": {
            "basin_name": "Musi / Krishna River Basin",
            "water_stress_score_1_to_5": 3.9,
            "water_lost_days_2021_2030": 6.0,
            "water_lost_days_2040": 12.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P05": {
            "basin_name": "Vellar / Cauvery Basin",
            "water_stress_score_1_to_5": 3.7,
            "water_lost_days_2021_2030": 5.0,
            "water_lost_days_2040": 11.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P06": {
            "basin_name": "Mahanadi Canal System",
            "water_stress_score_1_to_5": 2.2,
            "water_lost_days_2021_2030": 1.5,
            "water_lost_days_2040": 4.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P07": {
            "basin_name": "Gulf of Kutch Coastal Zone",
            "water_stress_score_1_to_5": 2.0,
            "water_lost_days_2021_2030": 0.5,
            "water_lost_days_2040": 1.5,
            "coastal_lost_days_2021_2030": 2.0,
            "coastal_lost_days_2040": 4.0,
            "source_status": "judgement, not sourced"
        },
        "P08": {
            "basin_name": "Mahanadi Delta Coast",
            "water_stress_score_1_to_5": 2.0,
            "water_lost_days_2021_2030": 1.0,
            "water_lost_days_2040": 2.0,
            "coastal_lost_days_2021_2030": 4.5,
            "coastal_lost_days_2040": 8.0,
            "source_status": "judgement, not sourced"
        },
        "P09": {
            "basin_name": "Damodar River Basin",
            "water_stress_score_1_to_5": 2.6,
            "water_lost_days_2021_2030": 2.0,
            "water_lost_days_2040": 5.0,
            "coastal_lost_days_2021_2030": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        }
    },
    "ccts_transition_risk_assumptions": {
        "carbon_price_per_tco2": {
            "value": 1500.0,
            "unit": "INR / tCO2",
            "source_status": "Assumption"
        },
        "period_2021_2030_penalty_status": {
            "value": 0.0,
            "unit": "INR Crores / year",
            "source_status": "unverified assumption (pending regulatory compliance schedule)",
            "note": "Assumes zero financial penalties are levied in FY2025-26 as CCTS compliance mechanisms are not yet statutorily enforced."
        },
        "ccts_scenarios_evaluated": {
            "case_3pct": {
                "mandated_intensity_reduction_pct": 3.0,
                "source_status": "Labelled assumption pending official CCTS schedule",
                "formula_liability_cr_per_year": "(scope1_kt * 1000 * 0.03 * 1500) / 1e7"
            },
            "case_10pct": {
                "mandated_intensity_reduction_pct": 10.0,
                "source_status": "Labelled assumption pending official CCTS schedule",
                "formula_liability_cr_per_year": "(scope1_kt * 1000 * 0.10 * 1500) / 1e7"
            }
        }
    }
}

# 6. Process Plant Data
NOMINAL_DAYS = assumptions["financial_assumptions"]["nominal_operating_days_per_year"]["value"]
EBITDA_PER_T = assumptions["financial_assumptions"]["industry_ebitda_margin_per_tonne"]["value"]
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
    annual_ebitda_cr = (out_mt * 100.0) # INR Cr / year
    daily_ebitda_cr = annual_ebitda_cr / NOMINAL_DAYS
    
    # Climate Data: 10-Year Multi-Model Ensemble
    c_entry = climate_cache[pid]
    d1_daily = c_entry['d1']['daily']
    d2_daily = c_entry['d2']['daily']
    
    t1_m1 = d1_daily.get('temperature_2m_max_EC_Earth3P_HR', [])
    t1_m2 = d1_daily.get('temperature_2m_max_MRI_AGCM3_2_S', [])
    t2_m1 = d2_daily.get('temperature_2m_max_EC_Earth3P_HR', [])
    t2_m2 = d2_daily.get('temperature_2m_max_MRI_AGCM3_2_S', [])
    
    pr1_m1 = d1_daily.get('precipitation_sum_EC_Earth3P_HR', [])
    pr1_m2 = d1_daily.get('precipitation_sum_MRI_AGCM3_2_S', [])
    pr2_m1 = d2_daily.get('precipitation_sum_EC_Earth3P_HR', [])
    pr2_m2 = d2_daily.get('precipitation_sum_MRI_AGCM3_2_S', [])
    
    # 2021-2030 model averages
    d40_2021_2030 = round((sum(1 for x in t1_m1 if x is not None and x >= 40.0) / 10.0 + sum(1 for x in t1_m2 if x is not None and x >= 40.0) / 10.0) / 2.0, 1)
    d43_2021_2030 = round((sum(1 for x in t1_m1 if x is not None and x >= 43.0) / 10.0 + sum(1 for x in t1_m2 if x is not None and x >= 43.0) / 10.0) / 2.0, 1)
    precip_2021_2030 = round((sum(x for x in pr1_m1 if x is not None) / 10.0 + sum(x for x in pr1_m2 if x is not None) / 10.0) / 2.0, 1)
    
    # 2036-2045 model averages (2040 horizon)
    d40_2040 = round((sum(1 for x in t2_m1 if x is not None and x >= 40.0) / 10.0 + sum(1 for x in t2_m2 if x is not None and x >= 40.0) / 10.0) / 2.0, 1)
    d43_2040 = round((sum(1 for x in t2_m1 if x is not None and x >= 43.0) / 10.0 + sum(1 for x in t2_m2 if x is not None and x >= 43.0) / 10.0) / 2.0, 1)
    precip_2040 = round((sum(x for x in pr2_m1 if x is not None) / 10.0 + sum(x for x in pr2_m2 if x is not None) / 10.0) / 2.0, 1)
    
    # Trend and Flags
    days_40c_trend_falls = d40_2040 < d40_2021_2030
    days_40c_trend_delta = round(d40_2040 - d40_2021_2030, 1)
    days_40c_trend_note = "change within model noise" if days_40c_trend_falls else "projected increase"
    
    # Flag for 43C days exceeding 25 days/year
    flag_43c_exceeds_25_2021_2030 = d43_2021_2030 > 25.0
    flag_43c_exceeds_25_2040 = d43_2040 > 25.0
    
    # Heat lost days
    damping = 0.50 if ptype == 'Grinding unit' else 1.00
    heat_lost_2021_2030 = round(((d40_2021_2030 - d43_2021_2030) * 0.10 + d43_2021_2030 * 0.35) * damping, 2)
    heat_lost_2040 = round(((d40_2040 - d43_2040) * 0.10 + d43_2040 * 0.35) * damping, 2)
    
    # Water & Coastal from assumptions
    wc_info = assumptions["water_and_coastal_assumptions"][pid]
    water_lost_2021_2030 = wc_info["water_lost_days_2021_2030"]
    water_lost_2040 = wc_info["water_lost_days_2040"]
    coastal_lost_2021_2030 = wc_info["coastal_lost_days_2021_2030"]
    coastal_lost_2040 = wc_info["coastal_lost_days_2040"]
    
    # Separate Lost Days Components
    water_coastal_lost_2021_2030 = round(water_lost_2021_2030 + coastal_lost_2021_2030, 2)
    water_coastal_lost_2040 = round(water_lost_2040 + coastal_lost_2040, 2)
    
    total_lost_days_2021_2030 = round(heat_lost_2021_2030 + water_coastal_lost_2021_2030, 2)
    total_lost_days_2040 = round(heat_lost_2040 + water_coastal_lost_2040, 2)
    
    # Three Distinct Exposure Components (INR Crores / year)
    # Component 1: Heat (API-based)
    heat_ebitda_risk_2021_2030 = round(heat_lost_2021_2030 * daily_ebitda_cr, 2)
    heat_ebitda_risk_2040 = round(heat_lost_2040 * daily_ebitda_cr, 2)
    delta_heat_cr_per_year = round(heat_ebitda_risk_2040 - heat_ebitda_risk_2021_2030, 2)
    
    # Component 2: Water + Coastal (Judgement)
    water_coastal_ebitda_risk_2021_2030 = round(water_coastal_lost_2021_2030 * daily_ebitda_cr, 2)
    water_coastal_ebitda_risk_2040 = round(water_coastal_lost_2040 * daily_ebitda_cr, 2)
    delta_water_coastal_cr_per_year = round(water_coastal_ebitda_risk_2040 - water_coastal_ebitda_risk_2021_2030, 2)
    
    # Component 3: CCTS Transition (Assumption placeholder)
    unadj_ccts_3pct = round((scope1_raw * 1000.0 * 0.03 * CARBON_PRICE) / 1e7, 2)
    adj_ccts_3pct = round((scope1_adj * 1000.0 * 0.03 * CARBON_PRICE) / 1e7, 2)
    unadj_ccts_10pct = round((scope1_raw * 1000.0 * 0.10 * CARBON_PRICE) / 1e7, 2)
    adj_ccts_10pct = round((scope1_adj * 1000.0 * 0.10 * CARBON_PRICE) / 1e7, 2)
    
    ccts_risk_2021_2030 = 0.0
    ccts_risk_2040_10pct_adj = adj_ccts_10pct
    delta_ccts_cr_per_year = round(ccts_risk_2040_10pct_adj - ccts_risk_2021_2030, 2)
    
    # Total increase from 2021-2030 to 2040 (10% CCTS Case)
    delta_total_cr_per_year = round(delta_heat_cr_per_year + delta_water_coastal_cr_per_year + delta_ccts_cr_per_year, 2)
    pct_from_heat = round((delta_heat_cr_per_year / delta_total_cr_per_year) * 100.0, 1) if delta_total_cr_per_year > 0 else 0.0
    pct_from_water_coastal = round((delta_water_coastal_cr_per_year / delta_total_cr_per_year) * 100.0, 1) if delta_total_cr_per_year > 0 else 0.0
    pct_from_ccts = round((delta_ccts_cr_per_year / delta_total_cr_per_year) * 100.0, 1) if delta_total_cr_per_year > 0 else 0.0
    
    # Total sum of components (explicitly labeled breakdown, no unlabelled single headline)
    sum_components_2021_2030 = round(heat_ebitda_risk_2021_2030 + water_coastal_ebitda_risk_2021_2030 + ccts_risk_2021_2030, 2)
    sum_components_2040_10pct_adj = round(heat_ebitda_risk_2040 + water_coastal_ebitda_risk_2040 + ccts_risk_2040_10pct_adj, 2)
    
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
        
        "physical_climate_data": {
            "time_windows": {
                "baseline_window": "2021–2030 model average",
                "future_window": "2036–2045 model average (representing 2040)"
            },
            "models_used": ["EC_Earth3P_HR", "MRI_AGCM3_2_S"],
            "model_bias_correction_status": "uncorrected raw CMIP6 grid outputs",
            "days_above_40c_2021_2030_avg": d40_2021_2030,
            "days_above_40c_2040_avg": d40_2040,
            "days_above_40c_trend_delta": days_40c_trend_delta,
            "days_above_40c_trend_falls": days_40c_trend_falls,
            "days_above_40c_trend_note": days_40c_trend_note,
            "days_above_43c_2021_2030_avg": d43_2021_2030,
            "days_above_43c_2040_avg": d43_2040,
            "acute_extreme_heat_flags": {
                "flag_43c_exceeds_25_days_2021_2030": flag_43c_exceeds_25_2021_2030,
                "flag_43c_exceeds_25_days_2040": flag_43c_exceeds_25_2040,
                "threshold_days_per_year": 25.0
            },
            "annual_precipitation_mm_2021_2030": precip_2021_2030,
            "annual_precipitation_mm_2040": precip_2040,
            "hydrological_context_flood_api": {
                "river_discharge_mean_m3s": flood_ctx.get('river_discharge_mean_m3s'),
                "river_discharge_max_m3s": flood_ctx.get('river_discharge_max_m3s'),
                "feeds_money_calculation": False,
                "note": "Open-Meteo Flood API river discharge provides hydrological context only and does NOT feed into downtime days or financial losses."
            },
            "water_and_coastal_assessment": wc_info
        },
        
        "operational_downtime_days_by_hazard": {
            "period_2021_2030_model_average": {
                "heat_lost_days_api_based": heat_lost_2021_2030,
                "water_lost_days_judgement": water_lost_2021_2030,
                "coastal_lost_days_judgement": coastal_lost_2021_2030,
                "total_lost_operating_days": total_lost_days_2021_2030
            },
            "horizon_2040_model_average": {
                "heat_lost_days_api_based": heat_lost_2040,
                "water_lost_days_judgement": water_lost_2040,
                "coastal_lost_days_judgement": coastal_lost_2040,
                "total_lost_operating_days": total_lost_days_2040
            }
        },
        
        "three_component_financial_exposure_inr_cr_per_year": {
            "rates": {
                "daily_revenue_inr_cr_per_day": round(daily_rev_cr, 4),
                "daily_ebitda_inr_cr_per_day": round(daily_ebitda_cr, 4)
            },
            "period_2021_2030_model_average": {
                "heat_component_api_based_inr_cr_per_year": heat_ebitda_risk_2021_2030,
                "water_coastal_component_judgement_inr_cr_per_year": water_coastal_ebitda_risk_2021_2030,
                "ccts_component_assumption_inr_cr_per_year": ccts_risk_2021_2030,
                "ccts_2021_2030_status": "unverified assumption (pending regulatory compliance schedule)",
                "component_breakdown_sum_inr_cr_per_year": sum_components_2021_2030
            },
            "horizon_2040": {
                "heat_component_api_based_inr_cr_per_year": heat_ebitda_risk_2040,
                "water_coastal_component_judgement_inr_cr_per_year": water_coastal_ebitda_risk_2040,
                "ccts_component_case_10pct_adjusted_inr_cr_per_year": adj_ccts_10pct,
                "ccts_component_case_10pct_unadjusted_inr_cr_per_year": unadj_ccts_10pct,
                "ccts_component_case_3pct_adjusted_inr_cr_per_year": adj_ccts_3pct,
                "component_breakdown_sum_10pct_adjusted_inr_cr_per_year": sum_components_2040_10pct_adj
            },
            "increase_attribution_2021_2030_to_2040_inr_cr_per_year": {
                "delta_heat_component_inr_cr_per_year": delta_heat_cr_per_year,
                "delta_water_coastal_component_inr_cr_per_year": delta_water_coastal_cr_per_year,
                "delta_ccts_component_inr_cr_per_year": delta_ccts_cr_per_year,
                "delta_total_inr_cr_per_year": delta_total_cr_per_year,
                "pct_of_increase_from_heat": pct_from_heat,
                "pct_of_increase_from_water_coastal": pct_from_water_coastal,
                "pct_of_increase_from_ccts": pct_from_ccts
            }
        }
    }
    plants_enriched.append(plant_entry)

# 7. Portfolio Aggregations across Three Components
fleet_heat_2021_2030 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['period_2021_2030_model_average']['heat_component_api_based_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_water_coastal_2021_2030 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['period_2021_2030_model_average']['water_coastal_component_judgement_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_2021_2030 = 0.0
fleet_total_2021_2030 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['period_2021_2030_model_average']['component_breakdown_sum_inr_cr_per_year'] for p in plants_enriched), 2)

fleet_heat_2040 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['heat_component_api_based_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_water_coastal_2040 = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['water_coastal_component_judgement_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_10pct_adj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_10pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_10pct_unadj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_10pct_unadjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_3pct_adj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_3pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)
fleet_ccts_3pct_unadj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['ccts_component_case_3pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)

fleet_total_2040_10pct_adj = round(sum(p['three_component_financial_exposure_inr_cr_per_year']['horizon_2040']['component_breakdown_sum_10pct_adjusted_inr_cr_per_year'] for p in plants_enriched), 2)

# Attribution of Fleet Increase
fleet_delta_heat = round(fleet_heat_2040 - fleet_heat_2021_2030, 2)
fleet_delta_water_coastal = round(fleet_water_coastal_2040 - fleet_water_coastal_2021_2030, 2)
fleet_delta_ccts = round(fleet_ccts_10pct_adj - fleet_ccts_2021_2030, 2)
fleet_delta_total = round(fleet_total_2040_10pct_adj - fleet_total_2021_2030, 2)

fleet_pct_from_heat = round((fleet_delta_heat / fleet_delta_total) * 100.0, 1)
fleet_pct_from_water_coastal = round((fleet_delta_water_coastal / fleet_delta_total) * 100.0, 1)
fleet_pct_from_ccts = round((fleet_delta_ccts / fleet_delta_total) * 100.0, 1)

# Summary Verification
assert abs(fleet_heat_2021_2030 + fleet_water_coastal_2021_2030 - fleet_total_2021_2030) < 1e-4
assert abs(fleet_heat_2040 + fleet_water_coastal_2040 + fleet_ccts_10pct_adj - fleet_total_2040_10pct_adj) < 1e-4

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
    "three_component_fleet_exposure_inr_cr_per_year": {
        "period_2021_2030_model_average": {
            "heat_component_api_based_inr_cr_per_year": fleet_heat_2021_2030,
            "water_coastal_component_judgement_inr_cr_per_year": fleet_water_coastal_2021_2030,
            "ccts_component_assumption_inr_cr_per_year": fleet_ccts_2021_2030,
            "ccts_2021_2030_status": "unverified assumption (pending regulatory compliance schedule)",
            "component_breakdown_sum_inr_cr_per_year": fleet_total_2021_2030,
            "exposure_rate_vs_asset_base_pct_per_year": round((fleet_total_2021_2030 / total_asset_val) * 100.0, 2)
        },
        "horizon_2040": {
            "heat_component_api_based_inr_cr_per_year": fleet_heat_2040,
            "water_coastal_component_judgement_inr_cr_per_year": fleet_water_coastal_2040,
            "ccts_component_case_10pct_adjusted_inr_cr_per_year": fleet_ccts_10pct_adj,
            "ccts_component_case_10pct_unadjusted_inr_cr_per_year": fleet_ccts_10pct_unadj,
            "ccts_component_case_3pct_adjusted_inr_cr_per_year": fleet_ccts_3pct_adj,
            "component_breakdown_sum_10pct_adjusted_inr_cr_per_year": fleet_total_2040_10pct_adj,
            "exposure_rate_vs_asset_base_pct_per_year": round((fleet_total_2040_10pct_adj / total_asset_val) * 100.0, 2)
        },
        "fleet_increase_attribution_2021_2030_to_2040": {
            "delta_heat_component_inr_cr_per_year": fleet_delta_heat,
            "delta_water_coastal_component_inr_cr_per_year": fleet_delta_water_coastal,
            "delta_ccts_component_inr_cr_per_year": fleet_delta_ccts,
            "delta_total_inr_cr_per_year": fleet_delta_total,
            "pct_of_increase_from_heat": fleet_pct_from_heat,
            "pct_of_increase_from_water_coastal": fleet_pct_from_water_coastal,
            "pct_of_increase_from_ccts": fleet_pct_from_ccts
        }
    }
}

full_output = {
    "metadata": {
        "company": "Nimbus Cement Ltd",
        "author": "Meera Iyer (Head of Sustainability)",
        "purpose": "Climate Exposure & Transition Risk Ledger: 2021–2030 Model Average vs 2040",
        "audit_version": "v3.0-audited",
        "ccts_methodology_statement": "CCTS here = emissions × % cut × price, with no abatement and no growth to 2040, as a placeholder pending plant baselines.",
        "calculation_rules": assumptions["metadata_rules"]
    },
    "assumptions_reference": "assumptions.json",
    "portfolio_summary": portfolio_summary,
    "plants": plants_enriched
}

with open('assumptions.json', 'w') as f:
    json.dump(assumptions, f, indent=2)

with open('enriched_plants_data.json', 'w') as f:
    json.dump(full_output, f, indent=2)

print("V3 build complete!")
print(f"2021-2030 Fleet: Heat={fleet_heat_2021_2030}, Water+Coastal={fleet_water_coastal_2021_2030}, CCTS={fleet_ccts_2021_2030} -> Total={fleet_total_2021_2030} Cr/yr")
print(f"2040 Fleet: Heat={fleet_heat_2040}, Water+Coastal={fleet_water_coastal_2040}, CCTS={fleet_ccts_10pct_adj} -> Total={fleet_total_2040_10pct_adj} Cr/yr")
print(f"Attribution: Heat=+{fleet_delta_heat} Cr/yr ({fleet_pct_from_heat}%), Water+Coastal=+{fleet_delta_water_coastal} Cr/yr ({fleet_pct_from_water_coastal}%), CCTS=+{fleet_delta_ccts} Cr/yr ({fleet_pct_from_ccts}%)")
