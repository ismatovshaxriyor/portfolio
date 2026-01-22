from django.contrib import admin
from django.templatetags.static import static
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("portfolio.urls")),
    path('favicon.ico', RedirectView.as_view(url=static('images/favicon.ico')), name='favicon'),
    path('favicon.ico/', RedirectView.as_view(url=static('images/favicon.ico'))),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
