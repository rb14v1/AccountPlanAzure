# backend/api/serializers.py
from rest_framework import serializers
from .models import TemplatePayload

class TemplatePayloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplatePayload
        fields = ["id", "user_id", "company_name", "template_type", "payload", "created_at", "updated_at"]
