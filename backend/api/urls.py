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

    path("relationship-heatmap/", views.relationship_heatmap_get),
    path("relationship-heatmap/save_heatmap/", views.relationship_heatmap_save),

    # ✅ Growth Strategy
    path("growth-strategy/", views.growth_strategy_get),
    path("growth-strategy/save/", views.growth_strategy_save),

    path("customer-profile/", views.customer_profile_get),
    path("customer-profile/save_profile/", views.customer_profile_save),

    path("operational-excellence/", views.operational_excellence_get),
    path("operational-excellence/save/", views.operational_excellence_save),

    path("account-performance/", views.account_performance_get),
    path("account-performance/save/", views.account_performance_save),

    path("tech-spend/", views.tech_spend_get),
    path("tech-spend/save/", views.tech_spend_save),

    path("innovation-strategy/", views.innovation_strategy_get),
    path("innovation-strategy/save/", views.innovation_strategy_save),

    path("service-line-growth/", views.service_line_growth_get),   
    path("service-line-growth/save_growth/", views.service_line_growth_save),

    path("investment-plan/", views.investment_plan_get),
    path("investment-plan/save_plan/", views.investment_plan_save),

    path("talent-excellence/", views.talent_excellence_get),
    path("talent-excellence/save/", views.talent_excellence_save),

    path("innovation-strategy/", views.innovation_strategy_get),
    path("innovation-strategy/save/", views.innovation_strategy_save),

    path("implementation-plan/", views.implementation_plan_get),
    path("implementation-plan/save/", views.implementation_plan_save),

    path("operational-implementation-plan/", views.operational_implementation_plan_get),
    path("operational-implementation-plan/save/", views.operational_implementation_plan_save),
    
]