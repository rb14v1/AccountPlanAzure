# backend/api/views.py

import json
import os
import re
from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from azure.storage.blob import BlobClient

from .storage import build_upload_path, create_upload_sas
from .search import run_indexer, get_indexer_status, search_chunks
from .aoai import (
    answer_only_from_context, fill_template_json_only, enforce_tbd,
    detect_template_type_from_query
)
from .template_schemas import get_template_schema
from .azure_sql import fetch_fabric_bundle
from .models import TemplatePayload

# Import our new normalizer service
from .normalizers import get_normalized_payload, get_humanized_message

def _env(name: str, default: str = "") -> str: return (os.getenv(name) or default).strip()
def _storage_account() -> str: 
    v = _env("AZURE_STORAGE_ACCOUNT")
    if not v: raise ValueError("Missing AZURE_STORAGE_ACCOUNT")
    return v

def _storage_key() -> str: 
    v = _env("AZURE_STORAGE_KEY")
    if not v: raise ValueError("Missing AZURE_STORAGE_KEY")
    return v
def _container() -> str: return _env("AZURE_STORAGE_CONTAINER", "uploads")

def _json_body(request) -> dict:
    if not request.body: return {}
    try: return json.loads(request.body.decode("utf-8"))
    except Exception: return {}

def _get_user_id(request, data: dict) -> str:
    return str(data.get("user_id") or request.headers.get("X-User-Id") or "101").strip()

def _save_payload(user_id: str, company_name: str, template_type: str, payload: dict) -> TemplatePayload:
    obj, _ = TemplatePayload.objects.update_or_create(
        user_id=str(user_id), company_name=str(company_name or ""), template_type=str(template_type),
        defaults={"payload": payload},
    )
    return obj

# =========================================================
# FILE UPLOAD & INGEST (Unchanged logic, kept DRY)
# =========================================================
@csrf_exempt
def upload_request(request):
    data = _json_body(request)
    user_id, filename = _get_user_id(request, data), str(data.get("filename") or "").strip()
    if not user_id or not filename: return JsonResponse({"error": "user_id and filename required"}, status=400)
    blob_path = build_upload_path(user_id=user_id, filename=filename)
    upload_url, blob_url = create_upload_sas(_storage_account(), _storage_key(), _container(), blob_path, 30)
    return JsonResponse({"upload_url": upload_url, "blob_url": blob_url, "blob_path": blob_path})

@csrf_exempt
def upload_complete(request):
    data = _json_body(request)
    user_id, filename, blob_path = _get_user_id(request, data), str(data.get("filename") or "").strip(), str(data.get("blob_path") or "").strip()
    bc = BlobClient(account_url=f"https://{_storage_account()}.blob.core.windows.net", container_name=_container(), blob_name=blob_path, credential=_storage_key())
    props = bc.get_blob_properties()
    md = dict(props.metadata or {})
    md.update({"user_id": user_id, "filename": filename, "uploaded_at": datetime.now(timezone.utc).isoformat()})
    bc.set_blob_metadata(metadata=md)
    return JsonResponse({"blob_path": blob_path, "metadata": md})

@csrf_exempt
def ingest_file(request):
    data = _json_body(request)
    result = run_indexer(wait_seconds=int(data.get("wait_seconds") or 0))
    return JsonResponse({"triggered": True, "result": result})

@csrf_exempt
def ingest_status(request):
    return JsonResponse(get_indexer_status())

# =========================================================
# AI CHATBOT (DRY, Dynamic Template Generation)
# =========================================================
@csrf_exempt
def chat(request):
    body = _json_body(request)
    user_id = _get_user_id(request, body)
    raw_query = str(body.get("query") or body.get("prompt") or "").strip()
    top_k = int(body.get("top_k") or int(os.getenv("AZURE_SEARCH_FALLBACK_TOPK", "12")))

    company_name, question = str(body.get("company_name") or body.get("account_name") or "").strip(), raw_query

    # Query extraction logic
    if not company_name:
        if m := re.search(r'Company\s*=\s*"([^"]+)"', raw_query, re.IGNORECASE): company_name = m.group(1).strip()
        if m2 := re.search(r'Question\s*=\s*"([^"]+)"', raw_query, re.IGNORECASE): question = m2.group(1).strip()
        elif "|" in raw_query: question = raw_query.split("|", 1)[1].strip()
        elif ":" in raw_query: 
            left, right = raw_query.split(":", 1)
            if left.strip() and right.strip(): company_name, question = left.strip(), right.strip()

    # Context Fetching (Fabric + Azure Search)
    fabric_text, fabric_ok = "", False
    if company_name:
        try:
            bundle = fetch_fabric_bundle(company_name, top_n=50)
            parts = []
            if ap := bundle.get("account_plan"): parts.append("FABRIC_ACCOUNT_PLAN:\n" + json.dumps(ap, ensure_ascii=False, default=str))
            for k in ["targets", "tcv_crm", "revenue_kantata", "forecast", "csat", "unified_metrics", "revenue_employee_margin"]:
                if rows := bundle.get(k): parts.append(f"FABRIC_{k.upper()}:\n" + json.dumps(rows[:30], ensure_ascii=False, default=str))
            fabric_text = "\n\n".join(parts).strip()
            fabric_ok = len(fabric_text) >= int(os.getenv("SQL_FIRST_MIN_CHARS", "800"))
        except Exception as e: print(f"⚠️ Fabric fetch failed: {e}")

    search_text = ""
    if not fabric_ok:
        chunks = search_chunks(user_id=user_id, query=raw_query, top_k=top_k)
        search_text = "\n".join(c.get("chunk_text", "").strip() for c in chunks if c.get("chunk_text", "").strip())

    context_text = "\n\n".join([t for t in [fabric_text, search_text] if t]).strip()
    if not context_text:
        return JsonResponse({"message": "TBD - No relevant information found in Fabric or uploaded documents.", "payload": None})

    # DYNAMIC TEMPLATE DETECTION & FILLING
    template_type = detect_template_type_from_query(question)

    if template_type and template_type != "unknown":
        schema = get_template_schema(template_type)
        filled = fill_template_json_only(template=schema, context_text=context_text)
        
        # Ensure fallback TBD values, then normalize the data dynamically
        filled = enforce_tbd(schema, filled)
        safe_payload = get_normalized_payload(template_type, filled)
        
        _save_payload(user_id=user_id, company_name=company_name, template_type=template_type, payload=safe_payload)
        
        message = get_humanized_message(template_type, safe_payload)
        return JsonResponse({"message": message, "payload": safe_payload}, json_dumps_params={"ensure_ascii": False})

    # Normal Q&A Fallback
    answer = answer_only_from_context(query=question, context_text=context_text)
    return JsonResponse({"message": answer or "TBD", "payload": None}, json_dumps_params={"ensure_ascii": False})

