from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import connection
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

from .serializers import (
    LoginSerializer,
    PrayerRequestAdminUpdateSerializer,
    PrayerRequestSubmissionSerializer,
    SystemSettingsSerializer,
    UserManagementSerializer,
)

class LoginView(APIView):
    def get(self, request):
        return Response(
            {
                "ok": True,
                "detail": "Use POST to authenticate.",
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class PrayerRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    select pr.id, pr.user_id, u.email, pr.message, pr.visibility, pr.is_anonymous, pr.status, pr.created_at
                    from prayer_requests pr
                    left join auth_user u on u.id = pr.user_id
                    order by pr.created_at desc
                    limit 500
                    """
                )
                rows = cursor.fetchall()
                results = [
                    {
                        "id": str(r[0]),
                        "user_id": int(r[1]),
                        "user_email": r[2],
                        "message": r[3],
                        "visibility": r[4],
                        "is_anonymous": bool(r[5]),
                        "status": r[6],
                        "created_at": r[7].isoformat() if r[7] else None,
                    }
                    for r in rows
                ]
            except Exception:
                cursor.execute(
                    """
                    select id, user_id, message, visibility, is_anonymous, status, created_at
                    from prayer_requests
                    order by created_at desc
                    limit 500
                    """
                )
                rows = cursor.fetchall()
                results = [
                    {
                        "id": str(r[0]),
                        "user_id": int(r[1]),
                        "user_email": None,
                        "message": r[2],
                        "visibility": r[3],
                        "is_anonymous": bool(r[4]),
                        "status": r[5],
                        "created_at": r[6].isoformat() if r[6] else None,
                    }
                    for r in rows
                ]

        return Response({"results": results}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PrayerRequestSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        user_id = int(request.user.id)
        message = payload["message"]
        visibility = payload["visibility"]
        is_anonymous = bool(payload.get("is_anonymous", False))

        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into prayer_requests (user_id, message, visibility, is_anonymous)
                values (%s, %s, %s, %s)
                returning id, created_at, status
                """,
                [user_id, message, visibility, is_anonymous],
            )
            row = cursor.fetchone()

        return Response(
            {
                "id": str(row[0]),
                "user_id": user_id,
                "user_email": request.user.email,
                "message": message,
                "visibility": visibility,
                "is_anonymous": is_anonymous,
                "status": row[2],
                "created_at": row[1].isoformat() if row[1] else None,
            },
            status=status.HTTP_201_CREATED,
        )


class MyPrayerRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = int(request.user.id)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select id, user_id, message, visibility, is_anonymous, status, created_at
                from prayer_requests
                where user_id = %s
                order by created_at desc
                limit 200
                """,
                [user_id],
            )
            rows = cursor.fetchall()

        results = [
            {
                "id": str(r[0]),
                "user_id": int(r[1]),
                "message": r[2],
                "visibility": r[3],
                "is_anonymous": bool(r[4]),
                "status": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
        return Response({"results": results}, status=status.HTTP_200_OK)


class PrayerRequestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, prayer_request_id):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        serializer = PrayerRequestAdminUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if not payload:
            return Response({"detail": "No fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        set_clauses = []
        params = []
        if "message" in payload:
            set_clauses.append("message = %s")
            params.append(payload["message"].strip())
        if "visibility" in payload:
            set_clauses.append("visibility = %s")
            params.append(payload["visibility"])
        if "is_anonymous" in payload:
            set_clauses.append("is_anonymous = %s")
            params.append(bool(payload["is_anonymous"]))

        params.append(prayer_request_id)

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                update prayer_requests
                set {', '.join(set_clauses)}
                where id = %s
                returning id, user_id, message, visibility, is_anonymous, status, created_at
                """,
                params,
            )
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "id": str(row[0]),
                "user_id": int(row[1]),
                "message": row[2],
                "visibility": row[3],
                "is_anonymous": bool(row[4]),
                "status": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, prayer_request_id):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        with connection.cursor() as cursor:
            cursor.execute("delete from prayer_requests where id = %s", [prayer_request_id])
            deleted = cursor.rowcount

        if deleted < 1:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        with connection.cursor() as cursor:
            cursor.execute(
                """
                select 
                    church_name, church_address, church_contact, church_email, church_logo_url,
                    attendance_enable_qr, attendance_allow_guest, attendance_time_window,
                    prayer_allow_anonymous, prayer_default_visibility,
                    event_enable_registration, event_default_max_slots,
                    notification_email_alerts, notification_in_app_alerts,
                    appearance_theme
                from system_settings
                where id = 1
                """
            )
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "Settings not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "church_name": row[0],
            "church_address": row[1],
            "church_contact": row[2],
            "church_email": row[3],
            "church_logo_url": row[4],
            "attendance_enable_qr": bool(row[5]),
            "attendance_allow_guest": bool(row[6]),
            "attendance_time_window": row[7],
            "prayer_allow_anonymous": bool(row[8]),
            "prayer_default_visibility": row[9],
            "event_enable_registration": bool(row[10]),
            "event_default_max_slots": row[11],
            "notification_email_alerts": bool(row[12]),
            "notification_in_app_alerts": bool(row[13]),
            "appearance_theme": row[14],
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        serializer = SystemSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if not payload:
            return Response({"detail": "No fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        set_clauses = []
        params = []
        for key, value in payload.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)

        set_clauses.append("updated_at = now()")

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                update system_settings
                set {', '.join(set_clauses)}
                where id = 1
                returning 
                    church_name, church_address, church_contact, church_email, church_logo_url,
                    attendance_enable_qr, attendance_allow_guest, attendance_time_window,
                    prayer_allow_anonymous, prayer_default_visibility,
                    event_enable_registration, event_default_max_slots,
                    notification_email_alerts, notification_in_app_alerts,
                    appearance_theme
                """,
                params,
            )
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "Settings not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "church_name": row[0],
            "church_address": row[1],
            "church_contact": row[2],
            "church_email": row[3],
            "church_logo_url": row[4],
            "attendance_enable_qr": bool(row[5]),
            "attendance_allow_guest": bool(row[6]),
            "attendance_time_window": row[7],
            "prayer_allow_anonymous": bool(row[8]),
            "prayer_default_visibility": row[9],
            "event_enable_registration": bool(row[10]),
            "event_default_max_slots": row[11],
            "notification_email_alerts": bool(row[12]),
            "notification_in_app_alerts": bool(row[13]),
            "appearance_theme": row[14],
        }, status=status.HTTP_200_OK)


class UserManagementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser and not request.user.is_staff:
            raise PermissionDenied("Admin access required")
            
        users = User.objects.all().order_by('-date_joined') if hasattr(User, 'date_joined') else User.objects.all().order_by('-id')
        
        results = [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "is_staff": u.is_staff,
                "is_superuser": u.is_superuser,
            }
            for u in users
        ]
        return Response({"results": results}, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.is_superuser:
            raise PermissionDenied("Superuser access required to create admins")

        serializer = UserManagementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        email = payload.get("email")
        if not email:
            return Response({"detail": "Email required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"detail": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=email,
            email=email,
            is_staff=payload.get("is_staff", False),
            is_superuser=payload.get("is_superuser", False)
        )
        if "password" in payload:
            user.set_password(payload["password"])
            user.save()

        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }, status=status.HTTP_201_CREATED)


class UserManagementDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if not request.user.is_superuser:
            raise PermissionDenied("Superuser access required to edit roles")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserManagementSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if "email" in payload:
            user.email = payload["email"]
            user.username = payload["email"]
        if "is_staff" in payload:
            user.is_staff = payload["is_staff"]
        if "is_superuser" in payload:
            user.is_superuser = payload["is_superuser"]
        if "password" in payload:
            user.set_password(payload["password"])

        user.save()

        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }, status=status.HTTP_200_OK)

    def delete(self, request, user_id):
        if not request.user.is_superuser:
            raise PermissionDenied("Superuser access required")

        if int(user_id) == request.user.id:
            return Response({"detail": "Cannot delete yourself"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            user.delete()
        except User.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)
