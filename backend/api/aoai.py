# backend/api/aoai.py

from __future__ import annotations

import json
import os
from typing import Any, Dict, List
from openai import AzureOpenAI
import re


def parse_yaml_like_text_to_json(text_response: str, template_type: str = None) -> dict:
    """
    Universal parser: Converts YAML-like text OR JSON to structured JSON for ANY template

    Handles both formats:
    1. YAML-like:
        field_name:
        - Point 1
        - Point 2

    2. JSON:
        {"field_name": "value"}
    """
    result = {"data": {}}

    # ✅ FIRST: Try to parse as JSON (if LLM returns JSON directly)
    text_stripped = text_response.strip()
    if text_stripped.startswith('{') and text_stripped.endswith('}'):
        try:
            parsed_json = json.loads(text_stripped)
            print("✅ Detected JSON format in LLM response")

            # If it's already properly structured
            if "template_type" in parsed_json and "data" in parsed_json:
                return parsed_json

            # Otherwise, wrap it
            result["data"] = parsed_json
            if template_type:
                result["template_type"] = template_type
            return result

        except json.JSONDecodeError:
            print("⚠️ Failed to parse as JSON, trying YAML-like format")

    # Auto-detect template type if not provided
    if not template_type:
        type_patterns = {
            "growth_strategy": ["growth_aspiration", "key_vectors_for_driving_growth"],
            "strategic_partnerships": ["partner_name", "internal_poc"],
            "operational_excellence_strategy": ["current_gp_percent", "gp_ambition"],
            "account_team_pod": ["Sales_and_Delivery_Leads", "Functional_POCs"],
            "service_line_growth": ["cloud_transformation", "data", "ai"],
            "customer_profile": ["customer_name", "csat", "headquarter_location"],
        }

        text_lower = text_response.lower()
        for t_type, keywords in type_patterns.items():
            if any(kw.lower() in text_lower for kw in keywords):
                template_type = t_type
                break

        if not template_type:
            template_type = "generic"

    result["template_type"] = template_type

    # Pattern 1: Extract fields with bullet points (list format)
    list_pattern = r"(\w+(?:_\w+)*):\s*\n((?:- .+\n?)+)"
    list_matches = re.finditer(list_pattern, text_response, re.MULTILINE)

    for match in list_matches:
        field_name = match.group(1)
        bullets_text = match.group(2)
        bullets = re.findall(r"- (.+)", bullets_text)
        result["data"][field_name] = [bullet.strip() for bullet in bullets]

    # Pattern 2: Extract simple key-value pairs
    kv_pattern = r"(\w+(?:_\w+)*):\s*([^\n]+)(?:\n|$)"
    kv_matches = re.finditer(kv_pattern, text_response, re.MULTILINE)

    for match in kv_matches:
        field_name = match.group(1)
        value = match.group(2).strip()

        # Skip if already processed as list
        if field_name not in result["data"]:
            # Check if it's a number
            try:
                if "." in value:
                    result["data"][field_name] = float(value)
                else:
                    result["data"][field_name] = int(value)
            except ValueError:
                result["data"][field_name] = value

    return result


