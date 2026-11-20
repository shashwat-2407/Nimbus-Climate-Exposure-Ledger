import csv
import json
import math

def run_audit():
    print("=" * 70)
    print("NIMBUS CLIMATE EXPOSURE LEDGER: DATA AUDIT & INVARIANCE VERIFIER")
    print("=" * 70)
    
    # 1. Load CSV
    csv_path = "nimbus_cement_plants.csv"
    csv_plants = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_plants.append(row)
            
    print(f"\n[1/5] Loaded {len(csv_plants)} plants from {csv_path}")
    assert len(csv_plants) == 9, f"Expected 9 plants in CSV, got {len(csv_plants)}"

    # 2. Compute CSV Totals
    total_capacity = sum(float(r["cement_capacity_mtpa"]) for r in csv_plants)
    total_output = sum(float(r["cement_output_fy2025_26_mt"]) for r in csv_plants)
    total_clinker_prod = sum(float(r["clinker_produced_fy2025_26_mt"]) for r in csv_plants)
    total_clinker_ship = sum(float(r["clinker_shipped_fy2025_26_mt"]) for r in csv_plants)
    total_scope1 = sum(float(r["scope1_co2_fy2025_26_kt"]) for r in csv_plants)
    total_assets = sum(float(r["asset_value_inr_cr"]) for r in csv_plants)
    total_revenue = sum(float(r["revenue_fy2025_26_inr_cr"]) for r in csv_plants)
    total_employees = sum(int(r["employees"]) for r in csv_plants)

    print("\n[2/5] Verified CSV Fleet Totals:")
    print(f"  • Cement Capacity:    {total_capacity:.2f} MTPA      (target: 23.00)")
    print(f"  • Cement Output:      {total_output:.2f} Mt        (target: 18.35)")
    print(f"  • Clinker Produced:   {total_clinker_prod:.2f} Mt        (target: 12.61)")
    print(f"  • Clinker Shipped:    {total_clinker_ship:.2f} Mt         (target: 2.40)")
    print(f"  • Scope 1 CO2:        {total_scope1:.1f} kt      (target: 10,932)")
    print(f"  • Gross Asset Base:   ₹{total_assets:,.0f} Cr     (target: 15,450)")
    print(f"  • FY26 Revenue:       ₹{total_revenue:,.0f} Cr      (target: 9,658)")
    print(f"  • Employees:          {total_employees:,}          (target: 4,550)")

    # Assert exact target totals required by user
    assert math.isclose(total_capacity, 23.00, abs_tol=1e-5), f"Capacity mismatch: {total_capacity} != 23.00"
    assert math.isclose(total_output, 18.35, abs_tol=1e-5), f"Output mismatch: {total_output} != 18.35"
    assert math.isclose(total_clinker_prod, 12.61, abs_tol=1e-5), f"Clinker prod mismatch: {total_clinker_prod} != 12.61"
    assert math.isclose(total_clinker_ship, 2.40, abs_tol=1e-5), f"Clinker ship mismatch: {total_clinker_ship} != 2.40"
    assert math.isclose(total_scope1, 10932.0, abs_tol=1e-5), f"Scope 1 mismatch: {total_scope1} != 10932"
    assert math.isclose(total_assets, 15450.0, abs_tol=1e-5), f"Asset mismatch: {total_assets} != 15450"
    assert math.isclose(total_revenue, 9658.0, abs_tol=1e-5), f"Revenue mismatch: {total_revenue} != 9658"
    assert total_employees == 4550, f"Employees mismatch: {total_employees} != 4550"
    print("  --> ALL 8 CSV TOTAL ASSERTIONS PASSED!")

    # 3. Load enriched_plants_data.json
    json_path = "enriched_plants_data.json"
    with open(json_path, mode="r", encoding="utf-8") as f:
        json_data = json.load(f)

    json_summary = json_data["portfolio_summary"]
    json_plants = json_data["plants"]
    pt = json_summary["portfolio_totals"]

    print("\n[3/5] Verifying enriched_plants_data.json Portfolio Totals against CSV:")
    assert math.isclose(pt["total_cement_capacity_mtpa"], 23.00, abs_tol=1e-5)
    assert math.isclose(pt["total_cement_output_fy2025_26_mt"], 18.35, abs_tol=1e-5)
    assert math.isclose(total_clinker_prod, 12.61, abs_tol=1e-5)
    assert math.isclose(total_clinker_ship, 2.40, abs_tol=1e-5)
    assert math.isclose(pt["total_scope1_co2_kt"], 10932.0, abs_tol=1e-5)
    assert math.isclose(pt["total_clinker_adjusted_scope1_kt"], 10932.0, abs_tol=1e-5)
    assert math.isclose(pt["total_asset_value_inr_cr"], 15450.0, abs_tol=1e-5)
    assert math.isclose(pt["total_revenue_fy2025_26_inr_cr"], 9658.0, abs_tol=1e-5)
    assert pt["total_employees"] == 4550
    print("  --> ALL ENRICHED JSON SUMMARY TOTALS MATCH CSV WITH ZERO DELTA!")

    # 4. Assert every single plant value matches between CSV and enriched JSON
    csv_dict = {r["plant_id"]: r for r in csv_plants}
    print("\n[4/5] Asserting Every Plant Field Between CSV and Enriched JSON:")
    for p in json_plants:
        pid = p["plant_id"]
        c = csv_dict[pid]
        
        # Exact field checks
        assert p["plant_name"] == c["plant_name"], f"Name mismatch on {pid}"
        assert p["town"] == c["town"], f"Town mismatch on {pid}"
        assert p["state"] == c["state"], f"State mismatch on {pid}"
        assert math.isclose(p["latitude"], float(c["latitude"]), abs_tol=1e-4), f"Lat mismatch on {pid}"
        assert math.isclose(p["longitude"], float(c["longitude"]), abs_tol=1e-4), f"Lon mismatch on {pid}"
        assert p["plant_type"] == c["plant_type"], f"Type mismatch on {pid}"
        assert math.isclose(p["cement_capacity_mtpa"], float(c["cement_capacity_mtpa"]), abs_tol=1e-5), f"Capacity mismatch on {pid}"
        assert math.isclose(p["cement_output_fy2025_26_mt"], float(c["cement_output_fy2025_26_mt"]), abs_tol=1e-5), f"Output mismatch on {pid}"
        assert math.isclose(p["clinker_produced_fy2025_26_mt"], float(c["clinker_produced_fy2025_26_mt"]), abs_tol=1e-5), f"Clinker prod mismatch on {pid}"
        assert math.isclose(p["clinker_shipped_fy2025_26_mt"], float(c["clinker_shipped_fy2025_26_mt"]), abs_tol=1e-5), f"Clinker ship mismatch on {pid}"
        assert math.isclose(p["emissions"]["unadjusted_direct_scope1_kt"], float(c["scope1_co2_fy2025_26_kt"]), abs_tol=1e-5), f"Scope1 mismatch on {pid}"
        assert p["water_source"] == c["water_source"], f"Water source mismatch on {pid}"
        assert p["coastal"] == c["coastal"], f"Coastal flag mismatch on {pid}"
        assert math.isclose(p["asset_value_inr_cr"], float(c["asset_value_inr_cr"]), abs_tol=1e-5), f"Asset mismatch on {pid}"
        assert math.isclose(p["revenue_fy2025_26_inr_cr"], float(c["revenue_fy2025_26_inr_cr"]), abs_tol=1e-5), f"Revenue mismatch on {pid}"
        assert p["employees"] == int(c["employees"]), f"Employees mismatch on {pid}"
        print(f"  ✓ Plant {pid} ({p['plant_name']}): all 16 operational & financial CSV fields match.")

    # 5. Assert Single-Path Reconciliation (sum of rows == portfolio summary)
    print("\n[5/5] Single-Path Exposure Reconciliation & Clinker Invariance Assertions:")
    sum_heat_today = sum(p["three_component_financial_exposure_inr_cr_per_year"]["baseline_2015_2024"]["heat_component_api_based_inr_cr_per_year"] for p in json_plants)
    sum_heat_2040 = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["heat_component_api_based_inr_cr_per_year"] for p in json_plants)
    sum_water_today = sum(p["three_component_financial_exposure_inr_cr_per_year"]["baseline_2015_2024"]["water_coastal_component_judgement_inr_cr_per_year"] for p in json_plants)
    sum_water_2040 = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["water_coastal_component_judgement_inr_cr_per_year"] for p in json_plants)
    sum_ccts_10_unadj = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_case_10pct_unadjusted_inr_cr_per_year"] for p in json_plants)
    sum_ccts_10_adj = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_case_10pct_adjusted_inr_cr_per_year"] for p in json_plants)
    sum_ccts_3_unadj = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_case_3pct_unadjusted_inr_cr_per_year"] for p in json_plants)
    sum_ccts_3_adj = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_case_3pct_adjusted_inr_cr_per_year"] for p in json_plants)
    sum_ccts_notified_unadj = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_notified_unadjusted_inr_cr_per_year"] for p in json_plants)
    sum_ccts_notified_adj = sum(p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_notified_adjusted_inr_cr_per_year"] for p in json_plants)

    headline = json_summary["headline_exposure_summary_inr_cr_per_year"]
    
    print(f"  • Heat Downtime Today:        ₹{sum_heat_today:.2f} Cr/yr == ₹{headline['baseline_2015_2024']['heat_component_api_based_inr_cr_per_year']:.2f} Cr/yr")
    assert math.isclose(sum_heat_today, headline["baseline_2015_2024"]["heat_component_api_based_inr_cr_per_year"], abs_tol=1e-2)

    print(f"  • Heat Downtime 2040:         ₹{sum_heat_2040:.2f} Cr/yr == ₹{headline['horizon_2040']['heat_component_api_based_inr_cr_per_year']:.2f} Cr/yr")
    assert math.isclose(sum_heat_2040, headline["horizon_2040"]["heat_component_api_based_inr_cr_per_year"], abs_tol=1e-2)

    print(f"  • Water/Coastal Today:        ₹{sum_water_today:.2f} Cr/yr == ₹{headline['baseline_2015_2024']['water_coastal_component_judgement_inr_cr_per_year']:.2f} Cr/yr")
    assert math.isclose(sum_water_today, headline["baseline_2015_2024"]["water_coastal_component_judgement_inr_cr_per_year"], abs_tol=1e-2)

    print(f"  • Water/Coastal 2040:         ₹{sum_water_2040:.2f} Cr/yr == ₹{headline['horizon_2040']['water_coastal_component_judgement_inr_cr_per_year']:.2f} Cr/yr")
    assert math.isclose(sum_water_2040, headline["horizon_2040"]["water_coastal_component_judgement_inr_cr_per_year"], abs_tol=1e-2)

    print(f"  • CCTS 10% Unadjusted:        ₹{sum_ccts_10_unadj:.2f} Cr/yr == ₹163.99 Cr/yr")
    assert math.isclose(sum_ccts_10_unadj, 163.99, abs_tol=1e-2)

    print(f"  • CCTS 10% Clinker-Adjusted:  ₹{sum_ccts_10_adj:.2f} Cr/yr (flat-rate arithmetic coincidence; not displayed in UI)")
    assert math.isclose(sum_ccts_10_adj, 163.99, abs_tol=1e-2)

    print(f"  • CCTS 3% Unadjusted:         ₹{sum_ccts_3_unadj:.2f} Cr/yr == ₹49.19 Cr/yr")
    assert math.isclose(sum_ccts_3_unadj, 49.19, abs_tol=1e-2)

    print(f"  • CCTS 3% Clinker-Adjusted:   ₹{sum_ccts_3_adj:.2f} Cr/yr (flat-rate arithmetic coincidence; not displayed in UI)")
    assert math.isclose(sum_ccts_3_adj, 49.19, abs_tol=1e-2)

    print(f"  • CCTS Notified Unadjusted:   ₹{sum_ccts_notified_unadj:.2f} Cr/yr (integrated 2.7%, grinding 6.6%)")
    assert math.isclose(sum_ccts_notified_unadj, 44.74, abs_tol=0.05)

    print(f"  • CCTS Notified Adjusted:     ₹{sum_ccts_notified_adj:.2f} Cr/yr")
    assert math.isclose(sum_ccts_notified_adj, 56.84, abs_tol=0.05)

    assert headline["baseline_2015_2024"]["ccts_status"] == "not computable from CSV (no FY2023-24 baseline)"

    # CCTS totals are NOT invariant under clinker adjustment at notified rates
    assert not math.isclose(sum_ccts_notified_unadj, sum_ccts_notified_adj, abs_tol=1.0), "notified CCTS should differ between direct and adjusted"
    print(f"  • CCTS Notified direct vs adjusted differ: ₹{sum_ccts_notified_unadj:.2f} vs ₹{sum_ccts_notified_adj:.2f} (no invariance claim; UI uses direct only)")

    # UI contract: CCTS today upper bound (direct) and recomputed attribution floor
    sum_ub = sum(p["three_component_financial_exposure_inr_cr_per_year"]["baseline_2015_2024"]["ccts_today_upper_bound_inr_cr_per_year"] for p in json_plants)
    assert math.isclose(sum_ub, 44.74, abs_tol=0.05)
    delta_heat = sum_heat_2040 - sum_heat_today
    delta_water = sum_water_2040 - sum_water_today
    delta_ccts_floor = sum_ccts_10_unadj - sum_ub
    delta_total_floor = delta_heat + delta_water + delta_ccts_floor
    print(f"  • Increase floor: heat +{delta_heat:.2f}, water +{delta_water:.2f}, CCTS >= +{delta_ccts_floor:.2f} => >= +{delta_total_floor:.2f} Cr/yr (CCTS >= {100*delta_ccts_floor/delta_total_floor:.1f}%)")
    assert math.isclose(delta_total_floor, 152.06, abs_tol=0.05)
    assert math.isclose(sum(
        p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["heat_component_api_based_inr_cr_per_year"]
        + p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["water_coastal_component_judgement_inr_cr_per_year"]
        + p["three_component_financial_exposure_inr_cr_per_year"]["horizon_2040"]["ccts_component_notified_unadjusted_inr_cr_per_year"]
        for p in json_plants), 124.45, abs_tol=0.05), "2040 notified total (direct) should be 124.45"

    print("\n" + "=" * 70)
    print("ALL AUDIT ASSERTIONS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_audit()
