# backend/api/views.py

import json
import os
from datetime import datetime, timezone
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from azure.storage.blob import BlobClient
import ast
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
from .logo_fetcher import fetch_company_logo

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import RegisterSerializer

from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer

import re

def extract_company_names(answer_text):
    companies = []

    lines = answer_text.split("\n")
    for line in lines:
        line = line.strip()
        if line and not line.lower().startswith(("core", "preferred", "other")):
            companies.append(line)

    return companies

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
def register_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if User.objects.filter(username=data.get("username")).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)

    serializer = RegisterSerializer(data=data)

    if serializer.is_valid():
        user = serializer.save()
        return JsonResponse({
            "success": True,
            "username": user.username
        })

    return JsonResponse(serializer.errors, status=400)

@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = json.loads(request.body.decode("utf-8"))

    user = authenticate(
        username=data.get("username"),
        password=data.get("password")
    )

    if not user:
        return JsonResponse({"error": "Invalid username or password"}, status=401)

    

    return JsonResponse({
    "success": True,
    "user": {
        "id": user.id,
        "username": user.username,
        "email": user.email
    }
})


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
        {"user_id": user_id, "filename": filename,
            "blob_path": blob_path or "(batch)"},
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

@csrf_exempt
def create_chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = json.loads(request.body.decode("utf-8"))
    user_id = data.get("user_id")

    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    chat = ChatSession.objects.create(
        user=user,
        title="New Chat"
    )

    return JsonResponse({
        "id": chat.id,
        "title": chat.title,
        "created_at": chat.created_at
    })


def list_chats(request):
    user_id = request.GET.get("user_id")
    chats = ChatSession.objects.filter(user_id=user_id).order_by("-created_at")
    data = ChatSessionSerializer(chats, many=True).data
    return JsonResponse(data, safe=False)


def get_chat_messages(request, chat_id):
    messages = ChatMessage.objects.filter(chat_id=chat_id).order_by("timestamp")
    data = ChatMessageSerializer(messages, many=True).data
    return JsonResponse(data, safe=False)


