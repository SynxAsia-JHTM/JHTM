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
