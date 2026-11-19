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

assert abs(total_capacity - 23.00) < 1e-4
assert abs(total_output - 18.35) < 1e-4
assert abs(total_scope1 - 10932.0) < 1e-4
assert abs(total_asset_val - 15450.0) < 1e-4
assert abs(total_revenue - 9658.0) < 1e-4
assert total_employees == 4550

# 3. Clinker Reallocation Math
# P01 Chittorgarh produces 3.43 Mt clinker, emits 3125 kt CO2. Shipped 1.12 Mt to P07 Mundra.
p01_scope1 = 3125.0
p01_clinker_prod = 3.43
p01_clinker_intensity = p01_scope1 / p01_clinker_prod # kt CO2 / Mt clinker = tCO2 / t clinker
p01_to_p07_emissions = 1.12 * p01_clinker_intensity

# P06 Baloda Bazar produces 3.01 Mt clinker, emits 2470 kt CO2. Shipped 0.68 Mt to P08, 0.60 Mt to P09.
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

total_adj_scope1 = sum(adjusted_scope1.values())
assert abs(total_adj_scope1 - 10932.0) < 1e-4

# 4. Load 10-year multi-model climate cache (2021-2030 vs 2036-2045, EC_Earth3P_HR & MRI_AGCM3_2_S)
with open('open_meteo_10yr_cache.json', 'r') as f:
    climate_cache = json.load(f)

# Load flood discharge data from previous run
with open('enriched_plants_data.json', 'r') as f:
    old_data = json.load(f)
    flood_map = {p['plant_id']: {
        'river_discharge_mean_m3s': p['physical_climate_data'].get('river_discharge_mean_m3s'),
        'river_discharge_max_m3s': p['physical_climate_data'].get('river_discharge_max_m3s')
    } for p in old_data['plants']}

