import csv
import json
import urllib.request
import time

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

assert abs(total_capacity - 23.00) < 1e-4, f"Capacity {total_capacity} != 23.00"
assert abs(total_output - 18.35) < 1e-4, f"Output {total_output} != 18.35"
assert abs(total_scope1 - 10932.0) < 1e-4, f"Scope 1 {total_scope1} != 10932.0"
assert abs(total_asset_val - 15450.0) < 1e-4, f"Asset Value {total_asset_val} != 15450.0"
assert abs(total_revenue - 9658.0) < 1e-4, f"Revenue {total_revenue} != 9658.0"
assert total_employees == 4550, f"Employees {total_employees} != 4550"

print("--- Step 1 Verification: All CSV Totals Match Expected ---")
print(f"Total Capacity: {total_capacity:.2f} Mt")
print(f"Total Output: {total_output:.2f} Mt")
print(f"Total Clinker Produced: {total_clinker_prod:.2f} Mt")
print(f"Total Clinker Shipped: {total_clinker_ship:.2f} Mt")
print(f"Total Scope 1 CO2: {total_scope1:.1f} kt")
print(f"Total Asset Value: INR {total_asset_val:.1f} Cr")
print(f"Total Revenue: INR {total_revenue:.1f} Cr")
print(f"Total Employees: {total_employees}")

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
print(f"\n--- Clinker Reallocation Check ---")
print(f"P01 to P07 moved: {p01_to_p07_emissions:.3f} kt CO2")
print(f"P06 to P08 moved: {p06_to_p08_emissions:.3f} kt CO2")
print(f"P06 to P09 moved: {p06_to_p09_emissions:.3f} kt CO2")
print(f"Total Adjusted Scope 1: {total_adj_scope1:.4f} kt")
assert abs(total_adj_scope1 - 10932.0) < 1e-4, f"Adjusted total {total_adj_scope1} != 10932.0"
print("ASSERTION PASSED: Total portfolio Scope 1 preserved exactly at 10,932.0 kt!")

# 4. Fetch Open-Meteo Climate and Flood Data
open_meteo_cache = {}
print("\nFetching real Open-Meteo Climate & Flood data for all 9 plant coordinates...")

