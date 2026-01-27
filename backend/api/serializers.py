from rest_framework import serializers
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

class StrategicPartnershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = StrategicPartnership
        fields = [
            'id',
            'partner_name',
            'internal_poc',
            'partner_type',
            'sell_with_revenue_fy25_actuals_forecast',
            'sell_with_revenue_fy26_target',
            'key_engagements',
            'support_needed',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            'id',
            'customer_name',
            'headquarter_location',
            'csat',
            'version_1_vertical',
            'current_work',
            'service_lines',
            'customer_perception',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class GrowthStrategySerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthStrategy
        fields = [
            'id',
            'growth_aspiration',
            'key_vectors_for_driving_growth',
            'improve_quality_sustainability_revenues',
            'potential_inorganic_opportunities',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccountTeamPODSerializer(serializers.ModelSerializer):
    Sales_and_Delivery_Leads = serializers.JSONField(source='sales_and_delivery_leads')
    Functional_POCs = serializers.JSONField(source='functional_pocs')
    
    class Meta:
        model = AccountTeamPOD
        fields = [
            'id',
            'Sales_and_Delivery_Leads',
            'Functional_POCs',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ServiceLineGrowthSerializer(serializers.ModelSerializer):
    Cloud_Transformation = serializers.JSONField(source='cloud_transformation')
    Data = serializers.JSONField(source='data')
    AI = serializers.JSONField(source='ai')
    SRG_Managed_Services = serializers.JSONField(source='srg_managed_services')
    EA = serializers.JSONField(source='ea')
    Strategy_Design_and_Change = serializers.JSONField(source='strategy_design_and_change')
    SAM_and_Licensing = serializers.JSONField(source='sam_and_licensing')
    
    class Meta:
        model = ServiceLineGrowth
        fields = [
            'id',
            'Cloud_Transformation',
            'Data',
            'AI',
            'SRG_Managed_Services',
            'EA',
            'Strategy_Design_and_Change',
            'SAM_and_Licensing',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class InvestmentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentPlan
        fields = [
            'id',
            'data',
            'total_investment_value',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class OperationalExcellenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OperationalExcellence
        fields = [
            'id',
            'current_gp_percent',
            'gp_ambition_percent',
            'priority_levers_for_margin_uplift',
            'commercial_transformation_plan',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class RelationshipHeatmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelationshipHeatmap
        fields = [
            'id',
            'data',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class CriticalRiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriticalRisk
        fields = [
            'id',
            'data',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