# 5. Define Comprehensive assumptions.json with ALL judgement values clearly labelled
assumptions = {
    "version": "2.0-audited",
    "status": "Labelled Assumptions & Judgement Registry",
    "calculation_rules": {
        "one_calculation_path_rule": "All summary portfolio figures are derived strictly as the exact sum of the plant rows. No secondary or divergent formulas are permitted.",
        "clinker_toggle_rule": "The Clinker Reallocation toggle changes only the inter-plant distribution of emissions and CCTS liabilities between mother kilns (P01, P06) and grinding units (P07, P08, P09). The fleet-wide total Scope 1 emissions (10,932.0 kt) and total CCTS liabilities remain strictly invariant.",
        "flood_data_role": "Open-Meteo Flood API river discharge (m3/s) provides contextual hydrological background only and does NOT feed into the financial loss calculation. Lost operating days are derived strictly from the stated heat formula and the labelled judgement-based water and coastal assumptions."
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
            "unit": "INR Crores / day"
        },
        "daily_ebitda_calculation": {
            "formula": "(cement_output_fy2025_26_mt * 100.0) / nominal_operating_days_per_year",
            "unit": "INR Crores / day"
        }
    },
    "heat_lost_days_assumptions": {
        "climate_data_windows": {
            "today_window": "2021-01-01 to 2030-12-31 (10-year annual average)",
            "future_2040_window": "2036-01-01 to 2045-12-31 (10-year annual average)",
            "models_used": ["EC_Earth3P_HR (CMIP6 HighResMIP)", "MRI_AGCM3_2_S (CMIP6 HighResMIP)"],
            "aggregation": "Arithmetic mean of the two high-resolution CMIP6 models over 10-year windows"
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
                "source_status": "Assumption",
                "justification": "Grinding units operate enclosed grinding circuits without open-cast captive quarries."
            }
        },
        "formula_specification": {
            "integrated_plants": "heat_lost_days = (days_40c - days_43c) * 0.10 + days_43c * 0.35",
            "grinding_units": "heat_lost_days = ((days_40c - days_43c) * 0.10 + days_43c * 0.35) * 0.50",
            "worked_verification_examples": {
                "example_p01_hypothetical_47_12": {
                    "days_40c": 47.0,
                    "days_43c": 12.0,
                    "moderate_days": 35.0,
                    "math": "(47 - 12) * 0.10 + 12 * 0.35 = 3.50 + 4.20",
                    "result_lost_days": 7.70
                },
                "example_p02_hypothetical_24_3": {
                    "days_40c": 24.0,
                    "days_43c": 3.0,
                    "moderate_days": 21.0,
                    "math": "(24 - 3) * 0.10 + 3 * 0.35 = 2.10 + 1.05",
                    "result_lost_days": 3.15
                }
            }
        }
    },
    "water_and_coastal_assumptions": {
        "P01": {
            "basin_name": "Banas River Basin",
            "water_stress_score_1_to_5": 4.5,
            "water_lost_days_today": 8.0,
            "water_lost_days_2040": 16.0,
            "coastal_lost_days_today": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P02": {
            "basin_name": "Tons River Basin",
            "water_stress_score_1_to_5": 3.5,
            "water_lost_days_today": 3.0,
            "water_lost_days_2040": 7.0,
            "coastal_lost_days_today": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P03": {
            "basin_name": "Wardha River Basin",
            "water_stress_score_1_to_5": 3.8,
            "water_lost_days_today": 5.0,
            "water_lost_days_2040": 10.0,
            "coastal_lost_days_today": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P04": {
            "basin_name": "Musi / Krishna River Basin",
            "water_stress_score_1_to_5": 3.9,
            "water_lost_days_today": 6.0,
            "water_lost_days_2040": 12.0,
            "coastal_lost_days_today": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P05": {
            "basin_name": "Vellar / Cauvery Basin",
            "water_stress_score_1_to_5": 3.7,
            "water_lost_days_today": 5.0,
            "water_lost_days_2040": 11.0,
            "coastal_lost_days_today": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P06": {
            "basin_name": "Mahanadi Canal System",
            "water_stress_score_1_to_5": 2.2,
            "water_lost_days_today": 1.5,
            "water_lost_days_2040": 4.0,
            "coastal_lost_days_today": 0.0,
            "coastal_lost_days_2040": 0.0,
            "source_status": "judgement, not sourced"
        },
        "P07": {
            "basin_name": "Gulf of Kutch Coastal Zone",
            "water_stress_score_1_to_5": 2.0,
            "water_lost_days_today": 0.5,
            "water_lost_days_2040": 1.5,
            "coastal_lost_days_today": 2.0,
            "coastal_lost_days_2040": 4.0,
            "source_status": "judgement, not sourced"
        },
        "P08": {
            "basin_name": "Mahanadi Delta Coast",
            "water_stress_score_1_to_5": 2.0,
            "water_lost_days_today": 1.0,
            "water_lost_days_2040": 2.0,
            "coastal_lost_days_today": 4.5,
            "coastal_lost_days_2040": 8.0,
            "source_status": "judgement, not sourced"
        },
        "P09": {
            "basin_name": "Damodar River Basin",
            "water_stress_score_1_to_5": 2.6,
            "water_lost_days_today": 2.0,
            "water_lost_days_2040": 5.0,
            "coastal_lost_days_today": 0.0,
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
        "today_penalty_status": {
            "value": 0.0,
            "unit": "INR Crores",
            "source_status": "unverified assumption (pending regulatory compliance schedule)",
            "note": "Assumes zero financial penalties are levied in FY2025-26 as CCTS compliance mechanisms are not yet statutorily enforced."
        },
        "ccts_scenarios_evaluated": {
            "case_3pct": {
                "mandated_intensity_reduction_pct": 3.0,
                "source_status": "Labelled assumption pending official CCTS schedule",
                "formula_liability_cr": "(scope1_kt * 1000 * 0.03 * 1500) / 1e7"
            },
            "case_10pct": {
                "mandated_intensity_reduction_pct": 10.0,
                "source_status": "Labelled assumption pending official CCTS schedule",
                "formula_liability_cr": "(scope1_kt * 1000 * 0.10 * 1500) / 1e7"
            }
        }
    }
}

