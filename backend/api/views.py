# backend/api/views.py
import json
import os
from datetime import datetime, timezone

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from azure.storage.blob import BlobClient

from .storage import build_upload_path, create_upload_sas
from .search import run_indexer, get_indexer_status, search_chunks
from .aoai import answer_only_from_context, fill_template_json_only, enforce_tbd

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
    # Accept user_id either in JSON body or legacy header
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
    """Step 2: frontend tells backend the upload finished.
    
    We set blob metadata (user_id, filename) so the Search Indexer can map it into the index.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _json_body(request)
    user_id = _get_user_id(request, data)
    filename = str(data.get("filename") or "").strip()
    blob_path = str(data.get("blob_path") or "").strip()

    if not user_id or not filename or not blob_path:
        return JsonResponse({"error": "user_id, filename, blob_path required"}, status=400)

    # Ensure path is under that user (basic safety)
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
# Returns ONLY plain text answer
# ----------------------------
@csrf_exempt
def chat(request):
    """
    POST /api/chat
    body: { "user_id": "101", "query": "..." }
    or send header: X-User-Id
    Response: plain text ONLY (no ok/citations/matches)
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _json_body(request)
    user_id = _get_user_id(request, data)
    query = str(data.get("query") or data.get("prompt") or "").strip()
    top_k = int(data.get("top_k") or 6)

    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)
    if not query:
        return JsonResponse({"error": "query required"}, status=400)

    # Internal retrieval (NOT returned)
    chunks = search_chunks(user_id=user_id, query=query, top_k=top_k)

    # Build context text only
    context_text = "\n\n".join(
        [(c.get("chunk_text") or "").strip() for c in chunks if (c.get("chunk_text") or "").strip()]
    ).strip()

    if not context_text:
        return HttpResponse("TBD", content_type="text/plain")

    answer = answer_only_from_context(query=query, context_text=context_text)
    return HttpResponse(answer or "TBD", content_type="text/plain")


