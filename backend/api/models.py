from django.db import models
from django.contrib.auth.models import User

class StrategicPartnership(models.Model):
    partner_name = models.CharField(max_length=200)
    internal_poc = models.CharField(max_length=200, blank=True, null=True)
    partner_type = models.CharField(max_length=200, blank=True, null=True)
    sell_with_revenue_fy25_actuals_forecast = models.CharField(max_length=100, blank=True, null=True)
    sell_with_revenue_fy26_target = models.CharField(max_length=100, blank=True, null=True)
    key_engagements = models.TextField(blank=True, null=True)
    support_needed = models.CharField(max_length=200, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='strategic_partnerships', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CustomerProfile(models.Model):
    customer_name = models.CharField(max_length=200, blank=True, null=True)
    headquarter_location = models.CharField(max_length=200, blank=True, null=True)
    csat = models.CharField(max_length=100, blank=True, null=True)
    version_1_vertical = models.CharField(max_length=200, blank=True, null=True)
    current_work = models.JSONField(default=list, blank=True)
    service_lines = models.JSONField(default=list, blank=True)
    customer_perception = models.JSONField(default=list, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_profiles', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class GrowthStrategy(models.Model):
    growth_aspiration = models.JSONField(default=list, blank=True)
    key_vectors_for_driving_growth = models.JSONField(default=list, blank=True)
    improve_quality_sustainability_revenues = models.JSONField(default=list, blank=True)
    potential_inorganic_opportunities = models.JSONField(default=list, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='growth_strategies', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'growth_strategy'
    
    def __str__(self):
        return f"Growth Strategy - {self.created_at.strftime('%Y-%m-%d')}"

class AccountTeamPOD(models.Model):
    sales_and_delivery_leads = models.JSONField(default=dict, blank=True)
    functional_pocs = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='account_team_pods', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'account_team_pod'
    
    def __str__(self):
        return f"Account Team POD - {self.created_at.strftime('%Y-%m-%d')}"

class ServiceLineGrowth(models.Model):
    cloud_transformation = models.JSONField(default=dict, blank=True)
    data = models.JSONField(default=dict, blank=True)
    ai = models.JSONField(default=dict, blank=True)
    srg_managed_services = models.JSONField(default=dict, blank=True)
    ea = models.JSONField(default=dict, blank=True)
    strategy_design_and_change = models.JSONField(default=dict, blank=True)
    sam_and_licensing = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_line_growths', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'service_line_growth'
    
    def __str__(self):
        return f"Service Line Growth - {self.created_at.strftime('%Y-%m-%d')}"

class InvestmentPlan(models.Model):
    data = models.JSONField(default=list, blank=True)
    total_investment_value = models.CharField(max_length=50, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investment_plans', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'investment_plan'
    
    def __str__(self):
        return f"Investment Plan - {self.created_at.strftime('%Y-%m-%d')}"

class OperationalExcellence(models.Model):
    current_gp_percent = models.CharField(max_length=50, blank=True, null=True)
    gp_ambition_percent = models.CharField(max_length=50, blank=True, null=True)
    priority_levers_for_margin_uplift = models.JSONField(default=list, blank=True)
    commercial_transformation_plan = models.TextField(blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='operational_excellence', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'operational_excellence'
    
    def __str__(self):
        return f"Operational Excellence - {self.created_at.strftime('%Y-%m-%d')}"

class RelationshipHeatmap(models.Model):
    data = models.JSONField(default=list, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relationship_heatmaps', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'relationship_heatmap'
    
    def __str__(self):
        return f"Relationship Heatmap - {self.created_at.strftime('%Y-%m-%d')}"

class CriticalRisk(models.Model):
    data = models.JSONField(default=list, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='critical_risks', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        db_table = 'critical_risk'
    
    def __str__(self):
        return f"Critical Risk - {self.created_at.strftime('%Y-%m-%d')}"