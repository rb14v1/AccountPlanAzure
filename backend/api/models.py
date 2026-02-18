# backend/api/models.py
from django.db import models
from django.contrib.auth.models import User

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

from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

from django.contrib.auth.models import User
from django.db import models

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class ChatMessage(models.Model):
    chat = models.ForeignKey(ChatSession, related_name="messages", on_delete=models.CASCADE)
    sender = models.CharField(max_length=10)  # "user" or "bot"
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.text[:30]}"