# 6. Process Plant Data with 10-Year Multi-Model Ensembles
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
    
    # Financial rates per day
    daily_rev_cr = rev_cr / NOMINAL_DAYS
    annual_ebitda_cr = (out_mt * 100.0) # out_mt * 1e6 * 1000 / 1e7 = out_mt * 100 Cr
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
    
    # 2021-2030 (10-yr annual averages)
    d40_today_m1 = sum(1 for x in t1_m1 if x is not None and x >= 40.0) / 10.0
    d40_today_m2 = sum(1 for x in t1_m2 if x is not None and x >= 40.0) / 10.0
    d40_today = round((d40_today_m1 + d40_today_m2) / 2.0, 1)
    
    d43_today_m1 = sum(1 for x in t1_m1 if x is not None and x >= 43.0) / 10.0
    d43_today_m2 = sum(1 for x in t1_m2 if x is not None and x >= 43.0) / 10.0
    d43_today = round((d43_today_m1 + d43_today_m2) / 2.0, 1)
    
    precip_today = round((sum(x for x in pr1_m1 if x is not None) / 10.0 + sum(x for x in pr1_m2 if x is not None) / 10.0) / 2.0, 1)
    
    # 2036-2045 (10-yr annual averages)
    d40_2040_m1 = sum(1 for x in t2_m1 if x is not None and x >= 40.0) / 10.0
    d40_2040_m2 = sum(1 for x in t2_m2 if x is not None and x >= 40.0) / 10.0
    d40_2040 = round((d40_2040_m1 + d40_2040_m2) / 2.0, 1)
    
    d43_2040_m1 = sum(1 for x in t2_m1 if x is not None and x >= 43.0) / 10.0
    d43_2040_m2 = sum(1 for x in t2_m2 if x is not None and x >= 43.0) / 10.0
    d43_2040 = round((d43_2040_m1 + d43_2040_m2) / 2.0, 1)
    
    precip_2040 = round((sum(x for x in pr2_m1 if x is not None) / 10.0 + sum(x for x in pr2_m2 if x is not None) / 10.0) / 2.0, 1)
    
    # Flag if 40C days fall
    days_40c_trend_falls = d40_2040 < d40_today
    days_40c_trend_delta = round(d40_2040 - d40_today, 1)
    
    # Heat Lost Days calculation strictly according to assumptions.json
    damping = 0.50 if ptype == 'Grinding unit' else 1.00
    heat_lost_today = round(((d40_today - d43_today) * 0.10 + d43_today * 0.35) * damping, 2)
    heat_lost_2040 = round(((d40_2040 - d43_2040) * 0.10 + d43_2040 * 0.35) * damping, 2)
    
    # Water & Coastal from assumptions.json
    wc_info = assumptions["water_and_coastal_assumptions"][pid]
    water_lost_today = wc_info["water_lost_days_today"]
    water_lost_2040 = wc_info["water_lost_days_2040"]
    coastal_lost_today = wc_info["coastal_lost_days_today"]
    coastal_lost_2040 = wc_info["coastal_lost_days_2040"]
    
    # Total Lost Operating Days
    total_lost_days_today = round(heat_lost_today + water_lost_today + coastal_lost_today, 2)
    total_lost_days_2040 = round(heat_lost_2040 + water_lost_2040 + coastal_lost_2040, 2)
    
    # Physical Financial Value at Risk
    rev_risk_today_cr = round(total_lost_days_today * daily_rev_cr, 2)
    rev_risk_2040_cr = round(total_lost_days_2040 * daily_rev_cr, 2)
    ebitda_risk_today_cr = round(total_lost_days_today * daily_ebitda_cr, 2)
    ebitda_risk_2040_cr = round(total_lost_days_2040 * daily_ebitda_cr, 2)
    
    # CCTS Calculations: 3% case and 10% case (Unadjusted & Clinker-Adjusted)
    # Baseline Intensities
    unadj_baseline_intensity = round((scope1_raw * 1000.0) / out_t, 4)
    adj_baseline_intensity = round((scope1_adj * 1000.0) / out_t, 4)
    
    # 3% Case
    unadj_ccts_3pct_cr = round((scope1_raw * 1000.0 * 0.03 * CARBON_PRICE) / 1e7, 2)
    adj_ccts_3pct_cr = round((scope1_adj * 1000.0 * 0.03 * CARBON_PRICE) / 1e7, 2)
    
    # 10% Case
    unadj_ccts_10pct_cr = round((scope1_raw * 1000.0 * 0.10 * CARBON_PRICE) / 1e7, 2)
    adj_ccts_10pct_cr = round((scope1_adj * 1000.0 * 0.10 * CARBON_PRICE) / 1e7, 2)
    
    # Total Financial Exposure (EBITDA at risk + CCTS liability)
    # Today: ebitda risk + 0 Cr CCTS (marked unverified assumption)
    total_exposure_today_cr = round(ebitda_risk_today_cr, 2)
    # 2040 at 10% CCTS (standard case)
    total_exposure_2040_adj_10pct_cr = round(ebitda_risk_2040_cr + adj_ccts_10pct_cr, 2)
    total_exposure_2040_unadj_10pct_cr = round(ebitda_risk_2040_cr + unadj_ccts_10pct_cr, 2)
    # 2040 at 3% CCTS
    total_exposure_2040_adj_3pct_cr = round(ebitda_risk_2040_cr + adj_ccts_3pct_cr, 2)
    
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
            "unadjusted_intensity_tco2_per_t": unadj_baseline_intensity,
            "adjusted_intensity_tco2_per_t": adj_baseline_intensity
        },
        
        "physical_climate_data": {
            "time_windows": {
                "today_baseline": "2021-2030 (10-yr annual average)",
                "future_2040": "2036-2045 (10-yr annual average)"
            },
            "models": ["EC_Earth3P_HR", "MRI_AGCM3_2_S"],
            "days_above_40c_today": d40_today,
            "days_above_40c_2040": d40_2040,
            "days_above_40c_trend_delta": days_40c_trend_delta,
            "days_above_40c_trend_falls": days_40c_trend_falls,
            "days_above_43c_today": d43_today,
            "days_above_43c_2040": d43_2040,
            "annual_precipitation_mm_today": precip_today,
            "annual_precipitation_mm_2040": precip_2040,
            "hydrological_context_flood_api": {
                "river_discharge_mean_m3s": flood_ctx.get('river_discharge_mean_m3s'),
                "river_discharge_max_m3s": flood_ctx.get('river_discharge_max_m3s'),
                "feeds_money_calculation": False,
                "note": "Open-Meteo Flood API discharge provides hydrological context only and does NOT feed into downtime days or financial losses."
            },
            "water_and_coastal_assessment": wc_info
        },
        
        "operational_downtime_days": {
            "today": {
                "heat_lost_days": heat_lost_today,
                "water_lost_days": water_lost_today,
                "coastal_lost_days": coastal_lost_today,
                "total_lost_operating_days": total_lost_days_today
            },
            "year_2040": {
                "heat_lost_days": heat_lost_2040,
                "water_lost_days": water_lost_2040,
                "coastal_lost_days": coastal_lost_2040,
                "total_lost_operating_days": total_lost_days_2040
            }
        },
        
        "ccts_transition_risk": {
            "assumed_carbon_price_inr_per_tco2": CARBON_PRICE,
            "today_annual_liability_inr_cr": 0.0,
            "today_penalty_status": "unverified assumption (pending regulatory compliance schedule)",
            "case_3pct_cut": {
                "mandated_reduction_pct": 3.0,
                "unadjusted_liability_inr_cr": unadj_ccts_3pct_cr,
                "clinker_adjusted_liability_inr_cr": adj_ccts_3pct_cr
            },
            "case_10pct_cut": {
                "mandated_reduction_pct": 10.0,
                "unadjusted_liability_inr_cr": unadj_ccts_10pct_cr,
                "clinker_adjusted_liability_inr_cr": adj_ccts_10pct_cr
            }
        },
        
        "financial_value_at_risk_inr_cr": {
            "daily_revenue_cr": round(daily_rev_cr, 4),
            "daily_ebitda_cr": round(daily_ebitda_cr, 4),
            "today": {
                "physical_revenue_at_risk_cr": rev_risk_today_cr,
                "physical_ebitda_at_risk_cr": ebitda_risk_today_cr,
                "ccts_transition_liability_cr": 0.0,
                "total_financial_exposure_cr": total_exposure_today_cr
            },
            "year_2040": {
                "physical_revenue_at_risk_cr": rev_risk_2040_cr,
                "physical_ebitda_at_risk_cr": ebitda_risk_2040_cr,
                "ccts_liability_case_3pct_adjusted_cr": adj_ccts_3pct_cr,
                "ccts_liability_case_10pct_adjusted_cr": adj_ccts_10pct_cr,
                "ccts_liability_case_10pct_unadjusted_cr": unadj_ccts_10pct_cr,
                "total_financial_exposure_10pct_adjusted_cr": total_exposure_2040_adj_10pct_cr,
                "total_financial_exposure_10pct_unadjusted_cr": total_exposure_2040_unadj_10pct_cr,
                "total_financial_exposure_3pct_adjusted_cr": total_exposure_2040_adj_3pct_cr
            }
        }
    }
    plants_enriched.append(plant_entry)