for p in plants_raw:
    pid = p['plant_id']
    lat = p['latitude']
    lon = p['longitude']
    
    # Climate 2025 (Today baseline)
    url_2025 = f"https://climate-api.open-meteo.com/v1/climate?latitude={lat}&longitude={lon}&start_date=2025-01-01&end_date=2025-12-31&models=EC_Earth3P_HR&daily=temperature_2m_max,precipitation_sum"
    req25 = urllib.request.Request(url_2025, headers={'User-Agent': 'NimbusClimateRisk/1.0'})
    with urllib.request.urlopen(req25, timeout=20) as resp:
        d25 = json.loads(resp.read().decode())
    time.sleep(0.15)
    
    # Climate 2040 (Future projection)
    url_2040 = f"https://climate-api.open-meteo.com/v1/climate?latitude={lat}&longitude={lon}&start_date=2040-01-01&end_date=2040-12-31&models=EC_Earth3P_HR&daily=temperature_2m_max,precipitation_sum"
    req40 = urllib.request.Request(url_2040, headers={'User-Agent': 'NimbusClimateRisk/1.0'})
    with urllib.request.urlopen(req40, timeout=20) as resp:
        d40 = json.loads(resp.read().decode())
    time.sleep(0.15)
    
    # Flood API
    flood_url = f"https://flood-api.open-meteo.com/v1/flood?latitude={lat}&longitude={lon}&daily=river_discharge"
    req_f = urllib.request.Request(flood_url, headers={'User-Agent': 'NimbusClimateRisk/1.0'})
    try:
        with urllib.request.urlopen(req_f, timeout=20) as resp:
            df = json.loads(resp.read().decode())
            discharges = [x for x in df.get('daily', {}).get('river_discharge', []) if x is not None]
            avg_q = sum(discharges)/len(discharges) if discharges else None
            max_q = max(discharges) if discharges else None
    except Exception as e:
        avg_q, max_q = None, None
    time.sleep(0.15)
    
    tmax25 = d25['daily'].get('temperature_2m_max_EC_Earth3P_HR', d25['daily'].get('temperature_2m_max', []))
    tmax40 = d40['daily'].get('temperature_2m_max_EC_Earth3P_HR', d40['daily'].get('temperature_2m_max', []))
    precip25 = d25['daily'].get('precipitation_sum_EC_Earth3P_HR', d25['daily'].get('precipitation_sum', []))
    precip40 = d40['daily'].get('precipitation_sum_EC_Earth3P_HR', d40['daily'].get('precipitation_sum', []))
    
    open_meteo_cache[pid] = {
        'days_above_40c_today': sum(1 for t in tmax25 if t is not None and t >= 40.0),
        'days_above_40c_2040': sum(1 for t in tmax40 if t is not None and t >= 40.0),
        'days_above_43c_today': sum(1 for t in tmax25 if t is not None and t >= 43.0),
        'days_above_43c_2040': sum(1 for t in tmax40 if t is not None and t >= 43.0),
        'precip_annual_mm_today': round(sum(pr for pr in precip25 if pr is not None), 1),
        'precip_annual_mm_2040': round(sum(pr for pr in precip40 if pr is not None), 1),
        'river_discharge_mean_m3s': round(avg_q, 2) if avg_q is not None else None,
        'river_discharge_max_m3s': round(max_q, 2) if max_q is not None else None,
    }
    print(f"Fetched {pid} ({p['town']}): Days>=40C 2025={open_meteo_cache[pid]['days_above_40c_today']}, 2040={open_meteo_cache[pid]['days_above_40c_2040']}, Flood max={open_meteo_cache[pid]['river_discharge_max_m3s']} m3/s")

