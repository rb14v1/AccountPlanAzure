# backend/api/views.py

import json
import os
from datetime import datetime, timezone
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from azure.storage.blob import BlobClient

from .storage import build_upload_path, create_upload_sas
from .search import run_indexer, get_indexer_status, search_chunks
from .aoai import answer_only_from_context, fill_template_json_only, enforce_tbd, parse_yaml_like_text_to_json, detect_template_type_from_query
from .template_schemas import get_template_schema

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction

from .models import (
    StrategicPartnership,
    CustomerProfile,
    GrowthStrategy,
    AccountTeamPOD,
    ServiceLineGrowth,
    InvestmentPlan,
    OperationalExcellence,
    RelationshipHeatmap,
    CriticalRisk,
)

from .serializers import (
    StrategicPartnershipSerializer,
    CustomerProfileSerializer,
    GrowthStrategySerializer,
    AccountTeamPODSerializer,
    ServiceLineGrowthSerializer,
    InvestmentPlanSerializer,
    OperationalExcellenceSerializer,
    RelationshipHeatmapSerializer,
    CriticalRiskSerializer,
)
from .azure_sql import fetch_fabric_bundle
from django.http import JsonResponse, HttpResponse
import json


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
    
    print("INGEST trigger", {"user_id": user_id, "filename": filename, "blob_path": blob_path or "(batch)"})
    
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
            "Account_Name", "Account_Sector", "Account_Vertical", "Account_Type",
            "Pain_Points", "Strengths", "Weakness", "Threats",
            "Opportunities", "Cross_Sell_Opportunities", "Products_Or_Services",
            "Key_Business_IT_Priorities", "IT_Road_Map", "Business_Metrics",
            "History_With_Version_1", "Priority_For_Growing_Account",
            "Account_Manager", "Account_Director", "Delivery_Lead"
        ]
        ap_filtered = {k: ap.get(k) for k in keep if ap.get(k) not in (None, "", [], {})}
        parts.append("SQL_ACCOUNT_PLAN_VIEW:\n" + json.dumps(ap_filtered, ensure_ascii=False))

    for key in ["unified_metrics", "csat", "forecast", "revenue_employee_margin",
                "revenue_kantata", "tcv_crm", "targets"]:
        rows = bundle.get(key) or []
        if rows:
            parts.append(f"SQL_{key.upper()} (sample):\n" + json.dumps(rows[:20], ensure_ascii=False))

    return "\n\n".join(parts).strip()


def _sql_is_sufficient(bundle: dict, sql_text: str) -> bool:
    min_chars = int(os.getenv("SQL_FIRST_MIN_CHARS", "800"))
    min_tables = int(os.getenv("SQL_FIRST_MIN_TABLES", "2"))

    tables_with_data = sum(
        1 for k in ["unified_metrics", "csat", "forecast", "revenue_employee_margin",
                    "revenue_kantata", "tcv_crm", "targets"]
        if (bundle.get(k) or [])
    )

    # Pass if: enough text AND (account_plan exists OR enough tables have rows)
    return (len(sql_text) >= min_chars) and (bundle.get("account_plan") or tables_with_data >= min_tables)
#################################################################################


# ----------------------------
# RAG Chat endpoint
# ----------------------------
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
    # Supported formats:
    #   "NatWest: what is the revenue trend?"
    #   "NatWest - what is the revenue trend?"
    # Or frontend can send company_name explicitly.
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

        for k in ["targets", "tcv_crm", "revenue_kantata", "forecast", "csat", "unified_metrics", "revenue_employee_margin"]:
            rows = bundle.get(k) or []
            if rows:
                parts.append(f"FABRIC_{k.upper()} (top 30):\n" + json.dumps(rows[:30], ensure_ascii=False, default=str))

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
        return HttpResponse("TBD - No relevant information found in Fabric or uploaded documents.", content_type="text/plain")

    answer = answer_only_from_context(query=question, context_text=context_text)
    return HttpResponse(answer or "TBD", content_type="text/plain")



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
    company_name  = str(body.get("company_name") or "").strip()

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
                "Account_Name", "Account_Sector", "Account_Vertical", "Account_Type",
                "Pain_Points", "Strengths", "Weakness", "Threats",
                "Opportunities", "Cross_Sell_Opportunities", "Products_Or_Services",
                "Key_Business_IT_Priorities", "IT_Road_Map", "Business_Metrics",
                "History_With_Version_1", "Priority_For_Growing_Account",
            ]
            ap_filtered = {
                k: ap.get(k)
                for k in keep
                if k in ap and ap.get(k) not in (None, "")
            }
            parts.append(
                "ACCOUNT_PLAN_VIEW:\n"
                + json.dumps(ap_filtered, ensure_ascii=False)
            )

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
                parts.append(
                    f"{key.upper()} (sample):\n"
                    + json.dumps(rows[:20], ensure_ascii=False)
                )

        return "\n\n".join(parts).strip()

    min_chars  = int(os.getenv("SQL_FIRST_MIN_CHARS", "800"))
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

    context_text = "\n\n".join(
        [t for t in [sql_context_text, search_context_text] if t]
    ).strip()

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


# ----------------------------
# ViewSets (KEEP AS IS - NO CHANGES)
# ----------------------------

