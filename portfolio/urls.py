from django.urls import path
from . import views
from .api_views import (
    ContactCreateAPIView,
    FeedbackCreateAPIView,
    HealthAPIView,
    ProjectListAPIView,
    SkillGroupListAPIView,
)

urlpatterns = [
    path('', views.index, name='index'),
    path('api/health/', HealthAPIView.as_view(), name='api-health'),
    path('api/projects/', ProjectListAPIView.as_view(), name='api-projects'),
    path('api/skills/', SkillGroupListAPIView.as_view(), name='api-skills'),
    path('api/contact/', ContactCreateAPIView.as_view(), name='api-contact'),
    path('api/feedback/', FeedbackCreateAPIView.as_view(), name='api-feedback'),
]
