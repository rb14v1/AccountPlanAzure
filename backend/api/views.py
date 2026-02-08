# backend/api/views.py

import json
import os
from datetime import datetime, timezone
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from azure.storage.blob import BlobClient

from .storage import build_upload_path, create_upload_sas
from .search import run_indexer, get_indexer_status, search_chunks
from .aoai import (
    answer_only_from_context,
    fill_template_json_only,
    enforce_tbd,
    parse_yaml_like_text_to_json,
    detect_template_type_from_query,
)
from .template_schemas import get_template_schema

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction

from .azure_sql import fetch_fabric_bundle
from django.http import JsonResponse, HttpResponse
import json

from .models import TemplatePayload


def _env(name: str, default: str = "") -> str:
    return (os.getenv(name) or default).strip()


def _storage_account() -> str:
    v = _env("AZURE_STORAGE_ACCOUNT")
    if not v:
        raise ValueError("AZURE_STORAGE_ACCOUNT missing")
    return v


def _storage_key() -> str:
    v = _env("AZURE_STORAGE_KEY")
    if not v:
        raise ValueError("AZURE_STORAGE_KEY missing")
    return v


def _container() -> str:
    return _env("AZURE_STORAGE_CONTAINER", "uploads")


def _json_body(request) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return {}


def _get_user_id(request, data: dict) -> str:
    return (
        str(data.get("user_id") or "").strip()
        or str(request.headers.get("X-User-Id") or "").strip()
    )


@csrf_exempt
def upload_request(request):
    """Step 1: frontend asks for an upload URL (SAS) to put a file into Blob Storage."""
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _json_body(request)
    user_id = _get_user_id(request, data)
    filename = str(data.get("filename") or "").strip()

    if not user_id or not filename:
        return JsonResponse({"error": "user_id and filename required"}, status=400)

    blob_path = build_upload_path(user_id=user_id, filename=filename)
    upload_url, blob_url = create_upload_sas(
        account=_storage_account(),
        key=_storage_key(),
        container=_container(),
        blob_path=blob_path,
        expiry_minutes=30,
    )

    return JsonResponse(
        {
            "upload_url": upload_url,
            "blob_url": blob_url,
            "blob_path": blob_path,
        }
    )


