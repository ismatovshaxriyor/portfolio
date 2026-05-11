from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views import View

from .services import ServerMonitorService


def _authorized(request: HttpRequest) -> bool:
    token = str(getattr(settings, "SERVER_MONITOR", {}).get("HEALTH_TOKEN", "")).strip()
    if not token:
        return True

    header_token = str(request.headers.get("X-Server-Monitor-Token", "")).strip()
    query_token = str(request.GET.get("token", "")).strip()
    return header_token == token or query_token == token


class ServerMonitorHealthView(View):
    http_method_names = ["get", "head", "options"]

    def get(self, request: HttpRequest) -> JsonResponse:
        if not _authorized(request):
            return JsonResponse({"detail": "Forbidden"}, status=403)

        report = ServerMonitorService().run(notify=False, persist_state=False)
        status_code = 200 if report.status == "ok" else 503
        return JsonResponse(report.to_dict(), status=status_code)