# =========================================================
# FILL TEMPLATE ENDPOINT
# =========================================================
@csrf_exempt
def fill_template(request):
    body = _json_body(request)
    user_id = _get_user_id(request, body)
    template_name = str(body.get("template_name") or "").strip().lower()
    company_name = str(body.get("company_name") or "").strip()

    try: schema = get_template_schema(template_name)
    except Exception as e: return JsonResponse({"error": str(e)}, status=400)

    # USE THE CORRECT FABRIC BUNDLE FUNCTION
    bundle = fetch_fabric_bundle(company_name)
    parts = []
    if ap := bundle.get("account_plan"): parts.append("ACCOUNT_PLAN_VIEW:\n" + json.dumps(ap, ensure_ascii=False))
    for k in ["unified_metrics", "csat", "forecast", "revenue_employee_margin", "revenue_kantata", "tcv_crm", "targets"]:
        if rows := bundle.get(k): parts.append(f"{k.upper()}:\n" + json.dumps(rows[:20], ensure_ascii=False))
    
    sql_text = "\n\n".join(parts).strip()
    context_text = sql_text if len(sql_text) > 800 else "" # Simplified for brevity

    if not context_text:
        return JsonResponse(enforce_tbd(schema, {"template_type": schema["template_type"], "data": {}}), json_dumps_params={"ensure_ascii": False})

    filled = fill_template_json_only(template=schema, context_text=context_text)
    
    # Custom merge for Service_Line_Penetration
    if schema.get("template_type") == "Service_Line_Penetration":
        filled["template_type"] = "Service_Line_Penetration"
        base_rows = {r["id"]: r for r in schema["data"].get("tableRows", [])}
        out = filled.get("data", {})
        got_rows = out.get("tableRows", [])
        patch_map = {str(r.get("id")): r for r in got_rows if isinstance(r, dict)} if isinstance(got_rows, list) else got_rows
        out["tableRows"] = [{**row, **(patch_map.get(str(_id)) or {})} for _id, row in base_rows.items()]
        filled["data"] = out

    safe = enforce_tbd(schema, filled)
    return JsonResponse(safe, json_dumps_params={"ensure_ascii": False})

# =========================================================
# ONE DYNAMIC ENDPOINT FOR ALL TEMPLATE GET/POST REQUESTS
# =========================================================
@csrf_exempt
def template_payload_detail(request, template_type):
    """
    Replaces 25+ individual GET/POST template views.
    Automatically handles data standardizing based on the template_type keyword argument.
    """
    if request.method == "GET":
        user_id = str(request.GET.get("user_id") or "101").strip()
        obj = TemplatePayload.objects.filter(user_id=user_id, template_type=template_type).order_by('-updated_at').first()
        if not obj:
            return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
        
        # Check if the specific template needs to return a deeper array (like relationship heatmap)
        data = obj.payload.get("data", {})
        if template_type == "relationship_heatmap" and "stakeholder_list" in data:
            return JsonResponse({"data": data["stakeholder_list"]}, json_dumps_params={"ensure_ascii": False})
            
        return JsonResponse(data, json_dumps_params={"ensure_ascii": False})

    elif request.method == "POST":
        body = _json_body(request)
        user_id = str(body.get("user_id") or "101").strip()
        company = str(body.get("company_name") or body.get("company") or body.get("customer_name") or "").strip()

        # Clean payload structure depending on what the frontend sent
        data_block = body.get("data") if "data" in body else body
        if template_type == "relationship_heatmap" and isinstance(data_block, list):
            data_block = {"stakeholder_list": data_block}

        payload = {"template_type": template_type, "data": data_block}
        
        _save_payload(user_id=user_id, company_name=company, template_type=template_type, payload=payload)
        
        return JsonResponse({"success": True, "data": data_block, "payload": payload}, json_dumps_params={"ensure_ascii": False})

    return JsonResponse({"error": "Method not allowed"}, status=405)