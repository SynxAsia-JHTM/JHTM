from django.urls import path
from .views import (
    LoginView, 
    MyPrayerRequestsView, 
    PrayerRequestDetailView, 
    PrayerRequestsView,
    SystemSettingsView,
    UserManagementListView,
    UserManagementDetailView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
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