# 5. Labelled Water Source & Coastal Lookup Matrix
# Labelled lookup defining water vulnerability based on water_source, hydrogeology, and coastal position
WATER_COASTAL_LOOKUP = {
    'P01': {
        'basin_name': 'Banas River Basin (Chambal sub-basin)',
        'water_stress_category': 'Extremely High',
        'water_stress_score_1_to_5': 4.6,
        'water_source_vulnerability': 'Critical groundwater overdraft (CGWB over-exploited assessment unit); deep aquifer depletion requires emergency de-watering & tanker reliance during April-June.',
        'coastal_cyclone_risk_score': 1.0,
        'water_lost_days_today': 8.0,
        'water_lost_days_2040': 16.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    },
    'P02': {
        'basin_name': 'Tons River Basin (Ganga tributary)',
        'water_stress_category': 'High',
        'water_stress_score_1_to_5': 3.5,
        'water_source_vulnerability': 'Reservoir dependent; vulnerable to inter-annual monsoon failures causing reservoir dead-storage levels in late dry season.',
        'coastal_cyclone_risk_score': 1.0,
        'water_lost_days_today': 3.0,
        'water_lost_days_2040': 7.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    },
    'P03': {
        'basin_name': 'Wardha River Basin (Godavari sub-basin)',
        'water_stress_category': 'High',
        'water_stress_score_1_to_5': 3.8,
        'water_source_vulnerability': 'River Wardha seasonal drying; acute industrial water competition with upstream thermal power stations and coal mines in Chandrapur belt.',
        'coastal_cyclone_risk_score': 1.0,
        'water_lost_days_today': 5.0,
        'water_lost_days_2040': 10.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    },
    'P04': {
        'basin_name': 'Musi / Krishna River Basin',
        'water_stress_category': 'High',
        'water_stress_score_1_to_5': 3.9,
        'water_source_vulnerability': 'Groundwater dependent hard-rock crystalline aquifer with low storage capacity; water table drops sharply in drought years.',
        'coastal_cyclone_risk_score': 1.0,
        'water_lost_days_today': 6.0,
        'water_lost_days_2040': 12.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    },
    'P05': {
        'basin_name': 'Vellar / Cauvery Delta Fringe Basin',
        'water_stress_category': 'High',
        'water_stress_score_1_to_5': 3.7,
        'water_source_vulnerability': 'Groundwater dependent in semi-arid sedimentary tract; intense agricultural extraction creates competitive water rationing.',
        'coastal_cyclone_risk_score': 1.2,
        'water_lost_days_today': 5.0,
        'water_lost_days_2040': 11.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    },
    'P06': {
        'basin_name': 'Mahanadi Main Stem Canal System',
        'water_stress_category': 'Low-Medium',
        'water_stress_score_1_to_5': 2.2,
        'water_source_vulnerability': 'Canal fed by Mahanadi irrigation network; stable baseline supply but exposed to upstream reservoir priority allocation for agriculture during dry spells.',
        'coastal_cyclone_risk_score': 1.0,
        'water_lost_days_today': 1.5,
        'water_lost_days_2040': 4.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    },
    'P07': {
        'basin_name': 'Gulf of Kutch Coastal Zone',
        'water_stress_category': 'Low (Physical freshwater decoupled via Desalination)',
        'water_stress_score_1_to_5': 2.0,
        'water_source_vulnerability': 'Desalinated seawater eliminates inland freshwater hydrological drought risk, but operational continuity depends on high electrical power availability and membrane maintenance. Coastal location exposes site to cyclones and storm surge.',
        'coastal_cyclone_risk_score': 3.5,
        'water_lost_days_today': 0.5,
        'water_lost_days_2040': 1.5,
        'coastal_lost_days_today': 2.0,
        'coastal_lost_days_2040': 4.0,
    },
    'P08': {
        'basin_name': 'Mahanadi Estuary / Bay of Bengal Coast',
        'water_stress_category': 'Low-Medium',
        'water_stress_score_1_to_5': 2.0,
        'water_source_vulnerability': 'Municipal supply from Mahanadi delta; low physical freshwater risk, but extreme vulnerability to Bay of Bengal tropical cyclones, tidal storm surge, and delta inundation (Open-Meteo flood peak discharge 1,748 m3/s).',
        'coastal_cyclone_risk_score': 4.8,
        'water_lost_days_today': 1.0,
        'water_lost_days_2040': 2.0,
        'coastal_lost_days_today': 4.5,
        'coastal_lost_days_2040': 8.0,
    },
    'P09': {
        'basin_name': 'Damodar River Basin',
        'water_stress_category': 'Medium',
        'water_stress_score_1_to_5': 2.6,
        'water_source_vulnerability': 'River Damodar regulated by Damodar Valley Corporation (DVC) dams; industrial water allocation priority is relatively secure, seasonal low flows mitigated by upstream reservoirs.',
        'coastal_cyclone_risk_score': 1.0,
        'water_lost_days_today': 2.0,
        'water_lost_days_2040': 5.0,
        'coastal_lost_days_today': 0.0,
        'coastal_lost_days_2040': 0.0,
    }
}

