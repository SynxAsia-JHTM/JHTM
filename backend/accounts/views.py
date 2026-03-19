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
    MemberUpdateSerializer,
    EventCreateUpdateSerializer,
    AttendanceCreateSerializer,
    AttendanceUpdateSerializer,
    CheckinTokenCreateSerializer,
    QrAttendanceSubmitSerializer,
    PrayerRequestAdminUpdateSerializer,
    PrayerRequestSubmissionSerializer,
    SystemSettingsSerializer,
    UserManagementSerializer,
)


def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def dictfetchone(cursor):
    row = cursor.fetchone()
    if not row:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def ensure_member_for_user(user):
    user_id = int(user.id)
    email = user.email or ''
    name_guess = ''
    if getattr(user, 'first_name', '') or getattr(user, 'last_name', ''):
        name_guess = f"{getattr(user, 'first_name', '').strip()} {getattr(user, 'last_name', '').strip()}".strip()
    if not name_guess:
        name_guess = email.split('@')[0] if email else (user.username or 'Member')

    with connection.cursor() as cursor:
        cursor.execute(
            """
            select id, user_id, name, email, phone, gender, category, birthdate, ministry, status, created_at, updated_at
            from members
            where user_id = %s
            """,
            [user_id],
        )
        existing = dictfetchone(cursor)
        if existing:
            return existing

        cursor.execute(
            """
            insert into members (user_id, name, email)
            values (%s, %s, %s)
            returning id, user_id, name, email, phone, gender, category, birthdate, ministry, status, created_at, updated_at
            """,
            [user_id, name_guess, email],
        )
        created = dictfetchone(cursor)
        return created


def to_naive(dt):
    if not dt:
        return None
    try:
        if getattr(dt, 'tzinfo', None) is not None:
            return dt.replace(tzinfo=None)
    except Exception:
        return dt
    return dt

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


class MembersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        with connection.cursor() as cursor:
            cursor.execute(
                """
                select id, user_id, name, email, phone, gender, category, birthdate, ministry, status, created_at, updated_at
                from members
                order by updated_at desc
                limit 1000
                """
            )
            results = dictfetchall(cursor)

        for r in results:
            if r.get('birthdate'):
                r['birthdate'] = r['birthdate'].isoformat()
            if r.get('created_at'):
                r['created_at'] = r['created_at'].isoformat()
            if r.get('updated_at'):
                r['updated_at'] = r['updated_at'].isoformat()

        return Response({"results": results}, status=status.HTTP_200_OK)


class MembersMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = ensure_member_for_user(request.user)
        if member.get('birthdate'):
            member['birthdate'] = member['birthdate'].isoformat()
        if member.get('created_at'):
            member['created_at'] = member['created_at'].isoformat()
        if member.get('updated_at'):
            member['updated_at'] = member['updated_at'].isoformat()
        return Response(member, status=status.HTTP_200_OK)


class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select id, user_id, name, email, phone, gender, category, birthdate, ministry, status, created_at, updated_at
                from members
                where id = %s
                """,
                [str(member_id)],
            )
            row = dictfetchone(cursor)

        if not row:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff and int(row['user_id']) != int(request.user.id):
            raise PermissionDenied("Access denied")

        if row.get('birthdate'):
            row['birthdate'] = row['birthdate'].isoformat()
        if row.get('created_at'):
            row['created_at'] = row['created_at'].isoformat()
        if row.get('updated_at'):
            row['updated_at'] = row['updated_at'].isoformat()

        return Response(row, status=status.HTTP_200_OK)

    def patch(self, request, member_id):
        serializer = MemberUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if not payload:
            return Response({"detail": "No fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("select user_id from members where id = %s", [str(member_id)])
            existing = cursor.fetchone()
            if not existing:
                return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            owner_user_id = int(existing[0])

        if not request.user.is_staff and owner_user_id != int(request.user.id):
            raise PermissionDenied("Access denied")

        set_clauses = []
        params = []
        for key, value in payload.items():
            set_clauses.append(f"{key} = %s")
            params.append(value)
        set_clauses.append("updated_at = now()")

        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                update members
                set {', '.join(set_clauses)}
                where id = %s
                returning id, user_id, name, email, phone, gender, category, birthdate, ministry, status, created_at, updated_at
                """,
                params + [str(member_id)],
            )
            updated = dictfetchone(cursor)

        if not updated:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if updated.get('birthdate'):
            updated['birthdate'] = updated['birthdate'].isoformat()
        if updated.get('created_at'):
            updated['created_at'] = updated['created_at'].isoformat()
        if updated.get('updated_at'):
            updated['updated_at'] = updated['updated_at'].isoformat()

        return Response(updated, status=status.HTTP_200_OK)


class EventsListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = ensure_member_for_user(request.user)
        member_id = str(member['id']) if member else None

        with connection.cursor() as cursor:
            cursor.execute(
                """
                select
                    e.id,
                    e.name,
                    e.date,
                    e.time,
                    e.location,
                    e.status,
                    e.category,
                    e.speaker,
                    e.requires_registration,
                    e.max_slots,
                    (select count(1) from event_registrations er where er.event_id = e.id) as registrations_count,
                    exists(
                        select 1 from event_registrations er
                        where er.event_id = e.id and er.member_id = %s
                    ) as is_registered
                from events e
                where e.status != 'Cancelled'
                order by e.date asc, e.time asc
                limit 1000
                """,
                [member_id],
            )
            rows = cursor.fetchall()

        results = []
        for r in rows:
            max_slots = r[9]
            reg_count = int(r[10] or 0)
            remaining = None
            if max_slots is not None:
                remaining = max(0, int(max_slots) - reg_count)
            results.append(
                {
                    "id": str(r[0]),
                    "name": r[1],
                    "date": r[2].isoformat() if r[2] else None,
                    "time": r[3],
                    "location": r[4],
                    "status": r[5],
                    "category": r[6],
                    "speaker": r[7],
                    "requires_registration": bool(r[8]),
                    "max_slots": max_slots,
                    "registrations_count": reg_count,
                    "remaining_slots": remaining,
                    "is_registered": bool(r[11]),
                }
            )

        return Response({"results": results}, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        serializer = EventCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        required = ["name", "date", "time", "location", "status"]
        for k in required:
            if k not in payload:
                return Response({"detail": f"{k} required"}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into events (name, date, time, location, status, category, speaker, requires_registration, max_slots)
                values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                returning id
                """,
                [
                    payload.get('name'),
                    payload.get('date'),
                    payload.get('time') or '00:00',
                    payload.get('location') or '',
                    payload.get('status') or 'Scheduled',
                    payload.get('category'),
                    payload.get('speaker'),
                    bool(payload.get('requires_registration', False)),
                    payload.get('max_slots'),
                ],
            )
            row = cursor.fetchone()

        return Response({"id": str(row[0])}, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, event_id):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        serializer = EventCreateUpdateSerializer(data=request.data, partial=True)
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
                update events
                set {', '.join(set_clauses)}
                where id = %s
                returning id
                """,
                params + [str(event_id)],
            )
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"id": str(row[0])}, status=status.HTTP_200_OK)

    def delete(self, request, event_id):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        with connection.cursor() as cursor:
            cursor.execute("delete from events where id = %s", [str(event_id)])
            deleted = cursor.rowcount

        if deleted < 1:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)


class EventRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        member = ensure_member_for_user(request.user)
        member_id = str(member['id'])

        with connection.cursor() as cursor:
            cursor.execute(
                """
                select requires_registration, max_slots
                from events
                where id = %s
                """,
                [str(event_id)],
            )
            row = cursor.fetchone()
            if not row:
                return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            requires_registration = bool(row[0])
            max_slots = row[1]

            if not requires_registration:
                return Response({"detail": "Registration not enabled"}, status=status.HTTP_400_BAD_REQUEST)

            if max_slots is not None:
                cursor.execute("select count(1) from event_registrations where event_id = %s", [str(event_id)])
                count = int(cursor.fetchone()[0] or 0)
                if count >= int(max_slots):
                    return Response({"detail": "Event is full"}, status=status.HTTP_400_BAD_REQUEST)

            cursor.execute(
                """
                insert into event_registrations (event_id, member_id)
                values (%s, %s)
                on conflict (event_id, member_id) do nothing
                """,
                [str(event_id), member_id],
            )

        return Response({"ok": True}, status=status.HTTP_200_OK)

    def delete(self, request, event_id):
        member = ensure_member_for_user(request.user)
        member_id = str(member['id'])

        with connection.cursor() as cursor:
            cursor.execute(
                "delete from event_registrations where event_id = %s and member_id = %s",
                [str(event_id), member_id],
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AttendanceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        event_id = request.query_params.get('event_id')

        with connection.cursor() as cursor:
            params = []
            where = []
            if event_id:
                where.append('ar.event_id = %s')
                params.append(event_id)

            where_sql = f"where {' and '.join(where)}" if where else ''
            cursor.execute(
                f"""
                select
                    ar.id,
                    ar.event_id,
                    ar.attendee_type,
                    ar.member_id,
                    m.name as member_name,
                    ar.guest_full_name,
                    ar.guest_phone,
                    ar.guest_email,
                    ar.status,
                    ar.checkin_method,
                    ar.checked_in_at,
                    ar.checked_in_by_user_id,
                    ar.notes
                from attendance_records ar
                left join members m on m.id = ar.member_id
                {where_sql}
                order by ar.checked_in_at desc
                limit 2000
                """,
                params,
            )
            rows = cursor.fetchall()

        results = []
        for r in rows:
            results.append(
                {
                    "id": str(r[0]),
                    "event_id": str(r[1]),
                    "attendee_type": r[2],
                    "member_id": str(r[3]) if r[3] else None,
                    "member_name": r[4],
                    "guest": {
                        "full_name": r[5],
                        "phone": r[6],
                        "email": r[7],
                    }
                    if r[2] == 'guest'
                    else None,
                    "status": r[8],
                    "checkin_method": r[9],
                    "checked_in_at": r[10].isoformat() if r[10] else None,
                    "checked_in_by_user_id": int(r[11]) if r[11] else None,
                    "notes": r[12],
                }
            )

        return Response({"results": results}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        event_id = str(payload['event_id'])
        attendee_type = payload.get('attendee_type', 'member')
        status_value = payload.get('status', 'present')
        method = payload.get('checkin_method', 'manual')
        notes = payload.get('notes')

        if request.user.is_staff:
            if attendee_type == 'member' and not payload.get('member_id'):
                return Response(
                    {"detail": "member_id required for member attendance"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if attendee_type == 'guest' and not payload.get('guest_full_name'):
                return Response(
                    {"detail": "guest_full_name required for guest attendance"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if request.user.is_staff:
            member_id = str(payload.get('member_id')) if payload.get('member_id') else None
            guest_full_name = payload.get('guest_full_name')
            guest_phone = payload.get('guest_phone')
            guest_email = payload.get('guest_email')
            checked_by = int(request.user.id)
        else:
            member = ensure_member_for_user(request.user)
            member_id = str(member['id'])
            attendee_type = 'member'
            guest_full_name = None
            guest_phone = None
            guest_email = None
            checked_by = None

            if status_value != 'expected':
                with connection.cursor() as cursor:
                    cursor.execute("select date, time from events where id = %s", [event_id])
                    row = cursor.fetchone()
                    if row:
                        dt = f"{row[0].isoformat()}T{row[1] or '00:00'}"
                        from datetime import datetime, timedelta

                        try:
                            start = datetime.fromisoformat(dt)
                            now = datetime.utcnow()
                            if now > start + timedelta(minutes=10):
                                status_value = 'late'
                            else:
                                status_value = 'present'
                        except Exception:
                            status_value = 'present'

        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    insert into attendance_records
                      (event_id, attendee_type, member_id, guest_full_name, guest_phone, guest_email, status, checkin_method, checked_in_by_user_id, notes)
                    values
                      (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    returning id
                    """,
                    [
                        event_id,
                        attendee_type,
                        member_id,
                        guest_full_name,
                        guest_phone,
                        guest_email,
                        status_value,
                        method,
                        checked_by,
                        notes,
                    ],
                )
                row = cursor.fetchone()
                record_id = str(row[0])
            except Exception:
                if member_id:
                    cursor.execute(
                        """
                        update attendance_records
                        set status = %s, checkin_method = %s, checked_in_at = now(), checked_in_by_user_id = %s, notes = %s, updated_at = now()
                        where event_id = %s and member_id = %s
                        returning id
                        """,
                        [status_value, method, checked_by, notes, event_id, member_id],
                    )
                    row = cursor.fetchone()
                    if not row:
                        raise
                    record_id = str(row[0])
                else:
                    raise

        return Response({"id": record_id}, status=status.HTTP_201_CREATED)


class MyAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = ensure_member_for_user(request.user)
        member_id = str(member['id'])

        with connection.cursor() as cursor:
            cursor.execute(
                """
                select
                    ar.id,
                    ar.event_id,
                    ar.attendee_type,
                    ar.member_id,
                    ar.status,
                    ar.checkin_method,
                    ar.checked_in_at,
                    ar.notes
                from attendance_records ar
                where ar.member_id = %s
                order by ar.checked_in_at desc
                limit 1000
                """,
                [member_id],
            )
            rows = cursor.fetchall()

        results = [
            {
                "id": str(r[0]),
                "event_id": str(r[1]),
                "attendee_type": r[2],
                "member_id": str(r[3]) if r[3] else None,
                "status": r[4],
                "checkin_method": r[5],
                "checked_in_at": r[6].isoformat() if r[6] else None,
                "notes": r[7],
            }
            for r in rows
        ]

        return Response({"results": results}, status=status.HTTP_200_OK)


class AttendanceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, attendance_id):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        serializer = AttendanceUpdateSerializer(data=request.data, partial=True)
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
                update attendance_records
                set {', '.join(set_clauses)}
                where id = %s
                returning id
                """,
                params + [str(attendance_id)],
            )
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"id": str(row[0])}, status=status.HTTP_200_OK)


class CheckinTokenCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Admin access required")

        serializer = CheckinTokenCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        from datetime import datetime, timedelta

        expires_in = int(payload.get('expires_in_minutes', 10))
        if expires_in < 1:
            expires_in = 1
        if expires_in > 60:
            expires_in = 60

        expires_at = datetime.utcnow() + timedelta(minutes=expires_in)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into checkin_tokens (event_id, scope, expires_at)
                values (%s, 'service', %s)
                returning id, expires_at
                """,
                [str(payload['event_id']), expires_at],
            )
            row = cursor.fetchone()

        return Response(
            {
                "id": str(row[0]),
                "expires_at": row[1].isoformat() if row[1] else None,
            },
            status=status.HTTP_201_CREATED,
        )


class CheckinTokenDetailView(APIView):
    permission_classes = []

    def get(self, request, token_id):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select t.id, t.event_id, t.scope, t.expires_at, t.used_at,
                       e.name, e.date, e.time, e.location
                from checkin_tokens t
                join events e on e.id = t.event_id
                where t.id = %s
                """,
                [str(token_id)],
            )
            row = cursor.fetchone()

        if not row:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        from datetime import datetime

        expires_at = to_naive(row[3])
        if not expires_at or expires_at <= datetime.utcnow():
            return Response({"detail": "Token expired"}, status=status.HTTP_410_GONE)

        return Response(
            {
                "id": str(row[0]),
                "event_id": str(row[1]),
                "scope": row[2],
                "expires_at": row[3].isoformat() if row[3] else None,
                "used_at": row[4].isoformat() if row[4] else None,
                "event": {
                    "id": str(row[1]),
                    "name": row[5],
                    "date": row[6].isoformat() if row[6] else None,
                    "time": row[7],
                    "location": row[8],
                },
            },
            status=status.HTTP_200_OK,
        )


class QrAttendanceSubmitView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = QrAttendanceSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        token_id = str(payload['token_id'])

        from datetime import datetime

        with connection.cursor() as cursor:
            cursor.execute(
                """
                select t.event_id, t.expires_at
                from checkin_tokens t
                where t.id = %s
                """,
                [token_id],
            )
            row = cursor.fetchone()
            if not row:
                return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

            event_id = str(row[0])
            expires_at = to_naive(row[1])
            if not expires_at or expires_at <= datetime.utcnow():
                return Response({"detail": "Token expired"}, status=status.HTTP_410_GONE)

        attendee_type = payload.get('attendee_type', 'guest')
        if attendee_type == 'guest':
            guest_full_name = payload.get('guest_full_name') or 'Guest'
            guest_phone = payload.get('guest_phone')
            guest_email = payload.get('guest_email')
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into attendance_records
                      (event_id, attendee_type, guest_full_name, guest_phone, guest_email, status, checkin_method, notes)
                    values
                      (%s, 'guest', %s, %s, %s, 'present', 'qr', 'QR guest check-in')
                    returning id
                    """,
                    [event_id, guest_full_name, guest_phone, guest_email],
                )
                rid = cursor.fetchone()[0]
            return Response({"id": str(rid)}, status=status.HTTP_201_CREATED)

        member_id = payload.get('member_id')
        if not member_id:
            return Response({"detail": "member_id required"}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute("select date, time from events where id = %s", [event_id])
            erow = cursor.fetchone()
        status_value = 'present'
        if erow:
            dt = f"{erow[0].isoformat()}T{erow[1] or '00:00'}"
            from datetime import datetime, timedelta

            try:
                start = datetime.fromisoformat(dt)
                now = datetime.utcnow()
                status_value = 'late' if now > start + timedelta(minutes=10) else 'present'
            except Exception:
                status_value = 'present'

        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    insert into attendance_records
                      (event_id, attendee_type, member_id, status, checkin_method)
                    values
                      (%s, 'member', %s, %s, 'qr')
                    returning id
                    """,
                    [event_id, str(member_id), status_value],
                )
                rid = cursor.fetchone()[0]
            except Exception:
                cursor.execute(
                    """
                    update attendance_records
                    set status = %s, checkin_method = 'qr', checked_in_at = now(), updated_at = now()
                    where event_id = %s and member_id = %s
                    returning id
                    """,
                    [status_value, event_id, str(member_id)],
                )
                row = cursor.fetchone()
                if not row:
                    raise
                rid = row[0]

        return Response({"id": str(rid)}, status=status.HTTP_201_CREATED)


class GuestAttendanceSubmitView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = AttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        event_id = str(payload['event_id'])
        guest_full_name = payload.get('guest_full_name')
        if not guest_full_name:
            return Response({"detail": "guest_full_name required"}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into attendance_records
                  (event_id, attendee_type, guest_full_name, guest_phone, guest_email, status, checkin_method, notes)
                values
                  (%s, 'guest', %s, %s, %s, 'present', 'manual', 'Guest attendance')
                returning id
                """,
                [
                    event_id,
                    guest_full_name,
                    payload.get('guest_phone'),
                    payload.get('guest_email'),
                ],
            )
            rid = cursor.fetchone()[0]

        return Response({"id": str(rid)}, status=status.HTTP_201_CREATED)
