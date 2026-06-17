from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AdminViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')
router.register('admin', AdminViewSet, basename='admin')

urlpatterns = [
    path('', include(router.urls)),
]
