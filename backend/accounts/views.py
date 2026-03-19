from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import connection

from .serializers import LoginSerializer, PrayerRequestSubmissionSerializer

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