def save_message(chat, sender, text):
    ChatMessage.objects.create(
        chat=chat,
        sender=sender,
        text=text
    )

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
        parts.append("SQL_ACCOUNT_PLAN_VIEW:\n" +
                     json.dumps(ap_filtered, ensure_ascii=False))

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
            parts.append(f"SQL_{key.upper()} (sample):\n" +
                         json.dumps(rows[:20], ensure_ascii=False))

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
    chat_id = body.get("chat_id")

    top_k = int(body.get("top_k") or int(
        os.getenv("AZURE_SEARCH_FALLBACK_TOPK", "12")))

    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    if not raw_query:
        return JsonResponse({"error": "query required"}, status=400)

    chat = None
    if chat_id:
        try:
            chat = ChatSession.objects.get(id=chat_id)
            # ✅ Save USER message immediately
            if chat:
                save_message(chat, "user", raw_query)

            # ✅ Update chat title (first message)
            if chat and chat.title == "New Chat":
                chat.title = raw_query[:50]
                chat.save()


        except ChatSession.DoesNotExist:
            return JsonResponse({"error": "Invalid chat_id"}, status=400)


    # -----------------------------
    # Extract account name from prompt (optional)
    # -----------------------------
    import re

    company_name = str(body.get("company_name")
                       or body.get("account_name") or "").strip()
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
            # IMPORTANT: only first colon
            left, right = raw_query.split(":", 1)
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
            parts.append("FABRIC_ACCOUNT_PLAN:\n" +
                         json.dumps(ap, ensure_ascii=False, default=str))

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
                    f"FABRIC_{k.upper()} (top 30):\n" +
                    json.dumps(rows[:30], ensure_ascii=False, default=str)
                )

        return "\n\n".join(parts).strip()

    try:
        if company_name:
            bundle = fetch_fabric_bundle(company_name, top_n=50)
            fabric_text = bundle_to_text(bundle)

            # Simple sufficiency check
            fabric_ok = len(fabric_text) >= int(
                os.getenv("SQL_FIRST_MIN_CHARS", "800"))
            print(
                f"🧩 Fabric chars={len(fabric_text)} fabric_ok={fabric_ok} company={company_name}")
    except Exception as e:
        print(f"⚠️ Fabric fetch failed, fallback to Azure Search. Error: {e}")
        fabric_ok = False

    # -----------------------------
    # 2) Azure Search fallback
    # -----------------------------
    search_text = ""
    if not fabric_ok:
        try:
            chunks = search_chunks(user_id=user_id, query=raw_query, top_k=top_k)
        except Exception as e:
            print("⚠️ Search failed:", e)
            chunks = []

        search_text = "\n".join(
            (c.get("chunk_text") or "").strip()
            for c in chunks
            if (c.get("chunk_text") or "").strip()
        ).strip()
        print(f"🔎 Search chars={len(search_text)} top_k={top_k}")

    # -----------------------------
    # 3) Final context → AOAI answer
    # -----------------------------
    context_text = "\n\n".join(
        [t for t in [fabric_text, search_text] if t]
    ).strip()

    if not context_text:
        answer = "No relevant data found."

        if chat:
            save_message(chat, "bot", answer)

        return JsonResponse(
            {"message": answer, "payload": None},
            json_dumps_params={"ensure_ascii": False}
        )



    # ✅ Detect template intent
    template_type = detect_template_type_from_query(question)

    # =========================================================
    # ✅ ADDITION: Growth Strategy normalization (NEW)
    # =========================================================
    # backend/api/views.py

    def _normalize_customer_profile_payload(obj: dict) -> dict:
        # If the LLM didn't wrap it in "data", use the whole object
        raw_data = obj.get("data") if isinstance(
            obj.get("data"), dict) else obj
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

    def _normalize_innovation_strategy_payload(obj: dict) -> dict:
        """
        Maps readable AI keys to the specific IDs (1, 2, 3a...) required by the frontend.
        """
        raw_data = obj.get("data") if isinstance(
            obj.get("data"), dict) else obj
        if not isinstance(raw_data, dict):
            raw_data = {}

        # Map AI Keys -> Frontend IDs
        clean_data = {
            "1": str(raw_data.get("current_outlook_on_ai") or "TBD"),
            "2": str(raw_data.get("top_motivations_for_genai") or "TBD"),
            "3a": str(raw_data.get("top_genai_projects") or "TBD"),
            "3b": str(raw_data.get("other_innovation_projects") or "TBD"),
            "4": str(raw_data.get("high_value_use_cases") or "TBD")
        }

        return {
            "template_type": "innovation_strategy",
            "data": clean_data
        }

    def _normalize_talent_excellence_payload(obj: dict) -> dict:
        raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}

        return {
            "template_type": "talent_excellence_overview",
            "data": {
                "overviewRows": raw.get("overviewRows") or [],
                "demandRows": raw.get("demandRows") or [],
                "insights": str(raw.get("insights") or "TBD")
            }
        }
    
    def _normalize_operational_implementation_plan(obj) -> dict:
        """
        Robust normalizer that handles if LLM returns:
        1. A list of rows directly: [...]
        2. A dict with data list: {"data": [...]}
        3. A nested dict: {"data": {"data": [...]}}
        """
        rows = []
        plan_date = "xx"

        # 1. unwrapping layers
        if isinstance(obj, list):
            rows = obj
        elif isinstance(obj, dict):
            # Try to find the list inside 'data'
            if isinstance(obj.get("data"), list):
                rows = obj.get("data")
                plan_date = str(obj.get("plan_date") or "xx")
            # Handle double nesting {"data": {"data": [...]}}
            elif isinstance(obj.get("data"), dict):
                inner = obj.get("data")
                rows = inner.get("data") or []
                plan_date = str(inner.get("plan_date") or obj.get("plan_date") or "xx")
            else:
                # Fallback if the dict itself is the row wrapper? Unlikely but safe.
                rows = []
        
        # 2. Safety check
        if not isinstance(rows, list):
            rows = []

        # 3. Clean rows
        clean_rows = []
        for i, r in enumerate(rows):
            if not isinstance(r, dict): 
                continue
            
            clean_rows.append({
                "category": str(r.get("category") or "Operational Excellence"),
                "subcategory": str(r.get("subcategory") or "TBD"),
                "action_number": i + 1,
                "action_description": str(r.get("action_description") or "TBD"),
                "primary_owner": str(r.get("primary_owner") or "TBD"),
                "support_team": str(r.get("support_team") or "TBD"),
                "timeline": str(r.get("timeline") or "TBD"),
                "status": str(r.get("status") or "To be initiated"),
                "help_required": str(r.get("help_required") or "TBD"),
                "investment_needed": str(r.get("investment_needed") or "TBD"),
                "impact": str(r.get("impact") or "TBD")
            })
            
        return {
            "template_type": "operational_implementation_plan",
            "plan_date": plan_date,
            "data": clean_rows
        }
    
    def _normalize_operational_excellence_payload(obj: dict) -> dict:
        """
        Ensures the LLM output matches exactly what OperationalExcellencePage.tsx expects.
        Fixes strings-instead-of-lists and missing keys.
        """
        # 1. Handle if LLM forgot the "data" wrapper or double-wrapped it
        raw_data = obj.get("data") if isinstance(
            obj.get("data"), dict) else obj
        if not isinstance(raw_data, dict):
            raw_data = {}

        # 2. Helper to force data into a List of Strings
        def to_list(val):
            if isinstance(val, list):
                # Filter out empty strings and ensure everything is a string
                return [str(x).strip() for x in val if x]
            if isinstance(val, str) and val.strip():
                # If LLM returned a bulleted string, try to split it
                if "\n" in val:
                    return [x.strip() for x in val.split("\n") if x.strip()]
                return [val.strip()]
            # Default fallback
            return ["TBD"]

        # 3. Return the Safe Structure
        return {
            "template_type": "operational_excellence_strategy",
            "data": {
                "current_gp_percentage": str(raw_data.get("current_gp_percentage") or "TBD"),
                "gp_percentage_ambition": str(raw_data.get("gp_percentage_ambition") or "TBD"),

                # These two MUST be lists for the frontend .map() to work
                "priority_levers_to_drive_margin_uplift": to_list(raw_data.get("priority_levers_to_drive_margin_uplift")),
                "plan_for_commercial_model_transformation": to_list(raw_data.get("plan_for_commercial_model_transformation"))
            }
        }

    # =========================================================
    # ✅ NECESSARY FIX: normalize LLM output into correct schema
    # =========================================================
    

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


    def _normalize_service_line_growth_payload(obj: dict) -> dict:
        """
        Ensures all 7 required service line keys exist, even if LLM missed one.
        """
        REQUIRED_KEYS = [
            "Cloud_Transformation", "Data", "AI", "SRG_Managed_Services",
            "EA", "Strategy_Design_and_Change", "SAM_and_Licensing"
        ]
        DEFAULT_ROW = {
            "Objective": "TBD",
            "Target_Buying_Centres": "TBD",
            "Current_Status": "TBD",
            "Next_Action_and_Responsible_Person": "TBD"
        }

        raw_data = obj.get("data") if isinstance(
            obj.get("data"), dict) else obj
        if not isinstance(raw_data, dict):
            raw_data = {}

        clean_data = {}
        for key in REQUIRED_KEYS:
            # Get the row from LLM or use default
            row = raw_data.get(key)
            if not isinstance(row, dict):
                row = DEFAULT_ROW.copy()

            # Ensure all fields inside the row exist
            clean_row = {}
            for field in ["Objective", "Target_Buying_Centres", "Current_Status", "Next_Action_and_Responsible_Person"]:
                clean_row[field] = str(row.get(field) or "TBD")

            clean_data[key] = clean_row

        return {
            "template_type": "service_line_growth_actions",
            "data": clean_data
        }

    def _normalize_account_performance_payload(obj: dict) -> dict:
        """
        Enforces the exact rows required for the Account Performance table.
        """
        # 1. Define the Exact Rows from your UI
        DEFAULTS = {
            "financials": [
                {"metric": "Revenue Budget", "unit": "€ Mn"},
                {"metric": "Revenue Actuals / Forecast", "unit": "€ Mn"},
                {"metric": "TCV won", "unit": "€ Mn"},
                {"metric": "Win rate (YTD)", "unit": "%"},
                {"metric": "Book to bill ratio", "unit": "#"},
                {"metric": "SL revenue penetration %", "unit": "%"},
                {"metric": "# of SLs present in the account*", "unit": "#"}
            ],
            "delivery": [
                {"metric": "Gross Margin %", "unit": "%"},
                {"metric": "Revenue / FTE (ONS)", "unit": "€ K"},
                {"metric": "Revenue / FTE (OFS)", "unit": "€ K"},
                {"metric": "Cost / FTE (ONS)", "unit": "#"},
                {"metric": "Cost / FTE (OFS)", "unit": "#"}
            ],
            "talent": [
                {"metric": "Attrition %", "unit": "%"},
                {"metric": "Fulfilment %", "unit": "%"},
                {"metric": "Delivery on time %", "unit": "%"}
            ]
        }

        raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
        clean_data = {}

        # 2. Iterate through sections (financials, delivery, talent)
        for section_key, expected_rows in DEFAULTS.items():
            # Get LLM list or empty list
            llm_list = raw_data.get(section_key) or []

            # Map LLM data for easy lookup by metric name (lowercase)
            llm_map = {}
            if isinstance(llm_list, list):
                for item in llm_list:
                    if isinstance(item, dict) and item.get("metric"):
                        key = str(item["metric"]).lower().strip()
                        llm_map[key] = item

            # Build final list preserving EXACT order and units
            final_list = []
            for row_def in expected_rows:
                metric_name = row_def["metric"]
                default_unit = row_def["unit"]

                # Find match in LLM data
                match = llm_map.get(metric_name.lower()) or {}

                final_list.append({
                    "metric": metric_name,
                    "unit": str(match.get("unit") or default_unit),
                    "fy24": str(match.get("fy24") or "").strip(),
                    "fy25": str(match.get("fy25") or "").strip(),
                    "fy26": str(match.get("fy26") or "").strip()
                })

            clean_data[section_key] = final_list

        return {
            "template_type": "account_performance_annual_plan",
            "data": clean_data
        }

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
                    data.get("growth_vectors") or data.get(
                        "key_vectors_for_driving_growth")
                ),
                "improve_quality_sustainability_revenues": to_list(
                    data.get("revenue_quality_sustainability") or data.get(
                        "improve_quality_sustainability_revenues")
                ),
                "potential_inorganic_opportunities": to_list(
                    data.get("inorganic_opportunities") or data.get(
                        "potential_inorganic_opportunities")
                ),
            },
        }

    def _normalize_investment_plan_payload(obj: dict) -> dict:
        """
        Ensures the Investment Plan payload has the exact shape required by InvestmentPlan.tsx.
        """
        # Default rows structure based on your screenshot
        DEFAULT_ROWS = [
            {"id": 1, "type": "Billing investment"},
            {"id": 2, "type": "Buffers"},
            {"id": 3, "type": "Innovation"},
            {"id": 4, "type": "Free resources"},
            {"id": 5, "type": "Marketing investments / relationship building"},
            {"id": 6, "type": "Travel investments"},
        ]

        raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}

        # Get the list from AI (or empty)
        ai_list = raw_data.get("investments") or []

        # Map AI list to a dict for easy lookup by type
        ai_map = {}
        if isinstance(ai_list, list):
            for item in ai_list:
                if isinstance(item, dict) and item.get("investment_type"):
                    key = str(item["investment_type"]).lower().strip()
                    ai_map[key] = item

        # Build the final list, preserving the 6 specific rows
        final_list = []
        for def_row in DEFAULT_ROWS:
            def_type = def_row["type"]
            # Try to find AI data for this type
            match = ai_map.get(def_type.lower()) or {}

            final_list.append({
                "investment_number": def_row["id"],
                "investment_type": def_type,
                "investment_description": str(match.get("investment_description") or ""),
                "investment_value_eur": str(match.get("investment_value_eur") or ""),
                "targeted_outcome": str(match.get("targeted_outcome") or ""),
                "primary_owner": str(match.get("primary_owner") or ""),
                "timeline_status": str(match.get("timeline_status") or "To be discussed"),
                "remarks": str(match.get("remarks") or "")
            })

        return {
            "template_type": "investment_plan",
            "data": {
                "data": final_list,  # Frontend expects rows inside 'data'
                "total_investment_value": str(raw_data.get("total_investment_value") or "XX")
            }
        }
    
    def _normalize_implementation_plan_payload(obj: dict) -> dict:
        """
        Ensures the Implementation Plan has the correct list structure.
        """
        raw = obj.get("data") if isinstance(obj.get("data"), dict) else {}
        # Get rows or create defaults
        rows = raw.get("actions") or []
        if not isinstance(rows, list):
            rows = []
        # Ensure at least 3 empty rows if none exist
        while len(rows) < 3:
            rows.append({})
    
        clean_rows = []
        for r in rows:
            clean_rows.append({
                "action": str(r.get("action") or ""),
                "timeline": str(r.get("timeline") or ""),
                "owner": str(r.get("owner") or ""),
                "status": str(r.get("status") or "To be initiated"),
                "investment_needed": str(r.get("investment_needed") or ""),
                "impact": str(r.get("impact") or "")
            })
    
        return {
            "template_type": "implementation_plan",
            "data": { "actions": clean_rows }
        }

    def _normalize_tech_spend_payload(obj: dict) -> dict:
        """
        Ensures the Tech Spend payload has the exact shape required by TechSpendView.tsx.
        """
        # Defaults matching Frontend
        DEFAULTS = {
            "rows": [
                {"id": 1, "name": "BU1"}, {"id": 2, "name": "BU2"}, {
                    "id": 3, "name": "BU3"},
                {"id": 4, "name": "BU4"}, {
                    "id": 5, "name": "BU5"}, {"id": 6, "name": "BU6"}
            ],
            "geoRevenue": [
                {"l": "Americas", "h": "75%"}, {"l": "EMEA", "h": "60%"},
                {"l": "APAC", "h": "20%"}, {"l": "Others", "h": "15%"}
            ],
            "geoTalent": [
                {"geo": "Americas"}, {"geo": "EMEA"}, {"geo": "APAC"}
            ],
            "geoPriorities": [
                {"geo": "Americas"}, {"geo": "EMEA"}, {"geo": "APAC"}
            ]
        }

        raw_data = obj.get("data") if isinstance(obj.get("data"), dict) else {}
        clean_data = {}

        # 1. Normalize Rows (Business Units)
        llm_rows = raw_data.get("rows") or []
        clean_rows = []
        for i, def_row in enumerate(DEFAULTS["rows"]):
            # Try to find matching row from LLM by ID or Index
            match = {}
            if i < len(llm_rows) and isinstance(llm_rows[i], dict):
                match = llm_rows[i]

            clean_rows.append({
                "id": def_row["id"],
                "name": str(match.get("name") or def_row["name"]),
                "desc": str(match.get("desc") or ""),
                "size": str(match.get("size") or ""),
                "growth": str(match.get("growth") or ""),
                "spend": str(match.get("spend") or ""),
                "priorities": str(match.get("priorities") or ""),
                "presence": str(match.get("presence") or ""),
                "incumbent": str(match.get("incumbent") or "")
            })
        clean_data["rows"] = clean_rows

        # 2. Normalize Geo Revenue
        llm_geo_rev = raw_data.get("geoRevenue") or []
        clean_geo_rev = []
        for i, def_row in enumerate(DEFAULTS["geoRevenue"]):
            match = llm_geo_rev[i] if i < len(
                llm_geo_rev) and isinstance(llm_geo_rev[i], dict) else {}
            clean_geo_rev.append({
                "l": def_row["l"],
                "v": str(match.get("v") or ""),
                "h": def_row["h"]
            })
        clean_data["geoRevenue"] = clean_geo_rev

        # 3. Normalize Geo Talent
        llm_geo_tal = raw_data.get("geoTalent") or []
        clean_geo_tal = []
        for i, def_row in enumerate(DEFAULTS["geoTalent"]):
            match = llm_geo_tal[i] if i < len(
                llm_geo_tal) and isinstance(llm_geo_tal[i], dict) else {}
            clean_geo_tal.append({
                "geo": def_row["geo"],
                "val": str(match.get("val") or "")
            })
        clean_data["geoTalent"] = clean_geo_tal

        # 4. Normalize Geo Priorities
        llm_geo_prio = raw_data.get("geoPriorities") or []
        clean_geo_prio = []
        for i, def_row in enumerate(DEFAULTS["geoPriorities"]):
            match = llm_geo_prio[i] if i < len(
                llm_geo_prio) and isinstance(llm_geo_prio[i], dict) else {}
            clean_geo_prio.append({
                "geo": def_row["geo"],
                "val": str(match.get("val") or "")
            })
        clean_data["geoPriorities"] = clean_geo_prio

        return {
            "template_type": "tech_spend_view",
            "data": clean_data
        }

    # =========================================================
    # OPERATIONAL EXCELLENCE STRATEGY
    # =========================================================
    if template_type == "operational_excellence_strategy":
        schema = get_template_schema("operational_excellence_strategy")

        filled = fill_template_json_only(
            template=schema,
            context_text=context_text
        )

        safe = _normalize_operational_excellence_payload(filled)

        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="operational_excellence_strategy",
            payload=safe
        )

        message = "Profile updated"

        if chat:
            save_message(chat, "bot", message)

        return JsonResponse({"message": message, "payload": safe})




    
    if template_type == "operational_implementation_plan":
        schema = get_template_schema("operational_implementation_plan")
        filled = fill_template_json_only(template=schema, context_text=context_text)
        
        # Use the robust normalizer
        safe = _normalize_operational_implementation_plan(filled)
        
        # Save to DB
        _save_payload(
            user_id=user_id, 
            company_name=company_name, 
            template_type="operational_implementation_plan", 
            payload=safe
        )
        return JsonResponse({"message": "Operational Implementation Plan generated.", "payload": safe}, json_dumps_params={"ensure_ascii": False})

    if template_type == "relationship_heatmap":
        schema = get_template_schema("relationship_heatmap")

        filled = fill_template_json_only(
            template=schema, context_text=context_text
        )
        safe = enforce_tbd(schema, filled)

        safe = _normalize_relationship_heatmap_payload(safe)

        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="relationship_heatmap",
            payload=safe
        )

        message = "Profile updated"

        if chat:
            save_message(chat, "bot", message)

        return JsonResponse({"message": message, "payload": safe, "template_type": "relationship_heatmap"})




    if template_type == "talent_excellence_overview":
        schema = get_template_schema("talent_excellence_overview")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)
        safe = _normalize_talent_excellence_payload(filled)

        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="talent_excellence_overview",
            payload=safe
        )

        return JsonResponse(
            {"message": "Talent Excellence Overview generated.", "payload": safe},
            json_dumps_params={"ensure_ascii": False}
        )

        # =========================================================
    # Growth Strategy
    # =========================================================
    if template_type == "growth_strategy":
        schema = get_template_schema("growth_strategy")

        filled = fill_template_json_only(
            template=schema, context_text=context_text)
        safe = enforce_tbd(schema, filled)

        safe = _normalize_growth_strategy_payload(safe)

        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="growth_strategy",
            payload=safe
        )

        message = "Profile updated"

        if chat:
            save_message(chat, "bot", message)

        return JsonResponse({"message": message, "payload": safe, "template_type": "growth_strategy"})



    
    if template_type == "implementation_plan":
        schema = get_template_schema("implementation_plan")
        # 1. Generate
        filled = fill_template_json_only(template=schema, context_text=context_text)
        # 2. Normalize
        safe = _normalize_implementation_plan_payload(filled)
        # 3. Save
        _save_payload(
            user_id=user_id, 
            company_name=company_name, 
            template_type="implementation_plan", 
            payload=safe
        )
        return JsonResponse({"message": "Implementation Plan generated.", "payload": safe, "template_type": "implementation_plan"}, json_dumps_params={"ensure_ascii": False})

    if template_type == "innovation_strategy":
        schema = get_template_schema("innovation_strategy")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)

        # Normalize
        safe = _normalize_innovation_strategy_payload(filled)

        # Save
        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="innovation_strategy",
            payload=safe
        )
        return JsonResponse({"message": "Innovation Strategy updated.", "payload": safe}, json_dumps_params={"ensure_ascii": False})

    if template_type == "customer_profile":
        schema = get_template_schema("customer_profile")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)
        safe = _normalize_customer_profile_payload(filled)

        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="customer_profile",
            payload=safe
        )

        message = "Profile updated"

        if chat:
            save_message(chat, "bot", message)

        return JsonResponse({"message": message, "payload": safe, "template_type": "customer_profile"})


    if template_type == "investment_plan":
        schema = get_template_schema("investment_plan")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)

        # Normalize
        safe = _normalize_investment_plan_payload(filled)

        # Save
        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="investment_plan",
            payload=safe
        )
        return JsonResponse({"message": "Investment Plan generated.", "payload": safe}, json_dumps_params={"ensure_ascii": False})

    if template_type == "tech_spend_view":
        schema = get_template_schema("tech_spend_view")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)

        # Normalize
        safe = _normalize_tech_spend_payload(filled)

        # Save
        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="tech_spend_view",
            payload=safe
        )
        return JsonResponse({"message": "Tech Spend View generated.", "payload": safe}, json_dumps_params={"ensure_ascii": False})

    if template_type == "service_line_growth_actions":
        schema = get_template_schema("service_line_growth_actions")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)

        safe = _normalize_service_line_growth_payload(filled)

        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="service_line_growth_actions",
            payload=safe
        )

        message = "Profile updated"

        if chat:
            save_message(chat, "bot", message)

        return JsonResponse({"message": message, "payload": safe})







    if template_type == "account_performance_annual_plan":
        schema = get_template_schema("account_performance_annual_plan")
        filled = fill_template_json_only(
            template=schema, context_text=context_text)

        # Normalize
        safe = _normalize_account_performance_payload(filled)

        # Save
        _save_payload(
            user_id=user_id,
            company_name=company_name,
            template_type="account_performance_annual_plan",
            payload=safe
        )
        return JsonResponse({"message": "Annual Plan generated.", "payload": safe}, json_dumps_params={"ensure_ascii": False})

    # Normal Q&A
            # Normal Q&A (SAFE VERSION)

    # 🔒 Check if Azure is configured
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

    if not azure_endpoint:
        print("⚠️ Azure OpenAI not configured. Using fallback response.")

        answer = (
            "⚠️ AI service not configured.\n\n"
            "Showing available context instead:\n\n"
            + context_text[:1000]
        )

    else:
        try:
            answer = answer_only_from_context(
                query=question,
                context_text=context_text
            )
        except Exception as e:
            print("❌ AI ERROR:", e)

            answer = (
                "⚠️ AI failed. Showing fallback response.\n\n"
                + context_text[:1000]
            )

    
        # ✅ Save BOT message
        if chat:
            save_message(chat, "bot", answer or "TBD")

        return JsonResponse(
            {"message": answer or "TBD", "payload": None},
            json_dumps_params={"ensure_ascii": False}
        )