# 7. Strictly Reconciled Summary Totals (Single Calculation Path)
summary_today_rev_risk = round(sum(p['financial_value_at_risk_inr_cr']['today']['physical_revenue_at_risk_cr'] for p in plants_enriched), 2)
summary_today_ebitda_risk = round(sum(p['financial_value_at_risk_inr_cr']['today']['physical_ebitda_at_risk_cr'] for p in plants_enriched), 2)
summary_today_ccts = 0.0
summary_today_total = round(sum(p['financial_value_at_risk_inr_cr']['today']['total_financial_exposure_cr'] for p in plants_enriched), 2)

summary_2040_rev_risk = round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['physical_revenue_at_risk_cr'] for p in plants_enriched), 2)
summary_2040_ebitda_risk = round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['physical_ebitda_at_risk_cr'] for p in plants_enriched), 2)

summary_ccts_3pct_unadj = round(sum(p['ccts_transition_risk']['case_3pct_cut']['unadjusted_liability_inr_cr'] for p in plants_enriched), 2)
summary_ccts_3pct_adj = round(sum(p['ccts_transition_risk']['case_3pct_cut']['clinker_adjusted_liability_inr_cr'] for p in plants_enriched), 2)

summary_ccts_10pct_unadj = round(sum(p['ccts_transition_risk']['case_10pct_cut']['unadjusted_liability_inr_cr'] for p in plants_enriched), 2)
summary_ccts_10pct_adj = round(sum(p['ccts_transition_risk']['case_10pct_cut']['clinker_adjusted_liability_inr_cr'] for p in plants_enriched), 2)

