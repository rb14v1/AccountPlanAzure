from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()


urlpatterns = [
    path('', include(router.urls)),
    path("upload/request", views.upload_request),
    path("upload/complete", views.upload_complete),
    path("ingest", views.ingest_file),
    path("ingest/status", views.ingest_status),
    path("chat", views.chat),
    path("template/fill", views.fill_template),
    
    path("relationship-heatmap/", views.relationship_heatmap_get),
    path("relationship-heatmap/save_heatmap/", views.relationship_heatmap_save),

]
