# backend/api/views.py

import json
import os
import re
import ast
from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from azure.storage.blob import BlobClient

# Core Service Imports
from .storage import build_upload_path, create_upload_sas
from .search import run_indexer, get_indexer_status, search_chunks
from .aoai import (
    answer_only_from_context, fill_template_json_only, enforce_tbd,
    detect_template_type_from_query
)
from .template_schemas import get_template_schema
from .azure_sql import fetch_fabric_bundle
from .models import TemplatePayload
from .logo_fetcher import fetch_company_logo

# Authentication & Chat Models (From 'auth and cards')
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, ChatSessionSerializer, ChatMessageSerializer
from .models import ChatSession, ChatMessage

# Normalization Service (From 'clean')
from .normalizers import get_normalized_payload, get_humanized_message

# =========================================================
# HELPER FUNCTIONS
# =========================================================

def _env(name: str, default: str = "") -> str: 
    return (os.getenv(name) or default).strip()

def _storage_account() -> str: 
    v = _env("AZURE_STORAGE_ACCOUNT")
    if not v: raise ValueError("Missing AZURE_STORAGE_ACCOUNT")
    return v

def _storage_key() -> str: 
    v = _env("AZURE_STORAGE_KEY")
    if not v: raise ValueError("Missing AZURE_STORAGE_KEY")
    return v

def _container() -> str: 
    return _env("AZURE_STORAGE_CONTAINER", "uploads")

def _json_body(request) -> dict:
    if not request.body: return {}
    try: return json.loads(request.body.decode("utf-8"))
    except Exception: return {}

def _get_user_id(request, data: dict) -> str:
    """
    Robust user ID retrieval: checks payload first, then headers, defaults to 101.
    """
    return str(data.get("user_id") or request.headers.get("X-User-Id") or "101").strip()

def _save_payload(user_id: str, company_name: str, template_type: str, payload: dict) -> TemplatePayload:
    obj, _ = TemplatePayload.objects.update_or_create(
        user_id=str(user_id), 
        company_name=str(company_name or ""), 
        template_type=str(template_type),
        defaults={"payload": payload},
    )
    return obj

