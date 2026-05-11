from django.urls import path

from .views import ServerMonitorHealthView

urlpatterns = [
    path("api/server-monitor/health/", ServerMonitorHealthView.as_view(), name="server-monitor-health"),
]
