# backend/api/normalizers.py
import ast

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

# Registry mapping string names to normalizer functions
NORMALIZER_REGISTRY = {
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