from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle


class _SafeThrottleMixin:
    def allow_request(self, request, view) -> bool:  # type: ignore[override]
        try:
            return super().allow_request(request, view)  # type: ignore[misc]
        except Exception:
            # Fail open when cache backend is temporarily unavailable.
            return True

    def wait(self):  # type: ignore[override]
        try:
            return super().wait()  # type: ignore[misc]
        except Exception:
            return None


class SafeAnonRateThrottle(_SafeThrottleMixin, AnonRateThrottle):
    pass


class SafeUserRateThrottle(_SafeThrottleMixin, UserRateThrottle):
    pass


class SafeScopedRateThrottle(_SafeThrottleMixin, ScopedRateThrottle):
    pass
