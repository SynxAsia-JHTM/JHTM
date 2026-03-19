from django.urls import path
from .views import LoginView, MyPrayerRequestsView, PrayerRequestsView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('prayer-requests/', PrayerRequestsView.as_view(), name='prayer-requests'),
    path('prayer-requests/me/', MyPrayerRequestsView.as_view(), name='my-prayer-requests'),
]
