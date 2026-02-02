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


# ----------------------------
# RAG Chat endpoint
# ----------------------------
@csrf_exempt
def chat(request):
    """
    POST /api/chat
    Returns: Plain text for chatbot display
    Side effect: Saves structured JSON to database for templates
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    # Parse request body
    try:
        body = json.loads(request.body.decode('utf-8')) if request.body else {}
    except Exception:
        body = {}
    
    user_id = str(body.get("user_id") or "").strip() or str(request.headers.get("X-User-Id") or "").strip()
    query = str(body.get("query") or body.get("prompt") or "").strip()
    top_k = int(body.get("top_k") or 6)
    
    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    if not query:
        return JsonResponse({"error": "query required"}, status=400)
    
    # Auto-detect template type
    detected_template = detect_template_type_from_query(query)
    print(f"🔍 Query: {query}")
    print(f"📋 Detected Template: {detected_template}")
    
    # Retrieve context
    chunks = search_chunks(user_id=user_id, query=query, top_k=top_k)
    context_text = "\n".join(
        c.get("chunk_text", "").strip()
        for c in chunks if c.get("chunk_text", "").strip()
    ).strip()
    
    if not context_text:
        return HttpResponse("TBD - No relevant information found in uploaded documents.", content_type="text/plain")
    
    # Get plain text answer from LLM
    answer = answer_only_from_context(query=query, context_text=context_text)
    print(f"📝 LLM Answer (first 200 chars):\n{answer[:200]}...")
    
    # If template detected, parse to JSON and SAVE TO DATABASE
    if detected_template:
        try:
            json_response = parse_yaml_like_text_to_json(answer, template_type=detected_template)
            print(f"✅ Parsed to JSON for template: {detected_template}")
            print(f"📊 JSON Data: {json.dumps(json_response, indent=2)[:500]}...")
            
            # ✅ SAVE TO DATABASE BASED ON TEMPLATE TYPE
            if detected_template == "growth_strategy":
                strategy, created = GrowthStrategy.objects.get_or_create(
                    id=1,
                    defaults=json_response['data']
                )
                
                if not created:
                    for key, value in json_response['data'].items():
                        setattr(strategy, key, value)
                    strategy.save()
                
                print(f"💾 Saved Growth Strategy to database (ID: {strategy.id})")
            
            elif detected_template == "customer_profile":
                profile, created = CustomerProfile.objects.get_or_create(
                    id=1,
                    defaults=json_response['data']
                )
                
                if not created:
                    for key, value in json_response['data'].items():
                        setattr(profile, key, value)
                    profile.save()
                
                print(f"💾 Saved Customer Profile to database (ID: {profile.id})")
            
            elif detected_template == "account_team_pod":
                pod, created = AccountTeamPOD.objects.get_or_create(
                    id=1,
                    defaults=json_response['data']
                )
                
                if not created:
                    for key, value in json_response['data'].items():
                        setattr(pod, key, value)
                    pod.save()
                
                print(f"💾 Saved Account Team POD to database")
            
            # Send headers for frontend (backup method)
            response = HttpResponse(answer, content_type="text/plain")
            response['X-Template-Data'] = json.dumps(json_response)
            response['X-Template-Type'] = detected_template
            response['Access-Control-Expose-Headers'] = 'X-Template-Data, X-Template-Type'
            
            return response
            
        except Exception as e:
            print(f"❌ Error processing template: {e}")
            import traceback
            traceback.print_exc()
            return HttpResponse(answer or "TBD", content_type="text/plain")
    
    # Return plain text for non-template queries
    return HttpResponse(answer or "TBD", content_type="text/plain")


# ----------------------------
# Template fill endpoint
# ----------------------------
@csrf_exempt
def fill_template(request):
    """
    POST /api/template/fill
    Returns ONLY JSON in your schema with TBD fallback
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    body = _json_body(request)
    user_id = _get_user_id(request, body)
    template_type = str(body.get("template_type") or "").strip()
    template_data = body.get("data")
    
    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    if not template_type or not isinstance(template_data, dict):
        return JsonResponse({"error": "template_type and data required"}, status=400)
    
    extra_query = str(body.get("query") or "").strip()
    retrieval_query = f"{template_type}. {extra_query}".strip() if extra_query else template_type
    
    chunks = search_chunks(user_id=user_id, query=retrieval_query, top_k=10)
    context_text = "\n\n".join(
        [(c.get("chunk_text") or "").strip() for c in chunks if (c.get("chunk_text") or "").strip()]
    ).strip()
    
    template = {"template_type": template_type, "data": template_data}
    
    if not context_text:
        return JsonResponse(enforce_tbd(template, {"template_type": template_type, "data": {}}),
                          json_dumps_params={"ensure_ascii": False})
    
    filled = fill_template_json_only(template=template, context_text=context_text)
    final = enforce_tbd(template=template, filled=filled)
    
    return JsonResponse(final, json_dumps_params={"ensure_ascii": False})


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
