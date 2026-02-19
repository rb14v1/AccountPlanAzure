# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

from .views import (
    register_user,
    login_user,
    create_chat,
    list_chats,
    get_chat_messages,
)

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),

    # Core system routes
    path("upload/request", views.upload_request),
    path("upload/complete", views.upload_complete),
    path("ingest", views.ingest_file),
    path("ingest/status", views.ingest_status),
    path("chat", views.chat),
    path("template/fill", views.fill_template),

    path("auth/register/", register_user),
    path("auth/login/", login_user),

    path("chats/new", create_chat),
    path("chats", list_chats),
    path("chats/<int:chat_id>", get_chat_messages),

    # =========================================================================
    # ALL TEMPLATES - Mapped to the single dynamic view using kwargs!
    # =========================================================================
    
    # 1. Relationship Heatmap
    path("relationship-heatmap/", views.template_payload_detail, kwargs={"template_type": "relationship_heatmap"}),
    path("relationship-heatmap/save_heatmap/", views.template_payload_detail, kwargs={"template_type": "relationship_heatmap"}),

    # 2. Growth Strategy
    path("growth-strategy/", views.template_payload_detail, kwargs={"template_type": "growth_strategy"}),
    path("growth-strategy/save/", views.template_payload_detail, kwargs={"template_type": "growth_strategy"}),

    # 3. Customer Profile
    path("customer-profile/", views.template_payload_detail, kwargs={"template_type": "customer_profile"}),
    path("customer-profile/save_profile/", views.template_payload_detail, kwargs={"template_type": "customer_profile"}),

    # 4. Operational Excellence
    path("operational-excellence/", views.template_payload_detail, kwargs={"template_type": "operational_excellence_strategy"}),
    path("operational-excellence/save/", views.template_payload_detail, kwargs={"template_type": "operational_excellence_strategy"}),

    # 5. Account Performance Annual Plan
    path("account-performance/", views.template_payload_detail, kwargs={"template_type": "account_performance_annual_plan"}),
    path("account-performance/save/", views.template_payload_detail, kwargs={"template_type": "account_performance_annual_plan"}),

    # 6. Tech Spend View
    path("tech-spend/", views.template_payload_detail, kwargs={"template_type": "tech_spend_view"}),
    path("tech-spend/save/", views.template_payload_detail, kwargs={"template_type": "tech_spend_view"}),

    # 7. Innovation Strategy
    path("innovation-strategy/", views.template_payload_detail, kwargs={"template_type": "innovation_strategy"}),
    path("innovation-strategy/save/", views.template_payload_detail, kwargs={"template_type": "innovation_strategy"}),

    # 8. Service Line Growth Actions
    path("service-line-growth/", views.template_payload_detail, kwargs={"template_type": "service_line_growth_actions"}),   
    path("service-line-growth/save_growth/", views.template_payload_detail, kwargs={"template_type": "service_line_growth_actions"}),

    # 9. Investment Plan
    path("investment-plan/", views.template_payload_detail, kwargs={"template_type": "investment_plan"}),
    path("investment-plan/save_plan/", views.template_payload_detail, kwargs={"template_type": "investment_plan"}),

    # 10. Talent Excellence Overview
    path("talent-excellence/", views.template_payload_detail, kwargs={"template_type": "talent_excellence_overview"}),
    path("talent-excellence/save/", views.template_payload_detail, kwargs={"template_type": "talent_excellence_overview"}),

    # 11. Implementation Plan
    path("implementation-plan/", views.template_payload_detail, kwargs={"template_type": "implementation_plan"}),
    path("implementation-plan/save/", views.template_payload_detail, kwargs={"template_type": "implementation_plan"}),

    # 12. Operational Implementation Plan (FIXED THIS SECTION)
    path("operational-implementation-plan/", views.template_payload_detail, kwargs={"template_type": "operational_implementation_plan"}),
    path("operational-implementation-plan/save/", views.template_payload_detail, kwargs={"template_type": "operational_implementation_plan"}),
    
    # 13. Service Line Penetration
    path("service-line-penetration/", views.template_payload_detail, kwargs={"template_type": "service_line_penetration"}),
    path("service-line-penetration/save/", views.template_payload_detail, kwargs={"template_type": "service_line_penetration"}),

    # 14. Account Team Pod
    path("account-team-pod/", views.template_payload_detail, kwargs={"template_type": "account_team_pod"}),
    path("account-team-pod/save/", views.template_payload_detail, kwargs={"template_type": "account_team_pod"}),
]