@csrf_exempt
def upload_complete(request):
    """Step 2: frontend tells backend the upload finished."""
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _json_body(request)
    user_id = _get_user_id(request, data)
    filename = str(data.get("filename") or "").strip()
    blob_path = str(data.get("blob_path") or "").strip()

    if not user_id or not filename or not blob_path:
        return JsonResponse({"error": "user_id, filename, blob_path required"}, status=400)

    if not blob_path.startswith(f"users/{user_id}/"):
        return JsonResponse({"error": "blob_path not under this user"}, status=400)

    bc = BlobClient(
        account_url=f"https://{_storage_account()}.blob.core.windows.net",
        container_name=_container(),
        blob_name=blob_path,
        credential=_storage_key(),
    )

    props = bc.get_blob_properties()
    md = dict(props.metadata or {})
    md.update(
        {
            "user_id": user_id,
            "filename": filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    bc.set_blob_metadata(metadata=md)

    return JsonResponse({"blob_path": blob_path, "metadata": md})


@csrf_exempt
def ingest_file(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _json_body(request)
    user_id = _get_user_id(request, data)
    filename = str(data.get("filename") or "").strip()
    blob_path = str(data.get("blob_path") or "").strip()

    print(
        "INGEST trigger",
        {"user_id": user_id, "filename": filename, "blob_path": blob_path or "(batch)"},
    )

    wait_seconds = int(data.get("wait_seconds") or 0)
    result = run_indexer(wait_seconds=wait_seconds)

    return JsonResponse({"triggered": True, "result": result})


@csrf_exempt
def ingest_status(request):
    """Optional helper endpoint to debug indexing."""
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    return JsonResponse(get_indexer_status())


######################################################################
def _bundle_to_context_text(bundle: dict) -> str:
    parts = []
    ap = bundle.get("account_plan") or {}
    if ap:
        keep = [
            "Account_Name",
            "Account_Sector",
            "Account_Vertical",
            "Account_Type",
            "Pain_Points",
            "Strengths",
            "Weakness",
            "Threats",
            "Opportunities",
            "Cross_Sell_Opportunities",
            "Products_Or_Services",
            "Key_Business_IT_Priorities",
            "IT_Road_Map",
            "Business_Metrics",
            "History_With_Version_1",
            "Priority_For_Growing_Account",
            "Account_Manager",
            "Account_Director",
            "Delivery_Lead",
        ]
        ap_filtered = {
            k: ap.get(k) for k in keep if ap.get(k) not in (None, "", [], {})
        }
        parts.append("SQL_ACCOUNT_PLAN_VIEW:\n" + json.dumps(ap_filtered, ensure_ascii=False))

    for key in [
        "unified_metrics",
        "csat",
        "forecast",
        "revenue_employee_margin",
        "revenue_kantata",
        "tcv_crm",
        "targets",
    ]:
        rows = bundle.get(key) or []
        if rows:
            parts.append(f"SQL_{key.upper()} (sample):\n" + json.dumps(rows[:20], ensure_ascii=False))

    return "\n\n".join(parts).strip()


def _sql_is_sufficient(bundle: dict, sql_text: str) -> bool:
    min_chars = int(os.getenv("SQL_FIRST_MIN_CHARS", "800"))
    min_tables = int(os.getenv("SQL_FIRST_MIN_TABLES", "2"))

    tables_with_data = sum(
        1
        for k in [
            "unified_metrics",
            "csat",
            "forecast",
            "revenue_employee_margin",
            "revenue_kantata",
            "tcv_crm",
            "targets",
        ]
        if (bundle.get(k) or [])
    )

    # Pass if: enough text AND (account_plan exists OR enough tables have rows)
    return (len(sql_text) >= min_chars) and (
        bundle.get("account_plan") or tables_with_data >= min_tables
    )


#################################################################################


@csrf_exempt
def chat(request):
    """
    POST /api/chat
    Plain text output for chat UI.

    Retrieval order:
      1) Fabric bundle (if account name present)
      2) Azure Search chunks fallback
      3) AOAI answer from combined context
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = _get_user_id(request, body)

    raw_query = str(body.get("query") or body.get("prompt") or "").strip()
    top_k = int(body.get("top_k") or int(os.getenv("AZURE_SEARCH_FALLBACK_TOPK", "12")))

    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    if not raw_query:
        return JsonResponse({"error": "query required"}, status=400)

    # -----------------------------
    # Extract account name from prompt (optional)
    # -----------------------------
    import re

    company_name = str(body.get("company_name") or body.get("account_name") or "").strip()
    question = raw_query

    # 1) If user uses: Company="..." | Question="..."
    if not company_name:
        m = re.search(r'Company\s*=\s*"([^"]+)"', raw_query, re.IGNORECASE)
        if m:
            company_name = m.group(1).strip()

        m2 = re.search(r'Question\s*=\s*"([^"]+)"', raw_query, re.IGNORECASE)
        if m2:
            question = m2.group(1).strip()
        else:
            # If no Question="...", take text after first |
            if "|" in raw_query:
                question = raw_query.split("|", 1)[1].strip()

    # 2) Fallback: "NatWest Group: ...."
    if not company_name:
        if ":" in raw_query:
            left, right = raw_query.split(":", 1)  # IMPORTANT: only first colon
            if left.strip() and right.strip():
                company_name = left.strip()
                question = right.strip()

    # -----------------------------
    # 1) Fabric context (best effort)
    # -----------------------------
    fabric_text = ""
    fabric_ok = False

    def bundle_to_text(bundle: dict) -> str:
        # Keep this readable (LLM-friendly), not too huge
        parts = []
        ap = bundle.get("account_plan") or {}
        if ap:
            parts.append("FABRIC_ACCOUNT_PLAN:\n" + json.dumps(ap, ensure_ascii=False, default=str))

        for k in [
            "targets",
            "tcv_crm",
            "revenue_kantata",
            "forecast",
            "csat",
            "unified_metrics",
            "revenue_employee_margin",
        ]:
            rows = bundle.get(k) or []
            if rows:
                parts.append(
                    f"FABRIC_{k.upper()} (top 30):\n" + json.dumps(rows[:30], ensure_ascii=False, default=str)
                )

        return "\n\n".join(parts).strip()

    try:
        if company_name:
            bundle = fetch_fabric_bundle(company_name, top_n=50)
            fabric_text = bundle_to_text(bundle)

            # Simple sufficiency check
            fabric_ok = len(fabric_text) >= int(os.getenv("SQL_FIRST_MIN_CHARS", "800"))
            print(f"🧩 Fabric chars={len(fabric_text)} fabric_ok={fabric_ok} company={company_name}")
    except Exception as e:
        print(f"⚠️ Fabric fetch failed, fallback to Azure Search. Error: {e}")
        fabric_ok = False

    # -----------------------------
    # 2) Azure Search fallback
    # -----------------------------
    search_text = ""
    if not fabric_ok:
        chunks = search_chunks(user_id=user_id, query=raw_query, top_k=top_k)
        search_text = "\n".join(
            (c.get("chunk_text") or "").strip()
            for c in chunks
            if (c.get("chunk_text") or "").strip()
        ).strip()
        print(f"🔎 Search chars={len(search_text)} top_k={top_k}")

    # -----------------------------
    # 3) Final context → AOAI answer
    # -----------------------------
    context_text = "\n\n".join([t for t in [fabric_text, search_text] if t]).strip()
    if not context_text:
        return JsonResponse(
            {"message": "TBD - No relevant information found in Fabric or uploaded documents.", "payload": None},
            status=200,
        )

    # ✅ Detect template intent
    template_type = detect_template_type_from_query(question)

    # =========================================================
    # ✅ ADDITION: Growth Strategy normalization (NEW)
    # =========================================================
    # backend/api/views.py

    def _normalize_customer_profile_payload(obj: dict) -> dict:
        # If the LLM didn't wrap it in "data", use the whole object
        raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
        if not isinstance(raw_data, dict):
            raw_data = {}

        def to_list(val):
            if isinstance(val, list):
                return [str(x).strip() for x in val if x]
            if isinstance(val, str) and val.strip():
                # Splits by newline or semicolon if it's a single long string
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
    
    # views.py

    # backend/api/views.py

    # backend/api/views.py

    # backend/api/views.py

    # backend/api/views.py

    def _normalize_service_line_growth_payload(obj: dict) -> dict:
        # 1. Extract the raw list from the AI's response
        data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
        raw_list = data.get("growth_actions_list") if isinstance(data, list) else []
        
        # 2. Key mapping to match your Frontend KEY_MAP exactly
        # We use lowercase keys here to match any AI capitalization
        mapping = {
            "cloud transformation": "Cloud_Transformation",
            "data": "Data",
            "ai": "AI",
            "srg managed services": "SRG_Managed_Services",
            "ea": "EA",
            "strategy, design and change": "Strategy_Design_and_Change",
            "strategy design and change": "Strategy_Design_and_Change",
            "sam & licensing": "SAM_and_Licensing",
            "sam and licensing": "SAM_and_Licensing"
        }

        final_data = {}
        for item in raw_list:
            # ✅ Normalize the input string to lowercase for a guaranteed match
            area = str(item.get("development_area") or "").lower().strip()
            key = mapping.get(area)
            
            if key:
                # Map AI fields to the exact keys expected by the React table
                final_data[key] = {
                    "Objective": item.get("objective") or "TBD",
                    "Target_Buying_Centres": item.get("target_buying_centres") or "TBD",
                    "Current_Status": item.get("current_status") or "TBD",
                    "Next_Action_and_Responsible_Person": item.get("next_action_responsible_person") or "TBD"
                }
        
        # 3. Return the standard structure
        return {"template_type": "service_line_growth_actions", "data": final_data}


    def _normalize_growth_strategy_payload(obj: dict) -> dict:
        """
        Ensures STRICT shape matching GrowthStrategy.tsx fieldNames.
        """
        if not isinstance(obj, dict):
            obj = {}

        data = obj.get("data") if isinstance(obj.get("data"), dict) else obj
        if not isinstance(data, dict):
            data = {}

        def to_list(val):
            if isinstance(val, list):
                return [str(x).strip() for x in val if x]
            if val is not None and str(val).strip():
                # Split long strings by newline or semicolon into bullet points
                return [p.strip() for p in str(val).replace("\n", ";").split(";") if p.strip()]
            return ["TBD"]

        # ✅ Map LLM keys (growth_vectors) to React keys (key_vectors_for_driving_growth)
        return {
            "template_type": "growth_strategy",
            "data": {
                "growth_aspiration": to_list(data.get("growth_aspiration")),
                "key_vectors_for_driving_growth": to_list(
                    data.get("growth_vectors") or data.get("key_vectors_for_driving_growth")
                ),
                "improve_quality_sustainability_revenues": to_list(
                    data.get("revenue_quality_sustainability") or data.get("improve_quality_sustainability_revenues")
                ),
                "potential_inorganic_opportunities": to_list(
                    data.get("inorganic_opportunities") or data.get("potential_inorganic_opportunities")
                ),
            },
        }

    if template_type == "relationship_heatmap":
        schema = get_template_schema("relationship_heatmap")

        filled = fill_template_json_only(template=schema, context_text=context_text)
        safe = enforce_tbd(schema, filled)

        # =========================================================
        # ✅ NECESSARY FIX: normalize LLM output into correct schema
        # =========================================================
        import ast

        def _normalize_relationship_heatmap_payload(obj: dict) -> dict:
            if not isinstance(obj, dict):
                obj = {}

            data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
            rows = data.get("stakeholder_list", [])
            if not isinstance(rows, list):
                rows = []

            def _as_dict_from_str(s: str) -> dict | None:
                """
                Tries to parse strings like:
                "{'client_stakeholder': 'Paul', 'role': 'CEO', ...}"
                into a real dict.
                """
                if not isinstance(s, str):
                    return None
                t = s.strip()
                if not (t.startswith("{") and t.endswith("}")):
                    return None
                try:
                    parsed = ast.literal_eval(t)  # safe eval for literals
                    return parsed if isinstance(parsed, dict) else None
                except Exception:
                    return None

            normalized_rows = []
            for r in rows:
                if isinstance(r, str):
                    maybe = _as_dict_from_str(r)
                    if maybe:
                        r = maybe  # ✅ convert string->dict

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
                    # plain name only
                    normalized_rows.append({
                        "client_stakeholder": (r.strip() or "TBD"),
                        "role": "TBD",
                        "reports_to": "TBD",
                        "level": "TBD",
                        "client_relationship": "TBD",
                        "engagement_plan_next_action": "TBD",
                    })

            return {
                "template_type": "relationship_heatmap",
                "data": {"stakeholder_list": normalized_rows},
            }

        # ✅ THIS LINE WAS MISSING BEFORE (the real fix)
        safe = _normalize_relationship_heatmap_payload(safe)

        # ✅ save JSON to DB
        _save_payload(user_id=user_id, company_name=company_name, template_type="relationship_heatmap", payload=safe)

        # ✅ show human-readable in chat
        message = _humanize_relationship_heatmap(safe)

        return JsonResponse({"message": message, "payload": safe}, json_dumps_params={"ensure_ascii": False})

    # =========================================================
    # ✅ ADDITION: Growth Strategy template branch (NEW)
    # =========================================================
    if template_type == "growth_strategy":
        schema = get_template_schema("growth_strategy")

        filled = fill_template_json_only(template=schema, context_text=context_text)
        safe = enforce_tbd(schema, filled)

        # ✅ normalize
        safe = _normalize_growth_strategy_payload(safe)

        # ✅ save JSON to DB
        _save_payload(user_id=user_id, company_name=company_name, template_type="growth_strategy", payload=safe)

        # ✅ human readable chat message
        d = safe.get("data") or {}
        gv = d.get("growth_vectors") or []
        if isinstance(gv, list):
            gv_text = "\n".join([f"- {x}" for x in gv])
        else:
            gv_text = str(gv)

        message = (
            "Growth Strategy:\n"
            f"• Growth aspiration: {d.get('growth_aspiration', 'TBD')}\n"
            f"• Growth vectors:\n{gv_text}\n"
            f"• Revenue quality & sustainability: {d.get('revenue_quality_sustainability', 'TBD')}\n"
            f"• Inorganic opportunities: {d.get('inorganic_opportunities', 'TBD')}"
        )

        return JsonResponse({"message": message, "payload": safe}, json_dumps_params={"ensure_ascii": False})
    
    # Inside chat(request) in views.py
    if template_type == "customer_profile":
        schema = get_template_schema("customer_profile")
        filled = fill_template_json_only(template=schema, context_text=context_text)
        safe = _normalize_customer_profile_payload(filled)

        # Save to DB
        _save_payload(
            user_id=user_id, 
            company_name=company_name, 
            template_type="customer_profile", 
            payload=safe
        )
        return JsonResponse({"message": "Profile updated", "payload": safe}) 
    
    # Inside chat(request) in views.py
    # Inside chat(request) in views.py
    if template_type == "service_line_growth_actions":
        schema = get_template_schema("service_line_growth_actions")
        filled = fill_template_json_only(template=schema, context_text=context_text)
        
        # ✅ Transform AI list into Keyed Object for Frontend
        safe = _normalize_service_line_growth_payload(filled)

        # ✅ Ensure company_name is NOT empty
        final_company = company_name if company_name else "NatWest Group"

        _save_payload(
            user_id=user_id, 
            company_name=final_company, 
            template_type="service_line_growth_actions", 
            payload=safe
        )
        
        # ✅ FIX: This return prevents the "ValueError: returned None" crash
        return JsonResponse({
            "message": f"I've updated the Service Line Growth Actions for {final_company}.", 
            "payload": safe
        }, json_dumps_params={"ensure_ascii": False})

    # Normal Q&A
    answer = answer_only_from_context(query=question, context_text=context_text)
    return JsonResponse({"message": answer or "TBD", "payload": None}, json_dumps_params={"ensure_ascii": False})



# ----------------------------
# Template fill endpoint
# ----------------------------
@csrf_exempt
def fill_template(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = _get_user_id(request, body)

    template_name = str(body.get("template_name") or confirmed_template_type or "").strip().lower()
    company_name = str(body.get("company_name") or "").strip()

    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    if not template_name or not company_name:
        return JsonResponse({"error": "template_name and company_name required"}, status=400)

    # ✅ schema skeleton
    try:
        from .template_schemas import get_template_schema
        schema = get_template_schema(template_name)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    # =========================================================
    # ✅ SQL-FIRST RETRIEVAL (with Azure Search fallback)
    # =========================================================
    import os
    import json
    from .azure_sql import fetch_account_bundle

    def _bundle_to_context_text(bundle: dict) -> str:
        parts = []

        ap = bundle.get("account_plan") or {}
        if ap:
            keep = [
                "Account_Name",
                "Account_Sector",
                "Account_Vertical",
                "Account_Type",
                "Pain_Points",
                "Strengths",
                "Weakness",
                "Threats",
                "Opportunities",
                "Cross_Sell_Opportunities",
                "Products_Or_Services",
                "Key_Business_IT_Priorities",
                "IT_Road_Map",
                "Business_Metrics",
                "History_With_Version_1",
                "Priority_For_Growing_Account",
            ]
            ap_filtered = {
                k: ap.get(k)
                for k in keep
                if k in ap and ap.get(k) not in (None, "")
            }
            parts.append("ACCOUNT_PLAN_VIEW:\n" + json.dumps(ap_filtered, ensure_ascii=False))

        for key in [
            "unified_metrics",
            "csat",
            "forecast",
            "revenue_employee_margin",
            "revenue_kantata",
            "tcv_crm",
            "targets",
        ]:
            rows = bundle.get(key) or []
            if rows:
                parts.append(f"{key.upper()} (sample):\n" + json.dumps(rows[:20], ensure_ascii=False))

        return "\n\n".join(parts).strip()

    min_chars = int(os.getenv("SQL_FIRST_MIN_CHARS", "800"))
    min_tables = int(os.getenv("SQL_FIRST_MIN_TABLES", "2"))

    sql_context_text = ""
    sql_ok = False

    try:
        bundle = fetch_account_bundle(company_name)
        sql_context_text = _bundle_to_context_text(bundle)

        tables_with_data = sum(
            1
            for k in [
                "unified_metrics",
                "csat",
                "forecast",
                "revenue_employee_margin",
                "revenue_kantata",
                "tcv_crm",
                "targets",
            ]
            if (bundle.get(k) or [])
        )

        if (
            len(sql_context_text) >= min_chars
            and (bundle.get("account_plan") or tables_with_data >= min_tables)
        ):
            sql_ok = True

    except Exception as e:
        print(f"⚠️ SQL fetch failed, will fallback to Azure Search. Error: {e}")

    # ✅ Azure Search fallback
    search_context_text = ""
    if not sql_ok:
        retrieval_query = f"{company_name} {template_name}"
        chunks = search_chunks(
            user_id=user_id,
            query=retrieval_query,
            top_k=int(os.getenv("AZURE_SEARCH_FALLBACK_TOPK", "12")),
        )
        search_context_text = "\n\n".join(
            [
                (c.get("chunk_text") or "").strip()
                for c in chunks
                if (c.get("chunk_text") or "").strip()
            ]
        ).strip()

    context_text = "\n\n".join([t for t in [sql_context_text, search_context_text] if t]).strip()

    # =========================================================

    # no context → return TBD-filled skeleton
    if not context_text:
        return JsonResponse(
            enforce_tbd(schema, {"template_type": schema["template_type"], "data": {}}),
            json_dumps_params={"ensure_ascii": False},
        )

    # ✅ ask LLM to fill EXACT schema
    filled = fill_template_json_only(
        template=schema,
        context_text=context_text,
    )

    # ✅ normalize for Service_Line_Penetration (merge rows by id)
    if schema.get("template_type") == "Service_Line_Penetration":
        filled["template_type"] = "Service_Line_Penetration"

        base = schema["data"]
        out = filled.get("data") or {}
        if not isinstance(out, dict):
            out = {}

        base_rows = {r["id"]: r for r in base.get("tableRows", [])}
        got_rows = out.get("tableRows")

        if isinstance(got_rows, dict):
            merged = []
            for _id, row in base_rows.items():
                patch = got_rows.get(_id, {})
                patch = patch if isinstance(patch, dict) else {}
                merged.append({**row, **patch})
            out["tableRows"] = merged

        elif isinstance(got_rows, list):
            patch_map = {
                str(r.get("id")): r
                for r in got_rows
                if isinstance(r, dict) and r.get("id")
            }
            merged = []
            for _id, row in base_rows.items():
                merged.append({**row, **patch_map.get(_id, {})})
            out["tableRows"] = merged

        else:
            out["tableRows"] = base.get("tableRows", [])

        if not out.get("tableRows"):
            out["tableRows"] = base.get("tableRows", [])

        out["xxValues"] = out.get("xxValues") or base.get("xxValues", [])
        out["insights"] = out.get("insights") or base.get("insights", "")

        filled["data"] = out

    # final safety: fill missing values with TBD/XX
    safe = enforce_tbd(schema, filled)
    return JsonResponse(safe, json_dumps_params={"ensure_ascii": False})


def _humanize_relationship_heatmap(payload: dict) -> str:
    data = (payload or {}).get("data") or {}
    rows = data.get("stakeholder_list") or []

    # ✅ If model returned something wrong like list[str], don't crash
    if rows and isinstance(rows[0], str):
        lines = ["Relationship Heatmap (stakeholders found):"]
        for i, name in enumerate(rows, 1):
            lines.append(f"{i}) {name}")
        lines.append(
            "Note: Details like role/level/reports_to are TBD because structured data wasn't returned."
        )
        return "\n".join(lines)

    if not rows:
        return "I couldn’t extract stakeholder details from the available context (all values TBD)."

    lines = ["Relationship Heatmap (key stakeholders):"]
    for i, r in enumerate(rows, 1):
        if not isinstance(r, dict):
            continue  # ✅ skip junk safely

        name = (r.get("client_stakeholder") or "TBD").strip()
        role = (r.get("role") or "TBD").strip()
        level = (r.get("level") or "TBD").strip()
        reports_to = (r.get("reports_to") or "TBD").strip()
        rel = (r.get("client_relationship") or "TBD").strip()
        next_action = (r.get("engagement_plan_next_action") or "TBD").strip()

        lines.append(
            f"{i}) {name} — {role} ({level}) | Reports to: {reports_to} | Relationship: {rel}"
        )
        lines.append(f"   Next action: {next_action}")

    return "\n".join(lines)


def _save_payload(user_id: str, company_name: str, template_type: str, payload: dict) -> TemplatePayload:
    obj, _ = TemplatePayload.objects.update_or_create(
        user_id=str(user_id),
        company_name=str(company_name or ""),
        template_type=str(template_type),
        defaults={"payload": payload},
    )
    return obj


def _load_payload(user_id: str, company_name: str, template_type: str) -> dict | None:
    obj = TemplatePayload.objects.filter(
        user_id=str(user_id),
        company_name=str(company_name or ""),
        template_type=str(template_type),
    ).first()
    return obj.payload if obj else None


@csrf_exempt
def relationship_heatmap_get(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    user_id = str(request.GET.get("user_id") or "101").strip()

    # ✅ FIX: Fetch the latest record for this user and template, ignoring company
    obj = TemplatePayload.objects.filter(
        user_id=user_id, 
        template_type="relationship_heatmap"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({"data": []}, json_dumps_params={"ensure_ascii": False})

    # Extract the stakeholder list from the stored payload
    rows = (obj.payload.get("data") or {}).get("stakeholder_list") or []
    return JsonResponse({"data": rows}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def relationship_heatmap_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or body.get("company") or "").strip()

    # Frontend sends: { template_type, data: { stakeholder_list: [...] } } OR { data: [...] }
    template_type = "relationship_heatmap"
    rows = []

    if isinstance(body.get("data"), list):
        rows = body.get("data") or []
    else:
        rows = ((body.get("data") or {}).get("stakeholder_list") or [])

    payload = {
        "template_type": template_type,
        "data": {"stakeholder_list": rows},
    }

    _save_payload(user_id=user_id, company_name=company, template_type=template_type, payload=payload)
    return JsonResponse({"success": True, "payload": payload}, json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def growth_strategy_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    # Pull latest growth_strategy record for this user
    obj = TemplatePayload.objects.filter(user_id=user_id, template_type="growth_strategy").order_by('-updated_at').first()
    
    if not obj:
        return JsonResponse({}, status=200) # Component handles empty state
    
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def growth_strategy_save(request):
    """
    Saves the user edits from the Growth Strategy template.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    body = _json_body(request)
    # Use fallback 101 if user_id is missing
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()
    
    # ✅ The frontend sends editable.draftData which is already { growth_aspiration: [...], ... }
    # Wrap it in the standard payload structure
    payload = {
        "template_type": "growth_strategy",
        "data": body.get("data") or {}
    }
    
    saved_obj = _save_payload(user_id=user_id, company_name=company, template_type="growth_strategy", payload=payload)
    
    # Return result.payload.data as expected by React's performSave/handleManualSave
    return JsonResponse({
        "success": True, 
        "payload": {
            "data": saved_obj.payload.get("data", {})
        }
    }, json_dumps_params={"ensure_ascii": False})

# backend/api/views.py

@csrf_exempt
def customer_profile_get(request):
    """Fetches latest saved customer profile for the user."""
    user_id = str(request.GET.get("user_id") or "101").strip()
    
    obj = TemplatePayload.objects.filter(
        user_id=user_id, 
        template_type="customer_profile"
    ).order_by('-updated_at').first()
    
    if not obj:
        # Return empty structure matching the frontend's expected keys
        return JsonResponse({}, status=200)
    
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def customer_profile_save(request):
    """Saves manual edits or auto-saves from the chatbot."""
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("customer_name") or "").strip() # Use customer_name for company key
    
    # Wrap data in the standard payload format
    payload = {
        "template_type": "customer_profile",
        "data": body # The body is already the dictionary of fields
    }
    
    saved_obj = _save_payload(
        user_id=user_id, 
        company_name=company, 
        template_type="customer_profile", 
        payload=payload
    )
    
    return JsonResponse({
        "success": True, 
        "data": saved_obj.payload.get("data", {})
    }, json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def service_line_growth_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id, 
        template_type="service_line_growth_actions"
    ).order_by('-updated_at').first()
    
    return JsonResponse(obj.payload.get("data", {}) if obj else {}, json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def service_line_growth_save(request):
    if request.method != "POST": 
        return JsonResponse({"error": "POST only"}, status=405)
    
    body = _json_body(request)
    # Ensure we get the user_id and company_name from the body
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "NatWest Group").strip()
    
    # The frontend 'editable.draftData' is already formatted as the keyed object
    payload = {
        "template_type": "service_line_growth_actions",
        "data": body 
    }
    
    saved_obj = _save_payload(
        user_id=user_id, 
        company_name=company, 
        template_type="service_line_growth_actions", 
        payload=payload
    )
    
    return JsonResponse({"success": True, "data": saved_obj.payload.get("data")})