# 6. Assumptions Definition
assumptions = {
    "version": "1.0-draft",
    "status": "Labelled Assumptions Pending Official CCTS Gazette & Site Operating Audits",
    "financial_assumptions": {
        "nominal_operating_days_per_year": {
            "value": 330,
            "unit": "days",
            "source_status": "Assumption",
            "justification": "Standard Indian cement manufacturing benchmark allowing 35 days for annual planned kiln maintenance, refractory relining, and statutory overhauls."
        },
        "industry_ebitda_margin_per_tonne": {
            "value": 1000.0,
            "unit": "INR / tonne cement",
            "source_status": "Assumption",
            "justification": "Median EBITDA margin reported by leading listed Indian cement manufacturers (UltraTech, Shree Cement, Ambuja) over FY2023-FY2025 (~18-20% margin on average realization of INR 5,263/t)."
        },
        "daily_revenue_calculation": {
            "formula": "plant_revenue_fy2025_26_inr_cr / nominal_operating_days_per_year",
            "unit": "INR Crores / operating day"
        },
        "daily_ebitda_calculation": {
            "formula": "(cement_output_fy2025_26_mt * 1e6 * ebitda_margin_per_tonne / 1e7) / nominal_operating_days_per_year",
            "unit": "INR Crores / operating day"
        }
    },
    "ccts_transition_risk_assumptions": {
        "ccts_compliance_mechanism": "Plant-Level Specific Emission Intensity (GEI) Baseline",
        "mandated_reduction_target_pct": {
            "value": 10.0,
            "unit": "% cut from FY2025-26 baseline",
            "source_status": "Assumption pending official BEE CCTS trajectory",
            "justification": "Reflects Bureau of Energy Efficiency (BEE) target trajectory under Carbon Credit Trading Scheme (CCTS) Phase 2/3 for designated industrial consumers (analogous to PAT scheme cycle targets requiring 8-12% specific intensity cuts)."
        },
        "assumed_carbon_price_per_tco2": {
            "value": 1500.0,
            "unit": "INR / tCO2",
            "source_status": "Assumption",
            "justification": "Based on BEE initial steering committee discussion bounds and global emerging ETS analog pricing (~USD 18.00 / tCO2)."
        },
        "ccts_enforcement_status_today": {
            "value": 0.0,
            "unit": "INR Crores",
            "justification": "CCTS is currently in readiness / voluntary phase in FY2025-26; financial penalties for deficit tonnes apply upon compliance year enforcement (projected 2028-2030 onwards)."
        }
    },
    "physical_risk_assumptions": {
        "heat_shutdown_thresholds": {
            "moderate_heat_threshold_celsius": 40.0,
            "extreme_heat_threshold_celsius": 43.0,
            "heat_derating_factor_moderate": {
                "value": 0.10,
                "unit": "equivalent operating day lost per day >= 40C",
                "justification": "Mandated occupational heat stress safety breaks in captive limestone quarries during 12:00-16:00 window, reduced clinker cooler thermal efficiency, and ambient cooling tower derating."
            },
            "heat_derating_factor_extreme": {
                "value": 0.25,
                "unit": "additional equivalent day lost per day >= 43C",
                "justification": "Severe refractory stress, high clinker cooler exit temperatures, and peak grid power load-shedding during acute regional heatwaves."
            },
            "grinding_unit_heat_damping_factor": {
                "value": 0.50,
                "justification": "Grinding units operate enclosed ball mills / VRMs with lower direct thermal exposure than rotary pyroprocessing kilns and captive open-cast mines."
            }
        },
        "climate_models_used": {
            "temperature_and_precipitation": "Open-Meteo Climate API (CMIP6 EC_Earth3P_HR high-resolution model, daily intervals, 2025 baseline vs 2040 projection)",
            "river_discharge_and_flood": "Open-Meteo Flood API (Global Flood Awareness System / GloFAS 5km grid resolution daily river discharge simulations)"
        },
        "water_and_coastal_lookup_methodology": "CSV water_source and coastal columns mapped to river basin hydrogeology, CGWB ground water assessment classifications, and historical tropical cyclone tracks."
    }
}

# 7. Compute Financial and Physical Risk Metrics for Every Plant
enriched_plants = []