@csrf_exempt
def delete_chat(request, chat_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE only"}, status=405)

    try:
        chat = ChatSession.objects.get(id=chat_id)
        chat.delete()
        return JsonResponse({"success": True})
    except ChatSession.DoesNotExist:
        return JsonResponse({"error": "Chat not found"}, status=404)

def save_message(chat, sender, text):
    """Helper to save chat history."""
    if chat:
        ChatMessage.objects.create(chat=chat, sender=sender, text=text)

# =========================================================
# AUTHENTICATION ENDPOINTS
# =========================================================

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

    data = _json_body(request)

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

# =========================================================
# CHAT SESSION MANAGEMENT
# =========================================================

@csrf_exempt
def create_chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _json_body(request)
    user_id = data.get("user_id")

    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        # Fallback for dev/testing if user doesn't exist in DB but ID is passed
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

# =========================================================
# FILE UPLOAD & INGEST
# =========================================================

@csrf_exempt
def upload_request(request):
    """Step 1: Get SAS URL for upload."""
    if request.method != "POST": return JsonResponse({"error": "POST only"}, status=405)
    
    data = _json_body(request)
    user_id, filename = _get_user_id(request, data), str(data.get("filename") or "").strip()
    
    if not user_id or not filename: 
        return JsonResponse({"error": "user_id and filename required"}, status=400)
    
    blob_path = build_upload_path(user_id=user_id, filename=filename)
    upload_url, blob_url = create_upload_sas(_storage_account(), _storage_key(), _container(), blob_path, 30)
    
    return JsonResponse({"upload_url": upload_url, "blob_url": blob_url, "blob_path": blob_path})

@csrf_exempt
def upload_complete(request):
    """Step 2: Verify upload and set metadata."""
    if request.method != "POST": return JsonResponse({"error": "POST only"}, status=405)
    
    data = _json_body(request)
    user_id = _get_user_id(request, data)
    filename, blob_path = str(data.get("filename") or "").strip(), str(data.get("blob_path") or "").strip()
    
    bc = BlobClient(
        account_url=f"https://{_storage_account()}.blob.core.windows.net", 
        container_name=_container(), 
        blob_name=blob_path, 
        credential=_storage_key()
    )
    props = bc.get_blob_properties()
    md = dict(props.metadata or {})
    md.update({"user_id": user_id, "filename": filename, "uploaded_at": datetime.now(timezone.utc).isoformat()})
    bc.set_blob_metadata(metadata=md)
    
    return JsonResponse({"blob_path": blob_path, "metadata": md})

@csrf_exempt
def ingest_file(request):
    if request.method != "POST": return JsonResponse({"error": "POST only"}, status=405)
    data = _json_body(request)
    result = run_indexer(wait_seconds=int(data.get("wait_seconds") or 0))
    return JsonResponse({"triggered": True, "result": result})

@csrf_exempt
def ingest_status(request):
    return JsonResponse(get_indexer_status())

# =========================================================
# AI CHATBOT (Unified Logic)
# =========================================================

# In backend/api/views.py

@csrf_exempt
def chat(request):
    """
    Unified chat endpoint.
    1. Fetches Context (Fabric + Azure Search).
    2. Detects Intent (Template vs Q&A).
    3. Normalizes Data (using clean branch logic).
    4. Saves History (using auth branch logic).
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    body = _json_body(request)
    user_id = _get_user_id(request, body)
    chat_id = body.get("chat_id")
    
    raw_query = str(body.get("query") or body.get("prompt") or "").strip()
    top_k = int(body.get("top_k") or int(os.getenv("AZURE_SEARCH_FALLBACK_TOPK", "12")))

    if not user_id: return JsonResponse({"error": "user_id required"}, status=400)
    if not raw_query: return JsonResponse({"error": "query required"}, status=400)

    print(f"\n💬 [Chat] Incoming Query: '{raw_query}'")

    # --- Chat Session Handling ---
    chat_session = None
    if chat_id:
        try:
            chat_session = ChatSession.objects.get(id=chat_id)
            save_message(chat_session, "user", raw_query)
            
            # Update title if it's the first message
            if chat_session.title == "New Chat":
                chat_session.title = raw_query[:50]
                chat_session.save()
        except ChatSession.DoesNotExist:
            pass 

    # --- Query Parsing ---
    # --- Query Parsing (Improved) ---
    company_name = str(body.get("company_name") or body.get("account_name") or "").strip()
    question = raw_query

    # If company_name wasn't sent explicitly in the JSON body, try to find it in the text
    if not company_name:
        # 1. Try Regex for Company="Name" (Handles both single ' and double " quotes)
        if m := re.search(r'Company\s*=\s*["\']([^"\']+)["\']', raw_query, re.IGNORECASE):
            company_name = m.group(1).strip()
            # Remove the company declaration from the question to clean it up
            question = raw_query.replace(m.group(0), "").strip()

        # 2. Fallback: Split on Colon (ONLY if it doesn't look like a JSON object)
        elif ":" in raw_query and "{" not in raw_query: 
            left, right = raw_query.split(":", 1)
            # Sanity check: Company names are usually short (< 50 chars)
            if left.strip() and right.strip() and len(left) < 50: 
                company_name, question = left.strip(), right.strip()

    print(f"🔍 [Chat] Extracted Company: '{company_name}'")

    if not company_name:
        if m := re.search(r'Company\s*=\s*"([^"]+)"', raw_query, re.IGNORECASE): company_name = m.group(1).strip()
        if m2 := re.search(r'Question\s*=\s*"([^"]+)"', raw_query, re.IGNORECASE): question = m2.group(1).strip()
        elif "|" in raw_query: question = raw_query.split("|", 1)[1].strip()
        elif ":" in raw_query: 
            left, right = raw_query.split(":", 1)
            if left.strip() and right.strip(): company_name, question = left.strip(), right.strip()
    
    print(f"🔍 [Chat] Extracted Company: '{company_name}' | Question: '{question}'")

    # --- Context Retrieval ---
    fabric_text, fabric_ok = "", False
    if company_name:
        try:
            print("🚀 [Chat] Attempting Fabric Fetch...")
            bundle = fetch_fabric_bundle(company_name, top_n=50)
            parts = []
            if ap := bundle.get("account_plan"): parts.append("FABRIC_ACCOUNT_PLAN:\n" + json.dumps(ap, ensure_ascii=False, default=str))
            for k in ["targets", "tcv_crm", "revenue_kantata", "forecast", "csat", "unified_metrics", "revenue_employee_margin"]:
                if rows := bundle.get(k): parts.append(f"FABRIC_{k.upper()}:\n" + json.dumps(rows[:30], ensure_ascii=False, default=str))
            fabric_text = "\n\n".join(parts).strip()
            
            if fabric_text:
                fabric_ok = True
                print(f"✅ [Chat] Fabric Data Retrieved. Length: {len(fabric_text)} chars")
            else:
                print("⚠️ [Chat] Fabric returned empty text (Account not found or no data).")
                
        except Exception as e: 
            print(f"⚠️ [Chat] Fabric Fetch Failed: {e}")

    search_text = ""
    if not fabric_ok:
        print("🔎 [Chat] Falling back to Azure Search...")
        chunks = search_chunks(user_id=user_id, query=raw_query, top_k=top_k)
        search_text = "\n".join(c.get("chunk_text", "").strip() for c in chunks if c.get("chunk_text", "").strip())
        print(f"✅ [Chat] Search Retrieved {len(chunks)} chunks.")

    context_text = "\n\n".join([t for t in [fabric_text, search_text] if t]).strip()
    
    if not context_text:
        msg = "No relevant data found."
        print("❌ [Chat] No context found from Fabric or Search. Returning default.")
        if chat_session: save_message(chat_session, "bot", msg)
        return JsonResponse({"message": msg, "payload": None}, json_dumps_params={"ensure_ascii": False})

    # --- Template Logic ---
    template_type = detect_template_type_from_query(question)
    print(f"📋 [Chat] Detected Template Type: {template_type}")

    if template_type and template_type != "unknown":
        schema = get_template_schema(template_type)
        filled = fill_template_json_only(template=schema, context_text=context_text)
        
        # Normalize
        filled = enforce_tbd(schema, filled)
        safe_payload = get_normalized_payload(template_type, filled)
        
        _save_payload(user_id=user_id, company_name=company_name, template_type=template_type, payload=safe_payload)
        
        message = get_humanized_message(template_type, safe_payload)
        
        if chat_session: save_message(chat_session, "bot", message)
        
        return JsonResponse({"message": message, "payload": safe_payload, "template_type": template_type}, json_dumps_params={"ensure_ascii": False})

    # --- Q&A Fallback ---
    print("🤖 [Chat] Generative Q&A...")
    answer = answer_only_from_context(query=question, context_text=context_text) or "TBD"
    
    if chat_session: save_message(chat_session, "bot", answer)
    
    return JsonResponse({"message": answer, "payload": None}, json_dumps_params={"ensure_ascii": False})


@csrf_exempt
def fill_template(request):
    body = _json_body(request)
    template_name = str(body.get("template_name") or "").strip().lower()
    company_name = str(body.get("company_name") or "").strip()

    try: schema = get_template_schema(template_name)
    except Exception as e: return JsonResponse({"error": str(e)}, status=400)

    # Simplified Context Fetching for Filling
    bundle = fetch_fabric_bundle(company_name)
    parts = []
    if ap := bundle.get("account_plan"): parts.append("ACCOUNT_PLAN_VIEW:\n" + json.dumps(ap, ensure_ascii=False))
    for k in ["unified_metrics", "csat", "forecast", "revenue_employee_margin", "revenue_kantata", "tcv_crm", "targets"]:
        if rows := bundle.get(k): parts.append(f"{k.upper()}:\n" + json.dumps(rows[:20], ensure_ascii=False))
    
    context_text = "\n\n".join(parts).strip()
    if not context_text:
        # Return empty skeleton
        return JsonResponse(enforce_tbd(schema, {"template_type": schema["template_type"], "data": {}}), json_dumps_params={"ensure_ascii": False})

    filled = fill_template_json_only(template=schema, context_text=context_text)
    
    # Special case for Service_Line_Penetration merging
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
# DYNAMIC TEMPLATE VIEW (Replaces specific views)
# =========================================================

@csrf_exempt
def template_payload_detail(request, template_type):
    """
    Unified endpoint for all template GET/POST operations.
    Standardizes data input/output based on template_type.
    """
    if request.method == "GET":
        user_id = str(request.GET.get("user_id") or "101").strip()
        obj = TemplatePayload.objects.filter(user_id=user_id, template_type=template_type).order_by('-updated_at').first()
        if not obj:
            return JsonResponse({}, json_dumps_params={"ensure_ascii": False})
        
        # Special handling for heatmap array depth
        data = obj.payload.get("data", {})
        if template_type == "relationship_heatmap" and "stakeholder_list" in data:
            return JsonResponse({"data": data["stakeholder_list"]}, json_dumps_params={"ensure_ascii": False})
            
        return JsonResponse(data, json_dumps_params={"ensure_ascii": False})

    elif request.method == "POST":
        body = _json_body(request)
        user_id = str(body.get("user_id") or "101").strip()
        company = str(body.get("company_name") or body.get("company") or body.get("customer_name") or "").strip()

        # Normalize Payload Structure
        data_block = body.get("data") if "data" in body else body
        if template_type == "relationship_heatmap" and isinstance(data_block, list):
            data_block = {"stakeholder_list": data_block}

        payload = {"template_type": template_type, "data": data_block}
        
        _save_payload(user_id=user_id, company_name=company, template_type=template_type, payload=payload)
        
        return JsonResponse({"success": True, "data": data_block, "payload": payload}, json_dumps_params={"ensure_ascii": False})

    return JsonResponse({"error": "Method not allowed"}, status=405)