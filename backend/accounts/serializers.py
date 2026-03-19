from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        # In standard Django, we might need to authenticate with username.
        # If we use email as username, we can just pass it.
        # For simplicity, we'll try to find user by email first.
        from django.contrib.auth.models import User
        try:
            user = User.objects.get(email=email)
            username = user.username
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

        user = authenticate(username=username, password=password)
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            return {
                "token": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "email": user.email,
                },
                "status": "login_successful"
            }
        raise serializers.ValidationError("Invalid credentials")


class PrayerRequestSubmissionSerializer(serializers.Serializer):
    message = serializers.CharField(allow_blank=False, trim_whitespace=True)
    visibility = serializers.ChoiceField(choices=["private", "leaders", "public"])
    is_anonymous = serializers.BooleanField(required=False, default=False)


class PrayerRequestAdminUpdateSerializer(serializers.Serializer):
    message = serializers.CharField(allow_blank=False, trim_whitespace=True, required=False)
    visibility = serializers.ChoiceField(choices=["private", "leaders", "public"], required=False)
    is_anonymous = serializers.BooleanField(required=False)


class SystemSettingsSerializer(serializers.Serializer):
    church_name = serializers.CharField(required=False)
    church_address = serializers.CharField(required=False)
    church_contact = serializers.CharField(required=False)
    church_email = serializers.EmailField(required=False)
    church_logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    
    attendance_enable_qr = serializers.BooleanField(required=False)
    attendance_allow_guest = serializers.BooleanField(required=False)
    attendance_time_window = serializers.IntegerField(required=False)
    
    prayer_allow_anonymous = serializers.BooleanField(required=False)
    prayer_default_visibility = serializers.ChoiceField(choices=["private", "leaders", "public"], required=False)
    
    event_enable_registration = serializers.BooleanField(required=False)
    event_default_max_slots = serializers.IntegerField(required=False)
    
    notification_email_alerts = serializers.BooleanField(required=False)
    notification_in_app_alerts = serializers.BooleanField(required=False)
    
    appearance_theme = serializers.CharField(required=False)

class UserManagementSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=False, write_only=True)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)
