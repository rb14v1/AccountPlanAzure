# backend/api/models.py
from django.db import models

class TemplatePayload(models.Model):
    """
    Stores latest template JSON per (user_id, company_name, template_type).
    Works for ALL templates (relationship_heatmap, growth_strategy, etc.)
    """
    user_id = models.CharField(max_length=100, db_index=True)
    company_name = models.CharField(max_length=255, blank=True, default="", db_index=True)
    template_type = models.CharField(max_length=100, db_index=True)

    payload = models.JSONField()  # ✅ Postgres JSONB

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user_id", "company_name", "template_type")
        indexes = [
            models.Index(fields=["user_id", "template_type"]),
            models.Index(fields=["company_name", "template_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.template_type} | {self.company_name} | {self.user_id}"
