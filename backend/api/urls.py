from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StrategicPartnershipViewSet, 
    CustomerProfileViewSet, 
    GrowthStrategyViewSet,
    AccountTeamPODViewSet,
    ServiceLineGrowthViewSet,
    InvestmentPlanViewSet,
    OperationalExcellenceViewSet,
    RelationshipHeatmapViewSet,
    CriticalRiskViewSet
)

router = DefaultRouter()
router.register(r'strategic-partnerships', StrategicPartnershipViewSet, basename='strategic-partnership')
router.register(r'customer-profile', CustomerProfileViewSet, basename='customer-profile')
router.register(r'growth-strategy', GrowthStrategyViewSet, basename='growth-strategy')
router.register(r'account-team-pod', AccountTeamPODViewSet, basename='account-team-pod')
router.register(r'service-line-growth', ServiceLineGrowthViewSet, basename='service-line-growth')
router.register(r'investment-plan', InvestmentPlanViewSet, basename='investment-plan')
router.register(r'operational-excellence', OperationalExcellenceViewSet, basename='operational-excellence')
router.register(r'relationship-heatmap', RelationshipHeatmapViewSet, basename='relationship-heatmap')
router.register(r'critical-risk', CriticalRiskViewSet, basename='critical-risk')

urlpatterns = [
    path('', include(router.urls)),
]