def detect_template_type_from_query(query: str) -> str:
    """
    Auto-detect which template the user is asking about
    """
    query_lower = query.lower()

    template_keywords = {
        "growth_strategy": [
            "growth strategy", "growth aspiration", "key vectors",
            "driving growth", "improve quality", "sustainability",
            "inorganic opportunities"
        ],
        "account_team_pod": [
            "account team", "pod", "sales lead", "delivery lead",
            "functional poc", "team structure", "client partner"
        ],
        "strategic_partnerships": [
            "strategic partnership", "strategic partner", "sell with revenue",
            "key engagement", "support needed"
        ],
        
        "service_line_growth_actions": [
            "service line", "growth actions", "growth plan", "cloud transformation",
            "data modernization", "ai capabilities", "managed services", "srg"
        ],
        "operational_excellence_strategy": [
            "operational excellence", "gp percent", "gp percentage", 
            "commercial transformation", "priority levers", "margin uplift" # Removed generic "margin" to prevent clashes
        ],
        "customer_profile": [
            "customer profile", "customer perception", "csat score", # Changed "csat" to prevent clash with "csat_trajectory"
            "headquarter location", "current work"
        ],
        "talent_excellence_overview": [
            # MASTER TRIGGER
            "talent_excellence_overview",

            # Natural language triggers
            "talent excellence",
            "talent overview",
            "workforce overview",
            "demand and fulfilment",
            "key insights & actions",

            # Specific table metrics
            "overall headcount",
            "gender representation",
            "attrition % ltm",
            "average tenure",
            "associates with tenure",
            "esat",
            "total open demand",
            "overdue demand",
            "fulfilment % ons",
            "fulfilment % ofs",
            "external fulfilment",
            "delivery on time %",
            "sla %",
            "billability",
            "client interview %"
        ],

        
        "account_performance_annual_plan": [
            # 1. ✅ THE CRITICAL FIX: Matches your JSON prompt exactly
            "account_performance_annual_plan",

            # 2. Natural Language Triggers
            "account performance",
            "annual plan",
            "account plan",

            # 3. Specific Row Headers (From your Prompt)
            "revenue budget",
            "revenue actuals",
            "win rate",
            "book to bill",
            "gross margin",
            "revenue / fte",
            "cost / fte",

            # 4. Fallbacks
            "financial targets",
            "delivery metrics",
            "talent metrics",
            "utilization",
            "attrition"
        ],
        
        "account_performance_quarterly_plan": [
            "account_performance_quarterly_plan", "quarterly plan", "quarterly performance", "account quarterly plan",
            "q1 fy", "q2 fy", "q3 fy", "q4 fy"
        ],

        "tech_spend_view": [
            # 1. ✅ MASTER TRIGGER (Matches JSON ID)
            "tech_spend_view",

            # 2. Natural Language
            "tech spend",
            "spend breakdown",
            "technology spend",
            "business unit view",
            "geography view",

            # 3. Specific Headers
            "client's revenue breakdown",
            "talent split",
            "incumbent",
            "client presence"
        ],

        "innovation_strategy": [
            # 1. ✅ MASTER TRIGGER
            "innovation_strategy",

            # 2. Keywords
            "innovation excellence",
            "client's ai strategy",
            "genai strategy",
            "adoption journey",
            "outlook on ai"
        ],

        "operational_implementation_plan": [
            "operational_implementation_plan",
            "implementation plan for operational excellence",
            "operational implementation",
            "delivery and talent implementation"
        ],

        "investment_plan": [
            # 1. ✅ MASTER TRIGGER
            "investment_plan",

            # 2. Keywords
            "investment plan",
            "billing investment",
            "travel investments",
            "investment value",
            "targeted outcome"
        ],

        "critical_risk": [
            "critical risk", "risk tracking", "mitigation plan"
        ],
        "relationship_heatmap": [
            "relationship heatmap", "stakeholder", "relationship strength"
        ],
        "account_cockpit_view": [
            "account_cockpit_view",
            "account cockpit",
            "cockpit view",
            "revenue performance",
            "booking performance"
        ],
        "org_structure_tech_view": [
            "org structure",
            "organization structure",
            "org chart",
            "cdio",
            "key functions"
        ],
        "revenue_teardown": [
            "Revenue_Teardown",
            "revenue teardown",
            "teardown of revenue",
            "fy25share",
            "fy26share"
        ],
        "implementation_plan": [
            # 1. ✅ MASTER TRIGGER
            "implementation_plan",

            # 2. Keywords
            "implementation plan",
            "action plan",
            "growth plan actions",
            "timeline for growth",
            "investment needed"
        ],
        "client_context_1": [
            "client context", "client_context_1", "year founded", "headquarters location",
            "roe percent", "total employees", "executive changes", "cagr percent"
        ],
        "client_context_2": [
            "client_context_2", "client context 2", "business & it priorities",
            "tech landscape", "competitive intel", "wallet share", "market share"
        ], 
        "service_line_penetration": [
            "service_line_penetration", "service line penetration", "secured order book",
            "gross order book", "expiry / run-off"
        ],
        "key_growth_opportunities": [
            "key_growth_opportunities", "key growth opportunities", "growth opportunities",
            "deal name", "deal type", "win probability", "key differentiator"
        ],
        "opportunity_deep_dive": [
            "opportunity_deep_dive", "opportunity deep dive", "deal details", 
            "win themes", "crm id"
        ],
        "critical_risk": [
            "critical_risk", "critical risk", "description of risk", 
            "impact of risk", "countermeasures taken"
        ],
        "strategic_partnerships": [
            "strategic partnership", "strategic partner", "sell with revenue",
            "key engagement", "support needed"
        ],
        "planned_action_genai": [
            "planned_action_genai", "planned action", "genai",
            "planned action for genai", "ai investment", "generative ai"
        ],
 
        "operational_implementation_plan": [
            "operational_implementation_plan",
            "implementation plan for operational excellence",
            "operational implementation",
            "delivery and talent implementation",
            "operational plan"
        ],

    }

    
    for template_type in template_keywords.keys():
        if template_type in query_lower:
            return template_type

    
    for template_type, keywords in template_keywords.items():
        if any(keyword in query_lower for keyword in keywords):
            return template_type

    return None

def _client() -> AzureOpenAI:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-06-01").strip()

    if not endpoint:
        raise RuntimeError("AZURE_OPENAI_ENDPOINT missing")
    if not api_key:
        raise RuntimeError("AZURE_OPENAI_API_KEY missing")

    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )


