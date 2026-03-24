from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.templatetags.static import static as static_file

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("portfolio.urls")),
    path('favicon.ico', RedirectView.as_view(url=static_file('images/favicon.ico')), name='favicon'),
    path('favicon.ico/', RedirectView.as_view(url=static_file('images/favicon.ico'))),
]
