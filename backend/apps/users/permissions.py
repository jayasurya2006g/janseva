from rest_framework.permissions import BasePermission


class IsOfficer(BasePermission):
    message = 'Only officers can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'officer'
        )


class IsAdminUser(BasePermission):
    message = 'Only admins can perform this action.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class IsCitizen(BasePermission):
    message = 'Only citizens can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'citizen'
        )
