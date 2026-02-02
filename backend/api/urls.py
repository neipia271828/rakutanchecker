from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import CourseViewSet, RegisterView, EventViewSet, CurrentUserView

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', obtain_auth_token, name='api_token_auth'),
    path('login/', obtain_auth_token, name='api_token_auth_login'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('', include(router.urls)),
]