# Constants from assumptions
NOMINAL_DAYS = assumptions["financial_assumptions"]["nominal_operating_days_per_year"]["value"]
EBITDA_PER_T = assumptions["financial_assumptions"]["industry_ebitda_margin_per_tonne"]["value"]
CCTS_CUT_PCT = assumptions["ccts_transition_risk_assumptions"]["mandated_reduction_target_pct"]["value"] / 100.0
CARBON_PRICE = assumptions["ccts_transition_risk_assumptions"]["assumed_carbon_price_per_tco2"]["value"]

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
    annual_ebitda_cr = (out_t * EBITDA_PER_T) / 1e7
    daily_ebitda_cr = annual_ebitda_cr / NOMINAL_DAYS
    
    # Climate Data from Open-Meteo
    om = open_meteo_cache[pid]
    d40_25 = om['days_above_40c_today']
    d40_40 = om['days_above_40c_2040']
    d43_25 = om['days_above_43c_today']
    d43_40 = om['days_above_43c_2040']
    
    # Heat Lost Days Calculation
    damping = 0.50 if ptype == 'Grinding unit' else 1.00
    heat_lost_today = ((d40_25 - d43_25) * 0.10 + d43_25 * 0.35) * damping
    heat_lost_2040 = ((d40_40 - d43_40) * 0.10 + d43_40 * 0.35) * damping
    
    # Water & Coastal Data from Labelled Lookup
    w_info = WATER_COASTAL_LOOKUP[pid]
    water_lost_today = w_info['water_lost_days_today']
    water_lost_2040 = w_info['water_lost_days_2040']
    coastal_lost_today = w_info['coastal_lost_days_today']
    coastal_lost_2040 = w_info['coastal_lost_days_2040']
    
    # Total Lost Operating Days
    total_lost_days_today = round(heat_lost_today + water_lost_today + coastal_lost_today, 2)
    total_lost_days_2040 = round(heat_lost_2040 + water_lost_2040 + coastal_lost_2040, 2)
    
    # Physical Financial Value at Risk (Today vs 2040)
    rev_risk_today_cr = round(total_lost_days_today * daily_rev_cr, 2)
    rev_risk_2040_cr = round(total_lost_days_2040 * daily_rev_cr, 2)
    ebitda_risk_today_cr = round(total_lost_days_today * daily_ebitda_cr, 2)
    ebitda_risk_2040_cr = round(total_lost_days_2040 * daily_ebitda_cr, 2)
    
    # Transition Risk: CCTS Plant-Level Baseline and Mandated % Cut
    # 1. Unadjusted (Direct Scope 1)
    unadj_baseline_intensity = round((scope1_raw * 1000.0) / out_t, 4) # tCO2 / t cement
    unadj_target_intensity = round(unadj_baseline_intensity * (1.0 - CCTS_CUT_PCT), 4)
    unadj_deficit_intensity = round(unadj_baseline_intensity * CCTS_CUT_PCT, 4)
    unadj_deficit_tonnes = round(scope1_raw * 1000.0 * CCTS_CUT_PCT, 1)
    unadj_ccts_annual_liability_cr = round((unadj_deficit_tonnes * CARBON_PRICE) / 1e7, 2)
    
    # 2. Clinker-Adjusted (Emissions moved with clinker shipments)
    adj_baseline_intensity = round((scope1_adj * 1000.0) / out_t, 4) # tCO2 / t cement
    adj_target_intensity = round(adj_baseline_intensity * (1.0 - CCTS_CUT_PCT), 4)
    adj_deficit_intensity = round(adj_baseline_intensity * CCTS_CUT_PCT, 4)
    adj_deficit_tonnes = round(scope1_adj * 1000.0 * CCTS_CUT_PCT, 1)
    adj_ccts_annual_liability_cr = round((adj_deficit_tonnes * CARBON_PRICE) / 1e7, 2)
    
    # Combined Financial Risk Today vs 2040
    # Today: Physical EBITDA risk + 0 Cr CCTS (pre-enforcement)
    total_financial_risk_today_cr = round(ebitda_risk_today_cr, 2)
    # 2040: 2040 Physical EBITDA risk + Annual CCTS Liability (Adjusted)
    total_financial_risk_2040_adj_cr = round(ebitda_risk_2040_cr + adj_ccts_annual_liability_cr, 2)
    total_financial_risk_2040_unadj_cr = round(ebitda_risk_2040_cr + unadj_ccts_annual_liability_cr, 2)
    
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
        
        # Emissions & Clinker Reallocation
        "emissions": {
            "unadjusted_direct_scope1_kt": scope1_raw,
            "clinker_reallocated_scope1_kt": round(scope1_adj, 2),
            "clinker_adjustment_delta_kt": round(scope1_adj - scope1_raw, 2),
            "unadjusted_intensity_tco2_per_t": unadj_baseline_intensity,
            "adjusted_intensity_tco2_per_t": adj_baseline_intensity
        },
        
        # Physical Climate Exposure (Today vs 2040)
        "physical_climate_data": {
            "source_models": "Open-Meteo Climate API (CMIP6 EC_Earth3P_HR) & Open-Meteo Flood API",
            "days_above_40c_today": d40_25,
            "days_above_40c_2040": d40_40,
            "days_above_43c_today": d43_25,
            "days_above_43c_2040": d43_40,
            "annual_precipitation_mm_today": om['precip_annual_mm_today'],
            "annual_precipitation_mm_2040": om['precip_annual_mm_2040'],
            "river_discharge_mean_m3s": om['river_discharge_mean_m3s'],
            "river_discharge_max_m3s": om['river_discharge_max_m3s'],
            "water_source_assessment": w_info
        },
        
        # Operational Days Lost Today vs 2040
        "operational_downtime_days": {
            "today": {
                "heat_lost_days": round(heat_lost_today, 2),
                "water_lost_days": water_lost_today,
                "coastal_lost_days": coastal_lost_today,
                "total_lost_operating_days": total_lost_days_today
            },
            "year_2040": {
                "heat_lost_days": round(heat_lost_2040, 2),
                "water_lost_days": water_lost_2040,
                "coastal_lost_days": coastal_lost_2040,
                "total_lost_operating_days": total_lost_days_2040
            }
        },
        
        # Transition Risk: CCTS Analysis (Plant-level baseline + 10% cut)
        "ccts_transition_risk": {
            "mandated_reduction_pct": 10.0,
            "assumed_carbon_price_inr_per_tco2": CARBON_PRICE,
            "unadjusted": {
                "baseline_intensity_tco2_per_t": unadj_baseline_intensity,
                "target_intensity_tco2_per_t": unadj_target_intensity,
                "deficit_intensity_tco2_per_t": unadj_deficit_intensity,
                "annual_deficit_tonnes": unadj_deficit_tonnes,
                "annual_ccts_liability_today_inr_cr": 0.0, # Pre-enforcement in FY26
                "annual_ccts_liability_enforced_inr_cr": unadj_ccts_annual_liability_cr
            },
            "clinker_adjusted": {
                "baseline_intensity_tco2_per_t": adj_baseline_intensity,
                "target_intensity_tco2_per_t": adj_target_intensity,
                "deficit_intensity_tco2_per_t": adj_deficit_intensity,
                "annual_deficit_tonnes": adj_deficit_tonnes,
                "annual_ccts_liability_today_inr_cr": 0.0,
                "annual_ccts_liability_enforced_inr_cr": adj_ccts_annual_liability_cr
            }
        },
        
        # Financial Value at Risk (Today vs 2040 in INR Crores)
        "financial_value_at_risk_inr_cr": {
            "today": {
                "physical_revenue_at_risk_cr": rev_risk_today_cr,
                "physical_ebitda_at_risk_cr": ebitda_risk_today_cr,
                "ccts_transition_liability_cr": 0.0,
                "total_financial_exposure_cr": total_financial_risk_today_cr
            },
            "year_2040": {
                "physical_revenue_at_risk_cr": rev_risk_2040_cr,
                "physical_ebitda_at_risk_cr": ebitda_risk_2040_cr,
                "ccts_transition_liability_adjusted_cr": adj_ccts_annual_liability_cr,
                "ccts_transition_liability_unadjusted_cr": unadj_ccts_annual_liability_cr,
                "total_financial_exposure_adjusted_cr": total_financial_risk_2040_adj_cr,
                "total_financial_exposure_unadjusted_cr": total_financial_risk_2040_unadj_cr
            }
        }
    }
    enriched_plants.append(plant_entry)

