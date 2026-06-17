from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer, OfficerCreateSerializer, CitizenRegisterSerializer
from .permissions import IsAdminUser


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


class UserViewSet(viewsets.ViewSet):
    """Handles citizen registration, login, profile, and logout."""

    def get_permissions(self):
        if self.action in ['register', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = CitizenRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Registered successfully',
                'tokens':  get_tokens(user),
                'role':    user.role,
                'user':    UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user_obj.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user_obj.is_active:
            return Response({'error': 'Account is deactivated. Contact admin.'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'message':  'Login successful',
            'tokens':   get_tokens(user_obj),
            'role':     user_obj.role,
            'is_admin': user_obj.is_staff,
            'user':     UserSerializer(user_obj).data,
        })

    @action(detail=False, methods=['get'])
    def profile(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        allowed_fields = {'username', 'phone'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = UserSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class AdminViewSet(viewsets.ViewSet):
    """Admin-only: manage officers and view stats."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=False, methods=['post'], url_path='create-officer')
    def create_officer(self, request):
        serializer = OfficerCreateSerializer(data=request.data)
        if serializer.is_valid():
            officer = serializer.save()
            return Response({
                'message': f'Officer account created for {officer.username}',
                'officer': UserSerializer(officer).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='officers')
    def list_officers(self, request):
        officers = User.objects.filter(role='officer').order_by('username')
        return Response(UserSerializer(officers, many=True).data)

    @action(detail=True, methods=['patch'], url_path='deactivate')
    def deactivate_officer(self, request, pk=None):
        try:
            officer = User.objects.get(id=pk, role='officer')
            officer.is_active = False
            officer.save()
            return Response({'message': f'{officer.username} has been deactivated.'})
        except User.DoesNotExist:
            return Response({'error': 'Officer not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], url_path='activate')
    def activate_officer(self, request, pk=None):
        try:
            officer = User.objects.get(id=pk, role='officer')
            officer.is_active = True
            officer.save()
            return Response({'message': f'{officer.username} has been activated.'})
        except User.DoesNotExist:
            return Response({'error': 'Officer not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], url_path='reset-password')
    def reset_officer_password(self, request, pk=None):
        try:
            officer = User.objects.get(id=pk, role='officer')
            new_password = request.data.get('password')
            if not new_password or len(new_password) < 8:
                return Response({'error': 'Password must be at least 8 characters.'},
                                status=status.HTTP_400_BAD_REQUEST)
            officer.set_password(new_password)
            officer.save()
            return Response({'message': 'Password reset successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'Officer not found.'}, status=status.HTTP_404_NOT_FOUND)
