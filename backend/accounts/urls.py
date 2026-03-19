from django.urls import path
from .views import (
    LoginView, 
    MembersListView,
    MembersMeView,
    MemberDetailView,
    EventsListCreateView,
    EventDetailView,
    EventRegisterView,
    AttendanceListCreateView,
    MyAttendanceView,
    AttendanceDetailView,
    CheckinTokenCreateView,
    CheckinTokenDetailView,
    QrAttendanceSubmitView,
    GuestAttendanceSubmitView,
    MyPrayerRequestsView, 
    PrayerRequestDetailView, 
    PrayerRequestsView,
    SystemSettingsView,
    UserManagementListView,
    UserManagementDetailView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),

    path('members/', MembersListView.as_view(), name='members-list'),
    path('members/me/', MembersMeView.as_view(), name='members-me'),
    path('members/<uuid:member_id>/', MemberDetailView.as_view(), name='member-detail'),

    path('events/', EventsListCreateView.as_view(), name='events-list-create'),
    path('events/<uuid:event_id>/', EventDetailView.as_view(), name='events-detail'),
    path('events/<uuid:event_id>/register/', EventRegisterView.as_view(), name='events-register'),

    path('attendance/', AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('attendance/me/', MyAttendanceView.as_view(), name='attendance-me'),
    path('attendance/<uuid:attendance_id>/', AttendanceDetailView.as_view(), name='attendance-detail'),

    path('attendance/tokens/', CheckinTokenCreateView.as_view(), name='attendance-token-create'),
    path('attendance/tokens/<uuid:token_id>/', CheckinTokenDetailView.as_view(), name='attendance-token-detail'),
    path('attendance/qr/', QrAttendanceSubmitView.as_view(), name='attendance-qr-submit'),
    path('attendance/guest/', GuestAttendanceSubmitView.as_view(), name='attendance-guest-submit'),

    path('prayer-requests/', PrayerRequestsView.as_view(), name='prayer-requests'),
    path('prayer-requests/me/', MyPrayerRequestsView.as_view(), name='my-prayer-requests'),
    path(
        'prayer-requests/<uuid:prayer_request_id>/',
        PrayerRequestDetailView.as_view(),
        name='prayer-request-detail',
    ),
    path('settings/', SystemSettingsView.as_view(), name='system-settings'),
    path('users/', UserManagementListView.as_view(), name='user-management-list'),
    path('users/<int:user_id>/', UserManagementDetailView.as_view(), name='user-management-detail'),
]