def embed(text: str) -> List[float]:
    """Azure OpenAI embeddings."""
    deployment = os.getenv("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = os.getenv("AZURE_OPENAI_EMBED_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = "text-embedding-3-small"

    text = (text or "").strip()
    if not text:
        raise RuntimeError("embed() received empty text")

    client = _client()
    resp = client.embeddings.create(
        model=deployment,
        input=text,
    )

    vec = resp.data[0].embedding
    return [float(x) for x in vec]


def answer_only_from_context(query: str, context_text: str) -> str:
    """
    Returns ONLY the answer text (plain text, not JSON).
    If answer not explicitly present in context -> "TBD".
    """
    deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
    if not deployment:
        raise RuntimeError(
            "AZURE_OPENAI_CHAT_DEPLOYMENT (or AZURE_OPENAI_DEPLOYMENT) missing")

    query = (query or "").strip()
    context_text = (context_text or "").strip()

    system = (
        "You are a RAG assistant.\n"
        "Use ONLY the provided CONTEXT.\n"
        "Return ONLY the final answer as plain text (no JSON, no markdown, no citations).\n"
        "If the answer is not explicitly present in the CONTEXT, return exactly: TBD"
    )

    user = f"QUESTION:\n{query}\n\nCONTEXT:\n{context_text}\n\nReturn only the answer."

    client = _client()
    resp = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
    )

    return (resp.choices[0].message.content or "").strip()


def fill_template_json_only(template: Dict[str, Any], context_text: str) -> Dict[str, Any]:
    """
    Strictly fills the template JSON using ONLY context.
    Missing values must be 'TBD' (inside arrays).
    Returns Python dict.
    """
    deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "").strip()
    if not deployment:
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
    if not deployment:
        raise RuntimeError(
            "AZURE_OPENAI_CHAT_DEPLOYMENT (or AZURE_OPENAI_DEPLOYMENT) missing")

    system = (
        "You are a JSON generator.\n"
        "Rules:\n"
        "- Respond ONLY with valid JSON.\n"
        "- No markdown.\n"
        "- No explanations.\n"
        "- No citations.\n"
        "- No extra keys.\n"
        "- If value not found, return \"TBD\".\n"
        "Follow exactly the schema provided by user."
    )

    user = (
        "TEMPLATE:\n"
        f"{json.dumps(template, ensure_ascii=False)}\n\n"
        "CONTEXT:\n"
        f"{context_text}\n\n"
        "Return ONLY the filled JSON."
    )

    client = _client()
    resp = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
    )

    raw = (resp.choices[0].message.content or "").strip()
    
    # FIX: Strip markdown code blocks before parsing
    clean_json = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
    
    try:
        out = json.loads(clean_json)
    except Exception:
        raise RuntimeError(f"Model did not return valid JSON. Cleaned attempt:\n{clean_json}")

    return out


def enforce_tbd(template: Dict[str, Any], filled: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensures the output matches the TEMPLATE schema exactly.

    Behavior is schema-driven:
    - If schema value is a list (e.g., []), output must be a non-empty list of strings; empty/missing => ["TBD"].
    - If schema value is a dict, recurse.
    - If schema value is a string (e.g., ""), output must be a string; empty/missing => "TBD".

    This supports both "list templates" and "table templates" like Account Dashboard.
    """
    template_type = (template or {}).get("template_type")
    schema_data = (template or {}).get("data", {}) or {}
    filled_data = (filled or {}).get("data") or {}

    def _coerce(schema_node: Any, filled_node: Any) -> Any:
        # Handle Arrays
        if isinstance(schema_node, list):
            if not isinstance(filled_node, list):
                filled_node = [filled_node] if filled_node else []
            
            # SCALABILITY FIX: If the schema expects a list of dictionaries (Tabular Data)
            if len(schema_node) > 0 and isinstance(schema_node[0], dict):
                base_dict_schema = schema_node[0]
                out_list = []
                for item in filled_node:
                    if isinstance(item, dict):
                        out_list.append(_coerce(base_dict_schema, item))
                # Ensure at least one empty mapped row is returned if LLM failed
                return out_list if out_list else [_coerce(base_dict_schema, {})]
            else:
                # Simple list of strings
                cleaned = [str(x).strip() for x in filled_node if str(x).strip() and str(x) != "None"]
                return cleaned if cleaned else ["TBD"]

        # Handle Objects
        if isinstance(schema_node, dict):
            out: Dict[str, Any] = {}
            if not isinstance(filled_node, dict):
                filled_node = {}
                
            # SCALABILITY FIX: Case-insensitive key mapping
            filled_lower = {str(k).lower(): v for k, v in filled_node.items()}

            for k, child_schema in schema_node.items():
                matched_val = filled_node.get(k)
                if matched_val is None:
                    matched_val = filled_lower.get(str(k).lower())
                out[k] = _coerce(child_schema, matched_val)
            return out

        # Handle Primitives
        if filled_node is None:
            return "TBD"
        s = str(filled_node).strip()
        return s if s and s.lower() != "none" else "TBD"

    return {"template_type": template_type, "data": _coerce(schema_data, filled_data)}