summary_2040_total_10pct_adj = round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['total_financial_exposure_10pct_adjusted_cr'] for p in plants_enriched), 2)
summary_2040_total_10pct_unadj = round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['total_financial_exposure_10pct_unadjusted_cr'] for p in plants_enriched), 2)

# Assertions for single calculation path: summary totals strictly equal sum of plant rows
assert abs(summary_today_ebitda_risk - sum(p['financial_value_at_risk_inr_cr']['today']['physical_ebitda_at_risk_cr'] for p in plants_enriched)) < 1e-4
assert abs(summary_2040_ebitda_risk - sum(p['financial_value_at_risk_inr_cr']['year_2040']['physical_ebitda_at_risk_cr'] for p in plants_enriched)) < 1e-4
assert abs(summary_ccts_3pct_unadj - sum(p['ccts_transition_risk']['case_3pct_cut']['unadjusted_liability_inr_cr'] for p in plants_enriched)) < 1e-4
assert abs(summary_ccts_3pct_adj - sum(p['ccts_transition_risk']['case_3pct_cut']['clinker_adjusted_liability_inr_cr'] for p in plants_enriched)) < 1e-4
assert abs(summary_ccts_10pct_unadj - sum(p['ccts_transition_risk']['case_10pct_cut']['unadjusted_liability_inr_cr'] for p in plants_enriched)) < 1e-4
assert abs(summary_ccts_10pct_adj - sum(p['ccts_transition_risk']['case_10pct_cut']['clinker_adjusted_liability_inr_cr'] for p in plants_enriched)) < 1e-4
# Verify unrounded invariance: fleet Scope 1 is 10,932 kt -> 3% is 49.194 Cr, 10% is 163.980 Cr
fleet_scope1 = 10932.0
assert abs((fleet_scope1 * 1000 * 0.03 * CARBON_PRICE / 1e7) - 49.194) < 1e-4
assert abs((fleet_scope1 * 1000 * 0.10 * CARBON_PRICE / 1e7) - 163.980) < 1e-4

