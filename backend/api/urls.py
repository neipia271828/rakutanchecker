from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, RegisterView, EventViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]