# ----------------------------
# Template fill endpoint
# ----------------------------
@csrf_exempt
def fill_template(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = _get_user_id(request, body)

    template_name = str(body.get("template_name")
                        or confirmed_template_type or "").strip().lower()
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
            parts.append("ACCOUNT_PLAN_VIEW:\n" +
                         json.dumps(ap_filtered, ensure_ascii=False))

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
                parts.append(f"{key.upper()} (sample):\n" +
                             json.dumps(rows[:20], ensure_ascii=False))

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
        print(
            f"⚠️ SQL fetch failed, will fallback to Azure Search. Error: {e}")

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

    context_text = "\n\n".join(
        [t for t in [sql_context_text, search_context_text] if t]).strip()

    # =========================================================

    # no context → return TBD-filled skeleton
    if not context_text:
        return JsonResponse(
            enforce_tbd(
                schema, {"template_type": schema["template_type"], "data": {}}),
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
    company = str(body.get("company_name")
                  or body.get("company") or "").strip()

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

    _save_payload(user_id=user_id, company_name=company,
                  template_type=template_type, payload=payload)
    return JsonResponse({"success": True, "payload": payload}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def growth_strategy_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    # Pull latest growth_strategy record for this user
    obj = TemplatePayload.objects.filter(
        user_id=user_id, template_type="growth_strategy").order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, status=200)  # Component handles empty state

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

    saved_obj = _save_payload(user_id=user_id, company_name=company,
                              template_type="growth_strategy", payload=payload)

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
    # Use customer_name for company key
    company = str(body.get("customer_name") or "").strip()

    # Wrap data in the standard payload format
    payload = {
        "template_type": "customer_profile",
        "data": body  # The body is already the dictionary of fields
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
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    user_id = str(request.GET.get("user_id") or "101").strip()

    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="service_line_growth_actions"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})

    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def service_line_growth_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    payload = {
        "template_type": "service_line_growth_actions",
        "data": body  # Frontend sends the object directly
    }

    _save_payload(user_id=user_id, company_name=company,
                  template_type="service_line_growth_actions", payload=payload)

    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})