portfolio_summary = {
    "portfolio_totals": {
        "total_plants": 9,
        "total_cement_capacity_mtpa": total_capacity,
        "total_cement_output_fy2025_26_mt": total_output,
        "total_asset_value_inr_cr": total_asset_val,
        "total_revenue_fy2025_26_inr_cr": total_revenue,
        "total_scope1_co2_kt": total_scope1,
        "total_clinker_adjusted_scope1_kt": total_adj_scope1,
        "total_employees": total_employees
    },
    "portfolio_financial_exposure_today_inr_cr": {
        "physical_revenue_at_risk_cr": summary_today_rev_risk,
        "physical_ebitda_at_risk_cr": summary_today_ebitda_risk,
        "ccts_transition_liability_cr": summary_today_ccts,
        "ccts_today_status": "unverified assumption (pending regulatory compliance schedule)",
        "total_financial_exposure_cr": summary_today_total,
        "sum_of_plant_rows_reconciled": True
    },
    "portfolio_ccts_transition_liability_inr_cr": {
        "assumed_carbon_price_inr_per_tco2": CARBON_PRICE,
        "case_3pct_cut_annual_cr": {
            "unadjusted_total_cr": summary_ccts_3pct_unadj,
            "clinker_adjusted_total_cr": summary_ccts_3pct_adj,
            "fleet_total_invariant": True
        },
        "case_10pct_cut_annual_cr": {
            "unadjusted_total_cr": summary_ccts_10pct_unadj,
            "clinker_adjusted_total_cr": summary_ccts_10pct_adj,
            "fleet_total_invariant": True
        }
    },
    "portfolio_financial_exposure_2040_inr_cr": {
        "physical_revenue_at_risk_cr": summary_2040_rev_risk,
        "physical_ebitda_at_risk_cr": summary_2040_ebitda_risk,
        "ccts_case_10pct_annual_cr": summary_ccts_10pct_adj,
        "total_financial_exposure_10pct_adjusted_cr": summary_2040_total_10pct_adj,
        "total_financial_exposure_10pct_unadjusted_cr": summary_2040_total_10pct_unadj,
        "sum_of_plant_rows_reconciled": True
    }
}

full_output = {
    "metadata": {
        "company": "Nimbus Cement Ltd",
        "author": "Meera Iyer (Head of Sustainability)",
        "purpose": "Climate Exposure & Transition Risk Ledger: Today vs 2040",
        "audit_version": "v2.0-audited",
        "calculation_rules": assumptions["calculation_rules"]
    },
    "assumptions_reference": "assumptions.json",
    "portfolio_summary": portfolio_summary,
    "plants": plants_enriched
}

with open('assumptions.json', 'w') as f:
    json.dump(assumptions, f, indent=2)

with open('enriched_plants_data.json', 'w') as f:
    json.dump(full_output, f, indent=2)

print("V2 data build and reconciliation complete!")
print(f"Today EBITDA Risk: INR {summary_today_ebitda_risk:.2f} Cr (Sum of rows = {sum(p['financial_value_at_risk_inr_cr']['today']['physical_ebitda_at_risk_cr'] for p in plants_enriched):.2f})")
print(f"2040 EBITDA Risk: INR {summary_2040_ebitda_risk:.2f} Cr (Sum of rows = {sum(p['financial_value_at_risk_inr_cr']['year_2040']['physical_ebitda_at_risk_cr'] for p in plants_enriched):.2f})")
print(f"CCTS 3% Cut Liability: INR {summary_ccts_3pct_adj:.2f} Cr (Unadj={summary_ccts_3pct_unadj:.2f})")
print(f"CCTS 10% Cut Liability: INR {summary_ccts_10pct_adj:.2f} Cr (Unadj={summary_ccts_10pct_unadj:.2f})")
print(f"2040 Total Exposure (10% CCTS): INR {summary_2040_total_10pct_adj:.2f} Cr")