# 8. Portfolio Aggregates
portfolio_summary = {
    "portfolio_totals": {
        "total_plants": len(enriched_plants),
        "total_cement_capacity_mtpa": total_capacity,
        "total_cement_output_fy2025_26_mt": total_output,
        "total_asset_value_inr_cr": total_asset_val,
        "total_revenue_fy2025_26_inr_cr": total_revenue,
        "total_scope1_co2_kt": total_scope1,
        "total_clinker_adjusted_scope1_kt": total_adj_scope1,
        "total_employees": total_employees
    },
    "portfolio_financial_exposure_today_inr_cr": {
        "physical_revenue_at_risk_cr": round(sum(p['financial_value_at_risk_inr_cr']['today']['physical_revenue_at_risk_cr'] for p in enriched_plants), 2),
        "physical_ebitda_at_risk_cr": round(sum(p['financial_value_at_risk_inr_cr']['today']['physical_ebitda_at_risk_cr'] for p in enriched_plants), 2),
        "ccts_transition_liability_cr": 0.0,
        "total_exposure_cr": round(sum(p['financial_value_at_risk_inr_cr']['today']['total_financial_exposure_cr'] for p in enriched_plants), 2)
    },
    "portfolio_financial_exposure_2040_inr_cr": {
        "physical_revenue_at_risk_cr": round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['physical_revenue_at_risk_cr'] for p in enriched_plants), 2),
        "physical_ebitda_at_risk_cr": round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['physical_ebitda_at_risk_cr'] for p in enriched_plants), 2),
        "ccts_annual_liability_cr": round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['ccts_transition_liability_adjusted_cr'] for p in enriched_plants), 2),
        "total_exposure_adjusted_cr": round(sum(p['financial_value_at_risk_inr_cr']['year_2040']['total_financial_exposure_adjusted_cr'] for p in enriched_plants), 2)
    }
}