# ----------------------------
# Template fill endpoint
# Returns ONLY JSON in your schema with TBD fallback
# ----------------------------
@csrf_exempt
def fill_template(request):
    """
    POST /api/template/fill
    body:
      {
        "user_id": "101",
        "template_type": "growth_strategy",
        "data": {
          "growth_aspiration": [""],
          "key_vectors_for_driving_growth": [""],
          "improve_quality_sustainability_revenues": [""],
          "potential_inorganic_opportunities": [""]
        },
        "query": "optional extra prompt"
      }

    Response: ONLY JSON (no ok, no citations, no chunks)
    Missing -> ["TBD"]
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

    # Internal retrieval (hidden)
    chunks = search_chunks(user_id=user_id, query=retrieval_query, top_k=10)

    context_text = "\n\n".join(
        [(c.get("chunk_text") or "").strip() for c in chunks if (c.get("chunk_text") or "").strip()]
    ).strip()

    template = {"template_type": template_type, "data": template_data}

    # If we have no context at all -> all TBD
    if not context_text:
        return JsonResponse(enforce_tbd(template, {"template_type": template_type, "data": {}}),
                            json_dumps_params={"ensure_ascii": False})

    filled = fill_template_json_only(template=template, context_text=context_text)
    final = enforce_tbd(template=template, filled=filled)

    return JsonResponse(final, json_dumps_params={"ensure_ascii": False})


# ----------------------------
# ViewSets for Django REST Framework
# ----------------------------

class StrategicPartnershipViewSet(viewsets.ModelViewSet):
    queryset = StrategicPartnership.objects.all()
    serializer_class = StrategicPartnershipSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        """Auto-save and manual-save endpoint"""
        print("=== Bulk Save Request Received ===")
        print("Request data:", request.data)
        
        partnerships_data = request.data.get('partnerships', request.data)
        
        if isinstance(partnerships_data, dict):
            partnerships_data = [partnerships_data]
        
        valid_data = [
            p for p in partnerships_data
            if p.get('partner_name') and p.get('partner_name').strip() != ""
        ]
        
        print(f"Valid partnerships to save: {len(valid_data)}")
        
        saved_partnerships = []
        with transaction.atomic():
            for partnership_data in valid_data:
                partner_name = partnership_data.get('partner_name')
                partnership_id = partnership_data.get('id')
                
                if partnership_id:
                    try:
                        existing = StrategicPartnership.objects.get(id=partnership_id)
                        serializer = self.get_serializer(existing, data=partnership_data, partial=True)
                        print(f"Updating existing partnership: {partner_name}")
                    except StrategicPartnership.DoesNotExist:
                        serializer = self.get_serializer(data=partnership_data)
                        print(f"Creating new partnership (ID not found): {partner_name}")
                else:
                    existing = StrategicPartnership.objects.filter(
                        partner_name=partner_name
                    ).first()
                    
                    if existing:
                        serializer = self.get_serializer(existing, data=partnership_data, partial=True)
                        print(f"Updating existing partnership by name: {partner_name}")
                    else:
                        serializer = self.get_serializer(data=partnership_data)
                        print(f"Creating new partnership: {partner_name}")
                
                if serializer.is_valid():
                    partnership = serializer.save()
                    saved_partnerships.append(partnership)
                else:
                    print(f"Validation errors for {partner_name}: {serializer.errors}")
        
        result_serializer = self.get_serializer(saved_partnerships, many=True)
        print(f"Successfully saved {len(saved_partnerships)} partnerships")
        
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
        """Get the latest customer profile"""
        profile = CustomerProfile.objects.first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_profile(self, request):
        """Save or update customer profile"""
        print("=== Customer Profile Save Request ===")
        print("Request data:", request.data)
        
        profile_data = request.data
        existing_profile = CustomerProfile.objects.first()
        
        if existing_profile:
            serializer = self.get_serializer(existing_profile, data=profile_data, partial=True)
            print("Updating existing customer profile")
        else:
            serializer = self.get_serializer(data=profile_data)
            print("Creating new customer profile")
        
        if serializer.is_valid():
            profile = serializer.save()
            print(f"Successfully saved customer profile: {profile.customer_name}")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class GrowthStrategyViewSet(viewsets.ModelViewSet):
    queryset = GrowthStrategy.objects.all()
    serializer_class = GrowthStrategySerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest growth strategy"""
        strategy = GrowthStrategy.objects.first()
        if strategy:
            serializer = self.get_serializer(strategy)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_strategy(self, request):
        """Save or update growth strategy"""
        print("=== Growth Strategy Save Request ===")
        print("Request data:", request.data)
        
        strategy_data = request.data
        existing_strategy = GrowthStrategy.objects.first()
        
        if existing_strategy:
            serializer = self.get_serializer(existing_strategy, data=strategy_data, partial=True)
            print("Updating existing growth strategy")
        else:
            serializer = self.get_serializer(data=strategy_data)
            print("Creating new growth strategy")
        
        if serializer.is_valid():
            strategy = serializer.save()
            print(f"Successfully saved growth strategy")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class AccountTeamPODViewSet(viewsets.ModelViewSet):
    queryset = AccountTeamPOD.objects.all()
    serializer_class = AccountTeamPODSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest account team POD"""
        pod = AccountTeamPOD.objects.first()
        if pod:
            serializer = self.get_serializer(pod)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_pod(self, request):
        """Save or update account team POD"""
        print("=== Account Team POD Save Request ===")
        print("Request data:", request.data)
        
        pod_data = request.data
        existing_pod = AccountTeamPOD.objects.first()
        
        if existing_pod:
            serializer = self.get_serializer(existing_pod, data=pod_data, partial=True)
            print("Updating existing account team POD")
        else:
            serializer = self.get_serializer(data=pod_data)
            print("Creating new account team POD")
        
        if serializer.is_valid():
            pod = serializer.save()
            print(f"Successfully saved account team POD")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class ServiceLineGrowthViewSet(viewsets.ModelViewSet):
    queryset = ServiceLineGrowth.objects.all()
    serializer_class = ServiceLineGrowthSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest service line growth"""
        growth = ServiceLineGrowth.objects.first()
        if growth:
            serializer = self.get_serializer(growth)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_growth(self, request):
        """Save or update service line growth"""
        print("=== Service Line Growth Save Request ===")
        print("Request data:", request.data)
        
        growth_data = request.data
        existing_growth = ServiceLineGrowth.objects.first()
        
        if existing_growth:
            serializer = self.get_serializer(existing_growth, data=growth_data, partial=True)
            print("Updating existing service line growth")
        else:
            serializer = self.get_serializer(data=growth_data)
            print("Creating new service line growth")
        
        if serializer.is_valid():
            growth = serializer.save()
            print(f"Successfully saved service line growth")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class InvestmentPlanViewSet(viewsets.ModelViewSet):
    queryset = InvestmentPlan.objects.all()
    serializer_class = InvestmentPlanSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest investment plan"""
        plan = InvestmentPlan.objects.first()
        if plan:
            serializer = self.get_serializer(plan)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_plan(self, request):
        """Save or update investment plan"""
        print("=== Investment Plan Save Request ===")
        print("Request data:", request.data)
        
        plan_data = request.data
        existing_plan = InvestmentPlan.objects.first()
        
        if existing_plan:
            serializer = self.get_serializer(existing_plan, data=plan_data, partial=True)
            print("Updating existing investment plan")
        else:
            serializer = self.get_serializer(data=plan_data)
            print("Creating new investment plan")
        
        if serializer.is_valid():
            plan = serializer.save()
            print(f"Successfully saved investment plan")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class OperationalExcellenceViewSet(viewsets.ModelViewSet):
    queryset = OperationalExcellence.objects.all()
    serializer_class = OperationalExcellenceSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest operational excellence strategy"""
        strategy = OperationalExcellence.objects.first()
        if strategy:
            serializer = self.get_serializer(strategy)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_strategy(self, request):
        """Save or update operational excellence strategy"""
        print("=== Operational Excellence Save Request ===")
        print("Request data:", request.data)
        
        strategy_data = request.data
        existing_strategy = OperationalExcellence.objects.first()
        
        if existing_strategy:
            serializer = self.get_serializer(existing_strategy, data=strategy_data, partial=True)
            print("Updating existing operational excellence strategy")
        else:
            serializer = self.get_serializer(data=strategy_data)
            print("Creating new operational excellence strategy")
        
        if serializer.is_valid():
            strategy = serializer.save()
            print(f"Successfully saved operational excellence strategy")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class RelationshipHeatmapViewSet(viewsets.ModelViewSet):
    queryset = RelationshipHeatmap.objects.all()
    serializer_class = RelationshipHeatmapSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest relationship heatmap"""
        heatmap = RelationshipHeatmap.objects.first()
        if heatmap:
            serializer = self.get_serializer(heatmap)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_heatmap(self, request):
        """Save or update relationship heatmap"""
        print("=== Relationship Heatmap Save Request ===")
        print("Request data:", request.data)
        
        heatmap_data = request.data
        existing_heatmap = RelationshipHeatmap.objects.first()
        
        if existing_heatmap:
            serializer = self.get_serializer(existing_heatmap, data=heatmap_data, partial=True)
            print("Updating existing relationship heatmap")
        else:
            serializer = self.get_serializer(data=heatmap_data)
            print("Creating new relationship heatmap")
        
        if serializer.is_valid():
            heatmap = serializer.save()
            print(f"Successfully saved relationship heatmap")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class CriticalRiskViewSet(viewsets.ModelViewSet):
    queryset = CriticalRisk.objects.all()
    serializer_class = CriticalRiskSerializer
    permission_classes = [AllowAny]
    
    def list(self, request, *args, **kwargs):
        """Get the latest critical risk tracking"""
        risk = CriticalRisk.objects.first()
        if risk:
            serializer = self.get_serializer(risk)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def save_risks(self, request):
        """Save or update critical risks"""
        print("=== Critical Risk Save Request ===")
        print("Request data:", request.data)
        
        risk_data = request.data
        existing_risk = CriticalRisk.objects.first()
        
        if existing_risk:
            serializer = self.get_serializer(existing_risk, data=risk_data, partial=True)
            print("Updating existing critical risks")
        else:
            serializer = self.get_serializer(data=risk_data)
            print("Creating new critical risks")
        
        if serializer.is_valid():
            risk = serializer.save()
            print(f"Successfully saved critical risks")
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            print(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