class StrategicPartnershipViewSet(viewsets.ModelViewSet):
    queryset = StrategicPartnership.objects.all()
    serializer_class = StrategicPartnershipSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        partnerships_data = request.data.get('partnerships', request.data)
        if isinstance(partnerships_data, dict):
            partnerships_data = [partnerships_data]
        
        valid_data = [
            p for p in partnerships_data
            if p.get('partner_name') and p.get('partner_name').strip() != ""
        ]
        
        saved_partnerships = []
        with transaction.atomic():
            for partnership_data in valid_data:
                partner_name = partnership_data.get('partner_name')
                partnership_id = partnership_data.get('id')
                
                if partnership_id:
                    try:
                        existing = StrategicPartnership.objects.get(id=partnership_id)
                        serializer = self.get_serializer(existing, data=partnership_data, partial=True)
                    except StrategicPartnership.DoesNotExist:
                        serializer = self.get_serializer(data=partnership_data)
                else:
                    existing = StrategicPartnership.objects.filter(partner_name=partner_name).first()
                    if existing:
                        serializer = self.get_serializer(existing, data=partnership_data, partial=True)
                    else:
                        serializer = self.get_serializer(data=partnership_data)
                
                if serializer.is_valid():
                    partnership = serializer.save()
                    saved_partnerships.append(partnership)
        
        result_serializer = self.get_serializer(saved_partnerships, many=True)
        return Response({
            'success': True,
            'count': len(saved_partnerships),
            'data': result_serializer.data
        }, status=status.HTTP_200_OK)


class CustomerProfileViewSet(viewsets.ModelViewSet):
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        profile = CustomerProfile.objects.first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_profile(self, request):
        profile_data = request.data
        existing_profile = CustomerProfile.objects.first()
        
        if existing_profile:
            serializer = self.get_serializer(existing_profile, data=profile_data, partial=True)
        else:
            serializer = self.get_serializer(data=profile_data)
        
        if serializer.is_valid():
            profile = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class GrowthStrategyViewSet(viewsets.ModelViewSet):
    queryset = GrowthStrategy.objects.all()
    serializer_class = GrowthStrategySerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        strategy = GrowthStrategy.objects.first()
        if strategy:
            serializer = self.get_serializer(strategy)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_strategy(self, request):
        strategy_data = request.data
        existing_strategy = GrowthStrategy.objects.first()
        
        if existing_strategy:
            serializer = self.get_serializer(existing_strategy, data=strategy_data, partial=True)
        else:
            serializer = self.get_serializer(data=strategy_data)
        
        if serializer.is_valid():
            strategy = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AccountTeamPODViewSet(viewsets.ModelViewSet):
    queryset = AccountTeamPOD.objects.all()
    serializer_class = AccountTeamPODSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        pod = AccountTeamPOD.objects.first()
        if pod:
            serializer = self.get_serializer(pod)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_pod(self, request):
        pod_data = request.data
        existing_pod = AccountTeamPOD.objects.first()
        
        if existing_pod:
            serializer = self.get_serializer(existing_pod, data=pod_data, partial=True)
        else:
            serializer = self.get_serializer(data=pod_data)
        
        if serializer.is_valid():
            pod = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ServiceLineGrowthViewSet(viewsets.ModelViewSet):
    queryset = ServiceLineGrowth.objects.all()
    serializer_class = ServiceLineGrowthSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        growth = ServiceLineGrowth.objects.first()
        if growth:
            serializer = self.get_serializer(growth)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_growth(self, request):
        growth_data = request.data
        existing_growth = ServiceLineGrowth.objects.first()
        
        if existing_growth:
            serializer = self.get_serializer(existing_growth, data=growth_data, partial=True)
        else:
            serializer = self.get_serializer(data=growth_data)
        
        if serializer.is_valid():
            growth = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class InvestmentPlanViewSet(viewsets.ModelViewSet):
    queryset = InvestmentPlan.objects.all()
    serializer_class = InvestmentPlanSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        plan = InvestmentPlan.objects.first()
        if plan:
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_plan(self, request):
        plan_data = request.data
        existing_plan = InvestmentPlan.objects.first()
        
        if existing_plan:
            serializer = self.get_serializer(existing_plan, data=plan_data, partial=True)
        else:
            serializer = self.get_serializer(data=plan_data)
        
        if serializer.is_valid():
            plan = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class OperationalExcellenceViewSet(viewsets.ModelViewSet):
    queryset = OperationalExcellence.objects.all()
    serializer_class = OperationalExcellenceSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        strategy = OperationalExcellence.objects.first()
        if strategy:
            serializer = self.get_serializer(strategy)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_strategy(self, request):
        strategy_data = request.data
        existing_strategy = OperationalExcellence.objects.first()
        
        if existing_strategy:
            serializer = self.get_serializer(existing_strategy, data=strategy_data, partial=True)
        else:
            serializer = self.get_serializer(data=strategy_data)
        
        if serializer.is_valid():
            strategy = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class RelationshipHeatmapViewSet(viewsets.ModelViewSet):
    queryset = RelationshipHeatmap.objects.all()
    serializer_class = RelationshipHeatmapSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        heatmap = RelationshipHeatmap.objects.first()
        if heatmap:
            serializer = self.get_serializer(heatmap)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_heatmap(self, request):
        heatmap_data = request.data
        existing_heatmap = RelationshipHeatmap.objects.first()
        
        if existing_heatmap:
            serializer = self.get_serializer(existing_heatmap, data=heatmap_data, partial=True)
        else:
            serializer = self.get_serializer(data=heatmap_data)
        
        if serializer.is_valid():
            heatmap = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class CriticalRiskViewSet(viewsets.ModelViewSet):
    queryset = CriticalRisk.objects.all()
    serializer_class = CriticalRiskSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        risk = CriticalRisk.objects.first()
        if risk:
            serializer = self.get_serializer(risk)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_risks(self, request):
        risk_data = request.data
        existing_risk = CriticalRisk.objects.first()
        
        if existing_risk:
            serializer = self.get_serializer(existing_risk, data=risk_data, partial=True)
        else:
            serializer = self.get_serializer(data=risk_data)
        
        if serializer.is_valid():
            risk = serializer.save()
            return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