full_output = {
    "metadata": {
        "company": "Nimbus Cement Ltd",
        "author": "Meera Iyer (Head of Sustainability)",
        "purpose": "Climate Exposure & Transition Risk Ledger: Today vs 2040",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "data_lineage": {
            "internal_asset_ledger": "nimbus_cement_plants.csv (FY 2025-26)",
            "physical_climate_api": "Open-Meteo Climate API (CMIP6 EC_Earth3P_HR model, 2025 baseline vs 2040 projection)",
            "flood_api": "Open-Meteo Flood API (GloFAS 5km daily river discharge)",
            "water_coastal_classification": "Labelled hydrogeological & coastal risk lookup matrix",
            "regulatory_framework": "Bureau of Energy Efficiency (BEE) Carbon Credit Trading Scheme (CCTS)"
        }
    },
    "assumptions_reference": "assumptions.json",
    "portfolio_summary": portfolio_summary,
    "plants": enriched_plants
}

# 9. Save Files
with open('assumptions.json', 'w') as f:
    json.dump(assumptions, f, indent=2)

with open('enriched_plants_data.json', 'w') as f:
    json.dump(full_output, f, indent=2)

print("\n--- Summary Results Generated Successfully ---")
print(f"Saved: assumptions.json and enriched_plants_data.json")
print(f"Portfolio Today Exposure: INR {portfolio_summary['portfolio_financial_exposure_today_inr_cr']['total_exposure_cr']:.2f} Cr")
print(f"Portfolio 2040 Exposure: INR {portfolio_summary['portfolio_financial_exposure_2040_inr_cr']['total_exposure_adjusted_cr']:.2f} Cr")
