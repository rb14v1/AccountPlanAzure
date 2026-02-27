# backend/api/normalizers.py
import ast

def normalize_account_team_pod(obj: dict) -> dict:
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
    if not isinstance(raw_data, dict):
        raw_data = {}

    def _clean_section(section_name, expected_keys):
        section_data = raw_data.get(section_name) or {}
        if not isinstance(section_data, dict):
            section_data = {}
        
        clean_section = {}
        for key in expected_keys:
            row = section_data.get(key) or {}
            if not isinstance(row, dict):
                row = {}
            clean_section[key] = {
                "Accountable_POC": str(row.get("Accountable_POC") or "TBD"),
                "Time_Commitment": str(row.get("Time_Commitment") or "TBD")
            }
        return clean_section

    sales_keys = ["Client_Partner", "Delivery_Manager", "Digital_and_Cloud_POC", "SRG_POC", "EA_POC", "Data_POC"]
    functional_keys = ["Presales_Lead", "Marketing_POC", "Partnerships_POC", "AI_and_Innovation_Lead", "Delivery_Excellence_Lead", "Talent_Supply_Chain_POC", "L_and_D_Lead"]

    return {
        "template_type": "account_team_pod",
        "data": {
            "Sales_and_Delivery_Leads": _clean_section("Sales_and_Delivery_Leads", sales_keys),
            "Functional_POCs": _clean_section("Functional_POCs", functional_keys)
        }
    }

def normalize_customer_profile(obj: dict) -> dict:
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
    if not isinstance(raw_data, dict):
        raw_data = {}

    def to_list(val):
        if isinstance(val, list):
            return [str(x).strip() for x in val if x]
        if isinstance(val, str) and val.strip():
            return [p.strip() for p in val.replace("\n", ";").split(";") if p.strip()]
        return ["TBD"]

    return {
        "template_type": "customer_profile",
        "data": {
            "customer_name": raw_data.get("customer_name") or raw_data.get("customer") or "TBD",
            "headquarter_location": raw_data.get("headquarter_location") or raw_data.get("headquarter") or "TBD",
            "csat": str(raw_data.get("csat") or "TBD"),
            "version_1_vertical": raw_data.get("version_1_vertical") or raw_data.get("Version 1 Vertical") or "TBD",
            "current_work": to_list(raw_data.get("current_work")),
            "service_lines": to_list(raw_data.get("service_lines")),
            "customer_perception": to_list(raw_data.get("customer_perception")),
        }
    }

def normalize_innovation_strategy(obj: dict) -> dict:
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
    if not isinstance(raw_data, dict):
        raw_data = {}
    return {
        "template_type": "innovation_strategy",
        "data": {
            "1": str(raw_data.get("current_outlook_on_ai") or "TBD"),
            "2": str(raw_data.get("top_motivations_for_genai") or "TBD"),
            "3a": str(raw_data.get("top_genai_projects") or "TBD"),
            "3b": str(raw_data.get("other_innovation_projects") or "TBD"),
            "4": str(raw_data.get("high_value_use_cases") or "TBD")
        }
    }

