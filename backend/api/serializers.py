# backend/api/serializers.py
from rest_framework import serializers
from .models import TemplatePayload

class TemplatePayloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplatePayload
        fields = ["id", "user_id", "company_name", "template_type", "payload", "created_at", "updated_at"]


from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
        return user



from .models import ChatSession, ChatMessage

class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ["id", "title", "created_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "sender", "text", "timestamp"]