# 2. ADD THE GET ENDPOINT (At the bottom of the file)
# ---------------------------------------------------------
@csrf_exempt
def operational_excellence_get(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    user_id = str(request.GET.get("user_id") or "101").strip()

    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="operational_excellence_strategy"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})

    # Return the 'data' block directly to the frontend
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})


# 3. ADD THE SAVE ENDPOINT (At the bottom of the file)
# ---------------------------------------------------------
@csrf_exempt
def operational_excellence_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    # Wrap the frontend data into the standard payload structure
    payload = {
        "template_type": "operational_excellence_strategy",
        "data": body  # Frontend sends the data object directly
    }

    _save_payload(user_id=user_id, company_name=company,
                  template_type="operational_excellence_strategy", payload=payload)

    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def account_performance_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="account_performance_annual_plan"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def account_performance_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    payload = {
        "template_type": "account_performance_annual_plan",
        "data": body
    }

    _save_payload(user_id=user_id, company_name=company,
                  template_type="account_performance_annual_plan", payload=payload)
    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def tech_spend_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="tech_spend_view"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def tech_spend_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    payload = {
        "template_type": "tech_spend_view",
        "data": body
    }

    _save_payload(user_id=user_id, company_name=company,
                  template_type="tech_spend_view", payload=payload)
    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def innovation_strategy_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="innovation_strategy"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def innovation_strategy_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    # Frontend sends { "1": "text", "2": "text"... } directly
    payload = {
        "template_type": "innovation_strategy",
        "data": body
    }

    _save_payload(user_id=user_id, company_name=company,
                  template_type="innovation_strategy", payload=payload)
    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def investment_plan_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="investment_plan"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})

    # Frontend expects the 'data' block which contains { "data": [...], "totalValue": ... }
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def investment_plan_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    # The frontend sends the entire object structure directly
    # We wrap it in template_type for consistency
    payload = {
        "template_type": "investment_plan",
        "data": body
    }

    _save_payload(user_id=user_id, company_name=company,
                  template_type="investment_plan", payload=payload)
    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def talent_excellence_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()

    obj = TemplatePayload.objects.filter(
        user_id=user_id,
        template_type="talent_excellence_overview"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})

    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def talent_excellence_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    payload = {
        "template_type": "talent_excellence_overview",
        "data": body
    }

    _save_payload(
        user_id=user_id,
        company_name=company,
        template_type="talent_excellence_overview",
        payload=payload
    )

    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def implementation_plan_get(request):
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id, 
        template_type="implementation_plan"
    ).order_by('-updated_at').first()
 
    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
    return JsonResponse(obj.payload.get("data", {}), json_dumps_params={"ensure_ascii": False})
 