def normalize_talent_excellence(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    return {
        "template_type": "talent_excellence_overview",
        "data": {
            "overviewRows": raw.get("overviewRows") or [],
            "demandRows": raw.get("demandRows") or [],
            "insights": str(raw.get("insights") or "TBD")
        }
    }

def normalize_operational_excellence(obj: dict) -> dict:
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
    if not isinstance(raw_data, dict):
        raw_data = {}

    def to_list(val):
        if isinstance(val, list):
            return [str(x).strip() for x in val if x]
        if isinstance(val, str) and val.strip():
            if "\n" in val:
                return [x.strip() for x in val.split("\n") if x.strip()]
            return [val.strip()]
        return ["TBD"]

    return {
        "template_type": "operational_excellence_strategy",
        "data": {
            "current_gp_percentage": str(raw_data.get("current_gp_percentage") or "TBD"),
            "gp_percentage_ambition": str(raw_data.get("gp_percentage_ambition") or "TBD"),
            "priority_levers_to_drive_margin_uplift": to_list(raw_data.get("priority_levers_to_drive_margin_uplift")),
            "plan_for_commercial_model_transformation": to_list(raw_data.get("plan_for_commercial_model_transformation"))
        }
    }

def normalize_relationship_heatmap(obj: dict) -> dict:
    if not isinstance(obj, dict): obj = {}
    data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    rows = data.get("stakeholder_list", [])
    if not isinstance(rows, list): rows = []

    def _as_dict_from_str(s: str) -> dict | None:
        if not isinstance(s, str): return None
        t = s.strip()
        if not (t.startswith("{") and t.endswith("}")): return None
        try:
            parsed = ast.literal_eval(t)
            return parsed if isinstance(parsed, dict) else None
        except Exception: return None

    normalized_rows = []
    for r in rows:
        if isinstance(r, str):
            maybe = _as_dict_from_str(r)
            if maybe: r = maybe

        if isinstance(r, dict):
            normalized_rows.append({
                "client_stakeholder": (r.get("client_stakeholder") or "TBD"),
                "role": (r.get("role") or "TBD"),
                "reports_to": (r.get("reports_to") or "TBD"),
                "level": (r.get("level") or "TBD"),
                "client_relationship": (r.get("client_relationship") or "TBD"),
                "engagement_plan_next_action": (r.get("engagement_plan_next_action") or "TBD"),
            })
        elif isinstance(r, str):
            normalized_rows.append({
                "client_stakeholder": (r.strip() or "TBD"),
                "role": "TBD", "reports_to": "TBD", "level": "TBD",
                "client_relationship": "TBD", "engagement_plan_next_action": "TBD",
            })

    return {"template_type": "relationship_heatmap", "data": {"stakeholder_list": normalized_rows}}

def normalize_service_line_growth(obj: dict) -> dict:
    REQUIRED_KEYS = ["Cloud_Transformation", "Data", "AI", "SRG_Managed_Services", "EA", "Strategy_Design_and_Change", "SAM_and_Licensing"]
    DEFAULT_ROW = {"Objective": "TBD", "Target_Buying_Centres": "TBD", "Current_Status": "TBD", "Next_Action_and_Responsible_Person": "TBD"}
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
    if not isinstance(raw_data, dict): raw_data = {}

    clean_data = {}
    for key in REQUIRED_KEYS:
        row = raw_data.get(key)
        if not isinstance(row, dict): row = DEFAULT_ROW.copy()
        clean_row = {}
        for field in ["Objective", "Target_Buying_Centres", "Current_Status", "Next_Action_and_Responsible_Person"]:
            clean_row[field] = str(row.get(field) or "TBD")
        clean_data[key] = clean_row

    return {"template_type": "service_line_growth_actions", "data": clean_data}

def normalize_account_performance(obj: dict) -> dict:
    DEFAULTS = {
        "financials": [
            {"metric": "Revenue Budget", "unit": "€ Mn"}, {"metric": "Revenue Actuals / Forecast", "unit": "€ Mn"},
            {"metric": "TCV won", "unit": "€ Mn"}, {"metric": "Win rate (YTD)", "unit": "%"},
            {"metric": "Book to bill ratio", "unit": "#"}, {"metric": "SL revenue penetration %", "unit": "%"},
            {"metric": "# of SLs present in the account*", "unit": "#"}
        ],
        "delivery": [
            {"metric": "Gross Margin %", "unit": "%"}, {"metric": "Revenue / FTE (ONS)", "unit": "€ K"},
            {"metric": "Revenue / FTE (OFS)", "unit": "€ K"}, {"metric": "Cost / FTE (ONS)", "unit": "#"},
            {"metric": "Cost / FTE (OFS)", "unit": "#"}
        ],
        "talent": [
            {"metric": "Attrition %", "unit": "%"}, {"metric": "Fulfilment %", "unit": "%"}, {"metric": "Delivery on time %", "unit": "%"}
        ]
    }
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    clean_data = {}

    for section_key, expected_rows in DEFAULTS.items():
        llm_list = raw_data.get(section_key) or []
        llm_map = {str(item["metric"]).lower().strip(): item for item in llm_list if isinstance(item, dict) and item.get("metric")} if isinstance(llm_list, list) else {}

        final_list = []
        for row_def in expected_rows:
            metric_name = row_def["metric"]
            match = llm_map.get(metric_name.lower()) or {}
            final_list.append({
                "metric": metric_name, "unit": str(match.get("unit") or row_def["unit"]),
                "fy24": str(match.get("fy24") or "").strip(), "fy25": str(match.get("fy25") or "").strip(), "fy26": str(match.get("fy26") or "").strip()
            })
        clean_data[section_key] = final_list

    return {"template_type": "account_performance_annual_plan", "data": clean_data}

def normalize_growth_strategy(obj: dict) -> dict:
    if not isinstance(obj, dict): obj = {}
    data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
    if not isinstance(data, dict): data = {}

    def to_list(val):
        if isinstance(val, list): return [str(x).strip() for x in val if x]
        if val is not None and str(val).strip(): return [p.strip() for p in str(val).replace("\n", ";").split(";") if p.strip()]
        return ["TBD"]

    return {
        "template_type": "growth_strategy",
        "data": {
            "growth_aspiration": to_list(data.get("growth_aspiration")),
            "key_vectors_for_driving_growth": to_list(data.get("growth_vectors") or data.get("key_vectors_for_driving_growth")),
            "improve_quality_sustainability_revenues": to_list(data.get("revenue_quality_sustainability") or data.get("improve_quality_sustainability_revenues")),
            "potential_inorganic_opportunities": to_list(data.get("inorganic_opportunities") or data.get("potential_inorganic_opportunities")),
        }
    }

def normalize_investment_plan(obj: dict) -> dict:
    DEFAULT_ROWS = [
        {"id": 1, "type": "Billing investment"}, {"id": 2, "type": "Buffers"}, {"id": 3, "type": "Innovation"},
        {"id": 4, "type": "Free resources"}, {"id": 5, "type": "Marketing investments / relationship building"}, {"id": 6, "type": "Travel investments"}
    ]
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    ai_list = raw_data.get("investments") or []
    ai_map = {str(item["investment_type"]).lower().strip(): item for item in ai_list if isinstance(item, dict) and item.get("investment_type")} if isinstance(ai_list, list) else {}

    final_list = []
    for def_row in DEFAULT_ROWS:
        def_type = def_row["type"]
        match = ai_map.get(def_type.lower()) or {}
        final_list.append({
            "investment_number": def_row["id"], "investment_type": def_type,
            "investment_description": str(match.get("investment_description") or ""), "investment_value_eur": str(match.get("investment_value_eur") or ""),
            "targeted_outcome": str(match.get("targeted_outcome") or ""), "primary_owner": str(match.get("primary_owner") or ""),
            "timeline_status": str(match.get("timeline_status") or "To be discussed"), "remarks": str(match.get("remarks") or "")
        })

    return {
        "template_type": "investment_plan", 
        "data": {
            "investments": final_list, 
            "total_investment_value": str(raw_data.get("total_investment_value") or "XX")
        }
    }
def normalize_implementation_plan(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    rows = raw.get("actions") or []
    if not isinstance(rows, list): rows = []
    while len(rows) < 3: rows.append({})

    clean_rows = [{
        "action": str(r.get("action") or ""), "timeline": str(r.get("timeline") or ""), "owner": str(r.get("owner") or ""),
        "status": str(r.get("status") or "To be initiated"), "investment_needed": str(r.get("investment_needed") or ""), "impact": str(r.get("impact") or "")
    } for r in rows]
    return {"template_type": "implementation_plan", "data": {"actions": clean_rows}}

def normalize_tech_spend(obj: dict) -> dict:
    DEFAULTS = {
        "rows": [{"id": 1, "name": "BU1"}, {"id": 2, "name": "BU2"}, {"id": 3, "name": "BU3"}, {"id": 4, "name": "BU4"}, {"id": 5, "name": "BU5"}, {"id": 6, "name": "BU6"}],
        "geoRevenue": [{"l": "Americas", "h": "75%"}, {"l": "EMEA", "h": "60%"}, {"l": "APAC", "h": "20%"}, {"l": "Others", "h": "15%"}],
        "geoTalent": [{"geo": "Americas"}, {"geo": "EMEA"}, {"geo": "APAC"}],
        "geoPriorities": [{"geo": "Americas"}, {"geo": "EMEA"}, {"geo": "APAC"}]
    }
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    clean_data = {}

    llm_rows = raw_data.get("rows") or []
    clean_rows = []
    for i, def_row in enumerate(DEFAULTS["rows"]):
        match = llm_rows[i] if i < len(llm_rows) and isinstance(llm_rows[i], dict) else {}
        clean_rows.append({
            "id": def_row["id"], "name": str(match.get("name") or def_row["name"]), "desc": str(match.get("desc") or ""), "size": str(match.get("size") or ""),
            "growth": str(match.get("growth") or ""), "spend": str(match.get("spend") or ""), "priorities": str(match.get("priorities") or ""),
            "presence": str(match.get("presence") or ""), "incumbent": str(match.get("incumbent") or "")
        })
    clean_data["rows"] = clean_rows

    for key in ["geoRevenue", "geoTalent", "geoPriorities"]:
        llm_list = raw_data.get(key) or []
        clean_list = []
        for i, def_row in enumerate(DEFAULTS[key]):
            match = llm_list[i] if i < len(llm_list) and isinstance(llm_list[i], dict) else {}
            item = def_row.copy()
            if "v" in match or "val" in match: item[list(match.keys())[0]] = str(match.get("v") or match.get("val") or "")
            clean_list.append(item)
        clean_data[key] = clean_list

    return {"template_type": "tech_spend_view", "data": clean_data}

def normalize_account_cockpit(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    clean_data = {}

    # 1. Map YoY Performance blocks
    def extract_yoy(perf_key):
        items = raw.get(perf_key, {}).get("yoy", [])
        out = []
        for i, year in enumerate(["FY24", "FY25", "FY26"]):
            val = items[i].get("value", "") if i < len(items) and isinstance(items[i], dict) else ""
            out.append({"y": year, "v": val})
        return out
    
    clean_data["revenueYoyData"] = extract_yoy("revenue_performance")
    clean_data["bookingYoyData"] = extract_yoy("booking_performance")
    clean_data["marginYoyData"] = extract_yoy("margin_performance")

    # 2. Large Deals
    ld_items = raw.get("large_deals", {}).get("tcv_wins", [])
    ld_out = []
    for i, q in enumerate(["Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25"]):
        val = ld_items[i].get("value", "") if i < len(ld_items) and isinstance(ld_items[i], dict) else ""
        ld_out.append({"label": q, "v": val})
    clean_data["largeDealsData"] = ld_out

    # 3. SL Penetration
    sl_items = raw.get("sl_penetration", [])
    sl_out = []
    for i, q in enumerate(["FY25 Q1", "FY25 Q2", "FY25 Q3", "FY25 Q4", "FY26 Q1", "FY26 Q2", "FY26 Q3", "FY26 Q4"]):
        val = sl_items[i].get("value", "") if i < len(sl_items) and isinstance(sl_items[i], dict) else ""
        sl_out.append({"label": q, "val": val})
    clean_data["slPenetrationData"] = sl_out

    # 4. Partners
    p_items = raw.get("partnership_revenue", [])
    p_out = []
    for i in range(5):
        p = p_items[i] if i < len(p_items) and isinstance(p_items[i], dict) else {}
        p_out.append({
            "name": str(p.get("partner", "")),
            "revenue": str(p.get("fy25_revenue", "")),
            "target": str(p.get("fy26_target", ""))
        })
    clean_data["partners"] = p_out

    return {"template_type": "account_cockpit_view", "data": clean_data}

def normalize_org_structure(obj: dict) -> dict:
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    
    def safe_person(key):
        person = raw_data.get(key)
        if isinstance(person, dict):
            return {"name": str(person.get("name", "")), "role": str(person.get("role", ""))}
        return {"name": "", "role": ""}

    clean_data = {
        "group_ceo": safe_person("group_ceo"),
        "cdio": safe_person("cdio"),
    }

    raw_functions = raw_data.get("key_functions") or []
    clean_functions = []
    if isinstance(raw_functions, list):
        for f in raw_functions:
            if isinstance(f, dict):
                clean_functions.append({
                    "function": str(f.get("function", "")),
                    "leader_name": str(f.get("leader_name", "")),
                    "leader_role": str(f.get("leader_role", "")),
                    "presence_type": str(f.get("presence_type", "Green"))
                })
                
    if not clean_functions:
        clean_functions = [{"function": "", "leader_name": "", "leader_role": "", "presence_type": "Green"} for _ in range(4)]
        
    clean_data["key_functions"] = clean_functions

    return {"template_type": "org_structure_tech_view", "data": clean_data}

def normalize_revenue_teardown(obj: dict) -> dict:
    DEFAULTS = {
        "eeRows": [
            { "id": 1, "name": "EE / EER"},
            { "id": 2, "name": "EN"}
        ],
        "geoRows": [
            { "id": 1, "name": "Americas"},
            { "id": 2, "name": "EMEA"},
            { "id": 3, "name": "APAC"},
            { "id": 4, "name": "Others"}
        ]
    }
    
    raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    clean_data = {}

    for key in ["eeRows", "geoRows"]:
        llm_list = raw_data.get(key) or []
        clean_list = []
        for i, def_row in enumerate(DEFAULTS[key]):
            match = llm_list[i] if isinstance(llm_list, list) and i < len(llm_list) and isinstance(llm_list[i], dict) else {}
            clean_list.append({
                "id": def_row["id"],
                "name": def_row["name"],
                "fy25Act": str(match.get("fy25Act", "")),
                "fy26Tar": str(match.get("fy26Tar", "")),
                "fy25Share": str(match.get("fy25Share", "")),
                "fy26Share": str(match.get("fy26Share", ""))
            })
        clean_data[key] = clean_list

    raw_insights = raw_data.get("insights") if isinstance(raw_data.get("insights"), dict) else {}
    clean_data["insights"] = {
        "top": str(raw_insights.get("top", "")),
        "bottom": str(raw_insights.get("bottom", ""))
    }

    return {"template_type": "revenue_teardown", "data": clean_data}

def normalize_client_context_1(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    
    def safe_str(val): return str(val) if val else ""
    
    clean_data = {
        "year_founded": safe_str(raw.get("year_founded")),
        "headquarters_location": safe_str(raw.get("headquarters_location")),
        "number_of_offices": safe_str(raw.get("number_of_offices")),
        "total_employees": safe_str(raw.get("total_employees")),
        "roe_percent": safe_str(raw.get("roe_percent")),
        "client_description": safe_str(raw.get("client_description")),
    }
    
    tr = raw.get("total_revenue_usd_bn") if isinstance(raw.get("total_revenue_usd_bn"), dict) else {}
    clean_data["total_revenue_usd_bn"] = {
        "ebitda_margin": safe_str(tr.get("ebitda_margin")),
        "actuals": safe_str(tr.get("actuals")),
        "forecast": safe_str(tr.get("forecast")),
    }
    
    rby = raw.get("revenue_by_year")
    clean_data["revenue_by_year"] = [{"fiscal_year": safe_str(x.get("fiscal_year")), "revenue": safe_str(x.get("revenue")), "cagr_percent": safe_str(x.get("cagr_percent"))} for x in rby if isinstance(x, dict)] if isinstance(rby, list) else []
        
    kh = raw.get("key_highlights")
    clean_data["key_highlights"] = [safe_str(x) for x in kh] if isinstance(kh, list) else ([kh] if isinstance(kh, str) else [])
        
    ec = raw.get("executive_changes")
    clean_data["executive_changes"] = [{"name": safe_str(x.get("name")), "position": safe_str(x.get("position")), "background": safe_str(x.get("background"))} for x in ec if isinstance(x, dict)] if isinstance(ec, list) else []
        
    return {"template_type": "client_context_1", "data": clean_data}

def normalize_client_context_2(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    
    def safe_str(val): return str(val) if val else ""
    def safe_list(val, default): return val if isinstance(val, list) else default
    
    b_it = raw.get("business_it_priorities") if isinstance(raw.get("business_it_priorities"), dict) else {}
    tech = raw.get("tech_landscape_spend") if isinstance(raw.get("tech_landscape_spend"), dict) else {}
    spend = tech.get("spend") if isinstance(tech.get("spend"), dict) else {}
    partners = tech.get("partners") if isinstance(tech.get("partners"), dict) else {}
    comp = raw.get("competitive_intel") if isinstance(raw.get("competitive_intel"), dict) else {}
    
    clean_data = {
        "business_it_priorities": {
            "business": [safe_str(x) for x in safe_list(b_it.get("business"), [])],
            "it": [safe_str(x) for x in safe_list(b_it.get("it"), [])]
        },
        "tech_landscape_spend": {
            "spend": {
                "overall": safe_str(spend.get("overall")),
                "outsourced": safe_str(spend.get("outsourced")),
                "rnd": safe_str(spend.get("rnd"))
            },
            "partners": {
                "erp": {"name": safe_str(partners.get("erp", {}).get("name", "")) if isinstance(partners.get("erp"), dict) else ""},
                "hyperscalers": [{"name": safe_str(x.get("name"))} for x in safe_list(partners.get("hyperscalers"), []) if isinstance(x, dict)],
                "isvs": [{"name": safe_str(x.get("name"))} for x in safe_list(partners.get("isvs"), []) if isinstance(x, dict)]
            }
        },
        "competitive_intel": {
            "market_share": [{"name": safe_str(x.get("name")), "value": float(x.get("value", 0) or 0)} for x in safe_list(comp.get("market_share"), []) if isinstance(x, dict)],
            "competition_overview": [{"competitor_name": safe_str(x.get("competitor_name")), "wallet_share_percent": safe_str(x.get("wallet_share_percent")), "depth_of_relationship": int(x.get("depth_of_relationship", 0) or 0), "key_areas_of_engagement": safe_str(x.get("key_areas_of_engagement"))} for x in safe_list(comp.get("competition_overview"), []) if isinstance(x, dict)]
        }
    }
    return {"template_type": "client_context_2", "data": clean_data}

def normalize_account_performance_quarterly(obj: dict) -> dict:
    raw_data = obj.get("data") if isinstance(obj.get("data"), (dict, list)) else obj

    QUARTERS = ["Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25", "Q1 FY26", "Q2 FY26", "Q3 FY26", "Q4 FY26"]
    EXPECTED_METRICS = [
        "Revenue Budget", "Revenue Actuals / Forecast", "TCV won", "Win rate (YTD)",
        "Book to bill ratio", "SL revenue penetration %", "# of SLs present in the account*",
        "Gross Margin %", "Revenue / FTE (ONS)", "Revenue / FTE (OFS)",
        "Cost / FTE (ONS)", "Cost / FTE (OFS)", "Attrition %", "Fulfilment %", "Delivery on time %"
    ]

    # Initialize safely so frontend never crashes due to missing keys
    clean_data = {m: {q: "" for q in QUARTERS} for m in EXPECTED_METRICS}

    def get_metric_key(m_in):
        for em in EXPECTED_METRICS:
            if em.lower().strip() == str(m_in).lower().strip():
                return em
        return m_in

    # Scenario 1: LLM returns a list
    if isinstance(raw_data, list):
        for row in raw_data:
            if not isinstance(row, dict): continue
            metric = row.get("metric")
            if not metric: continue
            
            real_m = get_metric_key(metric)
            if real_m not in clean_data: clean_data[real_m] = {q: "" for q in QUARTERS}
            
            for q in QUARTERS:
                if q in row and row[q] is not None:
                    clean_data[real_m][q] = str(row[q])

    # Scenario 2: LLM returns a direct dict mapping
    elif isinstance(raw_data, dict):
        data_dict = raw_data.get("data", raw_data) if isinstance(raw_data.get("data"), dict) else raw_data
        for metric, q_values in data_dict.items():
            real_m = get_metric_key(metric)
            if real_m not in clean_data: clean_data[real_m] = {q: "" for q in QUARTERS}
            
            if isinstance(q_values, dict):
                for q in QUARTERS:
                    if q in q_values and q_values[q] is not None:
                        clean_data[real_m][q] = str(q_values[q])

    return {
        "template_type": "account_performance_quarterly_plan",
        "data": clean_data
    }

def normalize_service_line_penetration(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    clean_data = {}
 
    # barValues (Flatten the nested array from the prompt schema)
    bv = raw.get("barValues", [["", "", "", ""]])
    if isinstance(bv, list) and len(bv) > 0 and isinstance(bv[0], list):
        clean_data["barValues"] = bv
    elif isinstance(bv, list):
        clean_data["barValues"] = [bv]
    else:
        clean_data["barValues"] = [["", "", "", ""]]
 
    # xxValues
    xx = raw.get("xxValues", [])
    clean_data["xxValues"] = [str(x) for x in xx] if isinstance(xx, list) else [""] * 8
 
    # tableRows
    defaults = [
        { "id": "1", "name": "Secured Order Book"},
        { "id": "1a", "name": "- Gross Order Book"},
        { "id": "1b", "name": "- Expiry / run-off"},
        { "id": "2", "name": "Open TCV"},
        { "id": "3", "name": "TCV Won"},
        { "id": "4", "name": "TCV dropped / lost"}
    ]
    raw_rows = raw.get("tableRows", [])
    clean_rows = []
    for i, def_row in enumerate(defaults):
        match = raw_rows[i] if isinstance(raw_rows, list) and i < len(raw_rows) and isinstance(raw_rows[i], dict) else {}
        clean_rows.append({
            "id": def_row["id"],
            "name": def_row["name"],
            "v1": str(match.get("v1", "")),
            "v2": str(match.get("v2", "")),
            "v3": str(match.get("v3", "")),
            "v4": str(match.get("v4", ""))
        })
    clean_data["tableRows"] = clean_rows
    clean_data["insights"] = str(raw.get("insights", ""))
 
    return {"template_type": "service_line_penetration", "data": clean_data}

def normalize_key_growth_opportunities(obj: dict) -> dict:
    raw_data = obj.get("data")
    if not isinstance(raw_data, list):
        raw_data = [raw_data] if isinstance(raw_data, dict) else []
    
    clean_list = []
    for item in raw_data:
        if isinstance(item, dict):
            clean_list.append({
                "deal_name": str(item.get("deal_name", "")),
                "deal_type": str(item.get("deal_type", "")),
                "stage": str(item.get("stage", "")),
                "service_offering": str(item.get("service_offering", "")),
                "tcv_eur_mn": str(item.get("tcv_eur_mn", "")),
                "acv_eur_mn": str(item.get("acv_eur_mn", "")),
                "closure_timeline": str(item.get("closure_timeline", "")),
                "win_probability": str(item.get("win_probability", "")),
                "key_stakeholders": str(item.get("key_stakeholders", "")),
                "competition": str(item.get("competition", "")),
                "key_differentiator": str(item.get("key_differentiator", "")),
                "support_required": str(item.get("support_required", ""))
            })
    
    # Ensure at least 5 empty rows if none provided
    while len(clean_list) < 5:
        clean_list.append({
            "deal_name": "", "deal_type": "", "stage": "", "service_offering": "",
            "tcv_eur_mn": "", "acv_eur_mn": "", "closure_timeline": "",
            "win_probability": "", "key_stakeholders": "", "competition": "",
            "key_differentiator": "", "support_required": ""
        })

    return {"template_type": "key_growth_opportunities", "data": clean_list}

def normalize_opportunity_deep_dive(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    
    def safe_str(val): return str(val) if val is not None else ""
    def safe_list(val): return val if isinstance(val, list) else []
    
    dd = raw.get("deal_details", {})
    ds = raw.get("deal_size", {})
    dt = raw.get("deal_team", {})

    clean_data = {
        "deal_details": {
            "opportunity_name": safe_str(dd.get("opportunity_name")),
            "crm_id": safe_str(dd.get("crm_id")),
            "deal_type": safe_str(dd.get("deal_type")),
            "service_lines": safe_str(dd.get("service_lines")),
            "partners": safe_str(dd.get("partners"))
        },
        "deal_size": {
            "tcv": safe_str(ds.get("tcv")),
            "acv": safe_str(ds.get("acv"))
        },
        "deal_context": [safe_str(x) for x in safe_list(raw.get("deal_context"))],
        "deal_team": {
            "sponsor": safe_str(dt.get("sponsor")),
            "director": safe_str(dt.get("director")),
            "business_development": safe_str(dt.get("business_development")),
            "service_line_spoc": safe_str(dt.get("service_line_spoc")),
            "presales_lead": safe_str(dt.get("presales_lead"))
        },
        "client_priorities": [safe_str(x) for x in safe_list(raw.get("client_priorities"))],
        "win_themes": [safe_str(x) for x in safe_list(raw.get("win_themes"))],
        "competitors": [{"name": safe_str(c.get("name")), "strengths": safe_str(c.get("strengths")), "weaknesses": safe_str(c.get("weaknesses"))} for c in safe_list(raw.get("competitors")) if isinstance(c, dict)],
        "stakeholders": [{"name": safe_str(s.get("name")), "stance": safe_str(s.get("stance")), "priorities": safe_str(s.get("priorities"))} for s in safe_list(raw.get("stakeholders")) if isinstance(s, dict)],
        "meetings": [{"event": safe_str(m.get("event")), "status": safe_str(m.get("status")), "date": safe_str(m.get("date")), "outcomes": safe_str(m.get("outcomes"))} for m in safe_list(raw.get("meetings")) if isinstance(m, dict)]
    }
    return {"template_type": "opportunity_deep_dive", "data": clean_data}

import re

def normalize_critical_risk(obj: dict) -> dict:
    raw_data = obj.get("data")
    if not isinstance(raw_data, list):
        raw_data = [raw_data] if isinstance(raw_data, dict) else []
    
    clean_list = []
    for i, item in enumerate(raw_data):
        if isinstance(item, dict):
            
            # --- SAFE NUMBER EXTRACTION ---
            raw_num = item.get("risk_number", i + 1)
            if isinstance(raw_num, int):
                risk_num = raw_num
            else:
                # Strips out letters like "CR-" and keeps only digits
                digits = re.sub(r'\D', '', str(raw_num))
                risk_num = int(digits) if digits else (i + 1)
            # ------------------------------

            clean_list.append({
                "category": str(item.get("category", "")),
                "risk_number": risk_num,
                "description_of_risk": str(item.get("description_of_risk", "")),
                "impact_of_risk": str(item.get("impact_of_risk", "")),
                "timeline": str(item.get("timeline", "")),
                "countermeasures_taken": str(item.get("countermeasures_taken", "")),
                "owner": str(item.get("owner", ""))
            })
            
    # Guarantee at least one empty risk so the table renders if AI fails completely
    if not clean_list:
        clean_list.append({
            "category": "", "risk_number": 1, "description_of_risk": "",
            "impact_of_risk": "", "timeline": "", "countermeasures_taken": "", "owner": ""
        })

    return {"template_type": "critical_risk", "data": clean_list}

def normalize_planned_action_genai(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    clean_data = {}
 
    def map_rows(data_list, prefix, max_rows=4):
        if not isinstance(data_list, list):
            data_list = []
        for i in range(max_rows):
            key = f"{prefix}_{i+1}"
            item = data_list[i] if i < len(data_list) and isinstance(data_list[i], dict) else {}
            clean_data[key] = {
                "Initiative_Description": str(item.get("description", "")),
                "Status": str(item.get("status") or "To be initiated"),
                "Owner": str(item.get("owner", "")),
                "Timeline": str(item.get("timeline", "")),
                "Help_Required": str(item.get("help_required", "")),
                "Investments": str(item.get("investments", "")),
                "Outcome": str(item.get("outcome", ""))
            }
 
    map_rows(raw.get("ai_investments"), "AI_Inv", 4)
    map_rows(raw.get("others"), "Other", 4)
 
    return {"template_type": "planned_action_genai", "data": clean_data}
 
def normalize_strategic_partnerships(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    partnerships = raw.get("partnerships", [])
    if not isinstance(partnerships, list):
        partnerships = []
 
    clean_rows = []
    for item in partnerships:
        if isinstance(item, dict):
            clean_rows.append({
                "partner_name": str(item.get("partner_name", "")),
                "internal_poc": str(item.get("internal_poc", "")),
                "partner_type": str(item.get("partner_type", "")),
                "sell_with_revenue_fy25_actuals_forecast": str(item.get("sell_with_revenue_fy25_actuals_forecast", "")),
                "sell_with_revenue_fy26_target": str(item.get("sell_with_revenue_fy26_target", "")),
                "key_engagements": str(item.get("key_engagements", "")),
                "support_needed": str(item.get("support_needed", ""))
            })
 
    # Ensure at least 5 empty rows exist if data is short
    while len(clean_rows) < 5:
        clean_rows.append({
            "partner_name": "", "internal_poc": "", "partner_type": "",
            "sell_with_revenue_fy25_actuals_forecast": "", "sell_with_revenue_fy26_target": "",
            "key_engagements": "", "support_needed": ""
        })
 
    return {"template_type": "strategic_partnerships", "data": {"partnerships": clean_rows}}
 
def normalize_operational_implementation_plan(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    raw_actions = raw.get("actions", [])
    if not isinstance(raw_actions, list):
        raw_actions = []
 
    plan_date = str(raw.get("plan_date") or "TBD")
 
    clean_rows = []
    for i, item in enumerate(raw_actions):
        if isinstance(item, dict):
            # Only add the row if the AI actually filled out an action description
            desc = str(item.get("action_description", "")).strip()
            if desc and desc.lower() not in ["tbd", "string"]:
                clean_rows.append({
                    "id": i + 1,
                    "category": str(item.get("category") or "Operational Excellence"),
                    "subcategory": str(item.get("subcategory") or "Process Improvement"),
                    "action_description": desc,
                    "primary_owner": str(item.get("primary_owner", "")),
                    "support_team": str(item.get("support_team", "")),
                    "timeline": str(item.get("timeline", "")),
                    "status": str(item.get("status") or "To be initiated"),
                    "help_required": str(item.get("help_required", "")),
                    "investment_needed": str(item.get("investment_needed", "")),
                    "impact": str(item.get("impact", ""))
                })
 
    # Safety fallback: Give the frontend at least 1 empty row if the AI failed completely
    if not clean_rows:
        clean_rows.append({
            "id": 1, "category": "Operational Excellence", "subcategory": "Process Improvement",
            "action_description": "", "primary_owner": "", "support_team": "",
            "timeline": "", "status": "To be initiated", "help_required": "",
            "investment_needed": "", "impact": ""
        })
 
    return {
        "template_type": "operational_implementation_plan",
        "data": {
            "plan_date": plan_date,
            "actions": clean_rows
        }
    }

def normalize_margin_improvement(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    
    def safe_str(val): return str(val) if val is not None else ""
    def safe_list(val): return val if isinstance(val, list) else []

    clean_data = {
        "gross_profit_chart": [
            {"quarter": safe_str(x.get("quarter")), "actuals_projections": safe_str(x.get("actuals_projections")), "target": safe_str(x.get("target"))}
            for x in safe_list(raw.get("gross_profit_chart")) if isinstance(x, dict)
        ],
        "key_metrics": [
            {
                "key_metrics": safe_str(x.get("key_metrics")), "fy24": safe_str(x.get("fy24")), "q4_24": safe_str(x.get("q4_24")),
                "q1_25": safe_str(x.get("q1_25")), "q2_25_a": safe_str(x.get("q2_25_a")), "q3_25_c": safe_str(x.get("q3_25_c")),
                "q3_25_p": safe_str(x.get("q3_25_p")), "q4_25_c": safe_str(x.get("q4_25_c")), "q4_25_p": safe_str(x.get("q4_25_p")),
                "fy25_c": safe_str(x.get("fy25_c")), "fy25_p": safe_str(x.get("fy25_p")), "q1_26_p": safe_str(x.get("q1_26_p")),
                "q2_26_p": safe_str(x.get("q2_26_p")), "q3_26_p": safe_str(x.get("q3_26_p")), "q4_26_p": safe_str(x.get("q4_26_p")),
                "fy26_p": safe_str(x.get("fy26_p"))
            }
            for x in safe_list(raw.get("key_metrics")) if isinstance(x, dict)
        ],
        "gp_waterfall_opex": [
            {"item": safe_str(x.get("item")), "q323": safe_str(x.get("q323")), "q423": safe_str(x.get("q423")), "q124": safe_str(x.get("q124")), "q224": safe_str(x.get("q224"))}
            for x in safe_list(raw.get("gp_waterfall_opex")) if isinstance(x, dict)
        ],
        "gp_waterfall_sales": [
            {"item": safe_str(x.get("item")), "q323": safe_str(x.get("q323")), "q423": safe_str(x.get("q423")), "q124": safe_str(x.get("q124")), "q224": safe_str(x.get("q224"))}
            for x in safe_list(raw.get("gp_waterfall_sales")) if isinstance(x, dict)
        ],
        "drainers": [
            {"item": safe_str(x.get("item")), "q323": safe_str(x.get("q323")), "q423": safe_str(x.get("q423")), "q124": safe_str(x.get("q124")), "q224": safe_str(x.get("q224"))}
            for x in safe_list(raw.get("drainers")) if isinstance(x, dict)
        ],
        "pyramid_improvement_plan": safe_str(raw.get("pyramid_improvement_plan"))
    }
    
    # Basic padding to ensure table rendering doesn't crash if AI sends empty lists
    if not clean_data["key_metrics"]:
        clean_data["key_metrics"].append({"key_metrics": "", "fy24": "", "q4_24": "", "q1_25": "", "q2_25_a": "", "q3_25_c": "", "q3_25_p": "", "q4_25_c": "", "q4_25_p": "", "fy25_c": "", "fy25_p": "", "q1_26_p": "", "q2_26_p": "", "q3_26_p": "", "q4_26_p": "", "fy26_p": ""})
    for w_key in ["gp_waterfall_opex", "gp_waterfall_sales", "drainers"]:
        if not clean_data[w_key]:
            clean_data[w_key].append({"item": "", "q323": "", "q423": "", "q124": "", "q224": ""})

    return {"template_type": "margin_improvement", "data": clean_data}

def normalize_margin_improvement_plan_2(obj: dict) -> dict:
    raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
    
    def safe_str(val): return str(val) if val is not None else ""
    def safe_list(val): return val if isinstance(val, list) else []

    default_quarters = ["Q1 FY25", "Q2 FY25", "Q3 FY25", "Q4 FY25", "Q1 FY26", "Q2 FY26", "Q3 FY26", "Q4 FY26"]
    raw_chart = safe_list(raw.get("gross_profit_chart"))
    clean_chart = []
    for i, q in enumerate(default_quarters):
        match = raw_chart[i] if i < len(raw_chart) and isinstance(raw_chart[i], dict) else {}
        clean_chart.append({
            "quarter": q,
            "actuals_projections": safe_str(match.get("actuals_projections")),
            "target": safe_str(match.get("target"))
        })

    default_pyramid = [
        ("Offshore", "L1"), ("Offshore", "L2"), ("Offshore", "L3"), ("Offshore", "L4"), ("Offshore", "L5"), ("Offshore", "Sub-con"),
        ("Onsite", "L1"), ("Onsite", "L2"), ("Onsite", "L3"), ("Onsite", "L4"), ("Onsite", "L5"), ("Onsite", "Sub-con")
    ]
    raw_pyramid = safe_list(raw.get("pyramid_teardown"))
    clean_pyramid = []
    
    for i, (cat, lab) in enumerate(default_pyramid):
        match = raw_pyramid[i] if i < len(raw_pyramid) and isinstance(raw_pyramid[i], dict) else {}
        clean_pyramid.append({
            "category": cat, "label": lab,
            "fy24": safe_str(match.get("fy24")), "q424": safe_str(match.get("q424")),
            "q125": safe_str(match.get("q125")), "q225A": safe_str(match.get("q225A")),
            "q325C": safe_str(match.get("q325C")), "q325P": safe_str(match.get("q325P")),
            "q425C": safe_str(match.get("q425C")), "q425P": safe_str(match.get("q425P")),
            "fy25C": safe_str(match.get("fy25C")), "fy25P": safe_str(match.get("fy25P"))
        })

    return {
        "template_type": "margin_improvement_plan_2",
        "data": {
            "gross_profit_chart": clean_chart,
            "pyramid_teardown": clean_pyramid,
            "pyramid_improvement_plan": safe_str(raw.get("pyramid_improvement_plan"))
        }
    }
 

# Registry mapping string names to normalizer functions
NORMALIZER_REGISTRY = {
    "account_team_pod": normalize_account_team_pod,
    "customer_profile": normalize_customer_profile,
    "innovation_strategy": normalize_innovation_strategy,
    "talent_excellence_overview": normalize_talent_excellence,
    "operational_excellence_strategy": normalize_operational_excellence,
    "relationship_heatmap": normalize_relationship_heatmap,
    "service_line_growth_actions": normalize_service_line_growth,
    "account_performance_annual_plan": normalize_account_performance,
    "growth_strategy": normalize_growth_strategy,
    "investment_plan": normalize_investment_plan,
    "implementation_plan": normalize_implementation_plan,
    "tech_spend_view": normalize_tech_spend,
    "account_cockpit_view": normalize_account_cockpit,
    "org_structure_tech_view": normalize_org_structure,
    "revenue_teardown": normalize_revenue_teardown,
    "client_context_1": normalize_client_context_1,
    "client_context_2": normalize_client_context_2,
    "account_performance_quarterly_plan": normalize_account_performance_quarterly,
    "service_line_penetration": normalize_service_line_penetration,
    "key_growth_opportunities": normalize_key_growth_opportunities,
    "opportunity_deep_dive": normalize_opportunity_deep_dive,
    "critical_risk": normalize_critical_risk,
    "planned_action_genai": normalize_planned_action_genai,
    "strategic_partnerships": normalize_strategic_partnerships,
    "operational_implementation_plan": normalize_operational_implementation_plan,
    "margin_improvement": normalize_margin_improvement,
    "margin_improvement_plan_2": normalize_margin_improvement_plan_2,
}

def get_normalized_payload(template_type: str, raw_data: dict) -> dict:
    normalizer_fn = NORMALIZER_REGISTRY.get(template_type)
    if normalizer_fn:
        return normalizer_fn(raw_data)
        
    # FIX: Prevent {"data": {"data": {...}}}
    extracted_data = raw_data.get("data", raw_data)
    return {"template_type": template_type, "data": extracted_data}


def get_humanized_message(template_type: str, safe_payload: dict) -> str:
    """Returns custom human-readable chat strings for specific templates."""
    data = safe_payload.get("data", {})
    if template_type == "relationship_heatmap":
        rows = data.get("stakeholder_list", [])
        if not rows: return "I couldn’t extract stakeholder details from the available context."
        lines = ["Relationship Heatmap (key stakeholders):"]
        for i, r in enumerate(rows, 1):
            if isinstance(r, dict):
                lines.append(f"{i}) {r.get('client_stakeholder', 'TBD')} — {r.get('role', 'TBD')} ({r.get('level', 'TBD')}) | Reports to: {r.get('reports_to', 'TBD')} | Relationship: {r.get('client_relationship', 'TBD')}")
        return "\n".join(lines)
    
    elif template_type == "growth_strategy":
        gv = data.get("key_vectors_for_driving_growth", [])
        gv_text = "\n".join([f"- {x}" for x in gv]) if isinstance(gv, list) else str(gv)
        return (
            "Growth Strategy:\n"
            f"• Growth aspiration: {data.get('growth_aspiration', 'TBD')}\n"
            f"• Growth vectors:\n{gv_text}\n"
            f"• Revenue quality & sustainability: {data.get('improve_quality_sustainability_revenues', 'TBD')}\n"
            f"• Inorganic opportunities: {data.get('potential_inorganic_opportunities', 'TBD')}"
        )
    
    return f"{template_type.replace('_', ' ').title()} successfully generated and saved."

