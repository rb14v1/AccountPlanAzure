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