@csrf_exempt
def implementation_plan_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
 
    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()
 
    # Frontend sends { "actions": [...] }
    payload = {
        "template_type": "implementation_plan",
        "data": body 
    }
 
    _save_payload(user_id=user_id, company_name=company, template_type="implementation_plan", payload=payload)
    return JsonResponse({"success": True, "data": body}, json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def operational_implementation_plan_get(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)
    
    user_id = str(request.GET.get("user_id") or "101").strip()
    obj = TemplatePayload.objects.filter(
        user_id=user_id, 
        template_type="operational_implementation_plan"
    ).order_by('-updated_at').first()

    if not obj:
        return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
    
    # Return the whole payload (includes plan_date and data array)
    return JsonResponse(obj.payload, json_dumps_params={"ensure_ascii": False})

@csrf_exempt
def operational_implementation_plan_save(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = str(body.get("user_id") or "101").strip()
    company = str(body.get("company_name") or "").strip()

    payload = {
        "template_type": "operational_implementation_plan",
        "plan_date": body.get("plan_date") or "xx",
        "data": body.get("data") or []
    }

    _save_payload(user_id=user_id, company_name=company, template_type="operational_implementation_plan", payload=payload)
    return JsonResponse({"success": True, "payload": payload}, json_dumps_params={"ensure_ascii": False})