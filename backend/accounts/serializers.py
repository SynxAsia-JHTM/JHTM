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


class MemberUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    gender = serializers.ChoiceField(choices=["Male", "Female", "Other"], required=False, allow_null=True)
    category = serializers.ChoiceField(
        choices=["Youth", "Pastor", "Leader", "Member", "Guest"], required=False, allow_null=True
    )
    birthdate = serializers.DateField(required=False, allow_null=True)
    ministry = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    status = serializers.ChoiceField(
        choices=["Active", "Pending", "Inactive"], required=False
    )


class EventCreateUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    date = serializers.DateField(required=False)
    time = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=["Scheduled", "Planned", "Completed", "Cancelled"], required=False
    )
    category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    speaker = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    requires_registration = serializers.BooleanField(required=False)
    max_slots = serializers.IntegerField(required=False, allow_null=True)


class AttendanceCreateSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
    attendee_type = serializers.ChoiceField(choices=["member", "guest"], required=False, default="member")
    member_id = serializers.UUIDField(required=False, allow_null=True)
    guest_full_name = serializers.CharField(required=False, allow_blank=False)
    guest_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    guest_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    status = serializers.ChoiceField(
        choices=["present", "expected", "late", "excused"], required=False, default="present"
    )
    checkin_method = serializers.ChoiceField(choices=["manual", "qr"], required=False, default="manual")
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class AttendanceUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["present", "expected", "late", "excused", "removed"], required=False
    )
    checkin_method = serializers.ChoiceField(choices=["manual", "qr"], required=False)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class CheckinTokenCreateSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
    expires_in_minutes = serializers.IntegerField(required=False, default=10)


class QrAttendanceSubmitSerializer(serializers.Serializer):
    token_id = serializers.UUIDField()
    attendee_type = serializers.ChoiceField(choices=["member", "guest"], required=False, default="guest")
    member_id = serializers.UUIDField(required=False, allow_null=True)
    guest_full_name = serializers.CharField(required=False, allow_blank=False)
    guest_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    guest_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
