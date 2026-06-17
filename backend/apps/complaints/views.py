from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.models import User
from apps.users.permissions import IsOfficer, IsAdminUser
from .models import Complaint, StatusLog
from .serializers import ComplaintSerializer, StatusLogSerializer


class ComplaintViewSet(viewsets.ModelViewSet):
    serializer_class   = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'category', 'ward']
    search_fields      = ['title', 'description', 'location']
    ordering_fields    = ['created_at', 'status']
    ordering           = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Complaint.objects.select_related('citizen', 'assigned_to').all()
        if user.role == 'officer':
            return Complaint.objects.filter(assigned_to=user).select_related('citizen')
        return Complaint.objects.filter(citizen=user)

    def get_permissions(self):
        if self.action == 'update_status':
            return [IsAuthenticated(), IsOfficer()]
        if self.action in ['assign_complaint', 'admin_stats', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        if self.request.user.role != 'citizen':
            raise PermissionDenied('Only citizens can submit complaints.')
        serializer.save(citizen=self.request.user)

    # ── PATCH /complaints/{id}/update-status/  — officer only ────────────────
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        complaint_obj = self.get_object()

        if complaint_obj.assigned_to != request.user:
            return Response(
                {'error': 'You can only update complaints assigned to you.'},
                status=status.HTTP_403_FORBIDDEN
            )

        valid_statuses = ['active', 'resolved', 'rejected']
        new_status = request.data.get('status')
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Officers can set status to: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status             = complaint_obj.status
        remark                 = request.data.get('remark', '')
        complaint_obj.status   = new_status
        complaint_obj.officer_remark = remark
        complaint_obj.save()

        StatusLog.objects.create(
            complaint  = complaint_obj,
            changed_by = request.user,
            old_status = old_status,
            new_status = new_status,
            remark     = remark,
        )
        return Response({
            'message':   'Status updated successfully.',
            'complaint': ComplaintSerializer(complaint_obj, context={'request': request}).data,
        })

    # ── PATCH /complaints/{id}/assign/  — admin only ──────────────────────────
    @action(detail=True, methods=['patch'], url_path='assign')
    def assign_complaint(self, request, pk=None):
        officer_id = request.data.get('officer_id')
        if not officer_id:
            return Response({'error': 'officer_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            complaint_obj = self.get_object()
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            officer = User.objects.get(id=officer_id, role='officer', is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'Active officer not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_status            = complaint_obj.status
        complaint_obj.assigned_to = officer
        complaint_obj.status  = 'active'
        complaint_obj.save()

        StatusLog.objects.create(
            complaint  = complaint_obj,
            changed_by = request.user,
            old_status = old_status,
            new_status = 'active',
            remark     = f'Assigned to officer {officer.username} by admin.',
        )
        return Response({
            'message':   f'Complaint assigned to {officer.username}.',
            'complaint': ComplaintSerializer(complaint_obj, context={'request': request}).data,
        })

    # ── GET /complaints/{id}/track/  — citizen tracks their complaint ─────────
    @action(detail=True, methods=['get'], url_path='track')
    def track(self, request, pk=None):
        complaint_obj = self.get_object()
        if (complaint_obj.citizen != request.user
                and request.user.role != 'officer'
                and not request.user.is_staff):
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        logs = complaint_obj.logs.all()
        return Response({
            'complaint': ComplaintSerializer(complaint_obj, context={'request': request}).data,
            'history':   StatusLogSerializer(logs, many=True).data,
        })

    # ── POST /complaints/{id}/withdraw/  — citizen withdraws pending ──────────
    @action(detail=True, methods=['post'], url_path='withdraw')
    def withdraw(self, request, pk=None):
        complaint_obj = self.get_object()
        if complaint_obj.citizen != request.user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        if complaint_obj.status != 'pending':
            return Response(
                {'error': 'Only pending complaints can be withdrawn.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        complaint_obj.status = 'closed'
        complaint_obj.save()
        StatusLog.objects.create(
            complaint  = complaint_obj,
            changed_by = request.user,
            old_status = 'pending',
            new_status = 'closed',
            remark     = 'Withdrawn by citizen.',
        )
        return Response({'message': 'Complaint withdrawn successfully.'})

    # ── GET /complaints/stats/  — admin dashboard stats ──────────────────────
    @action(detail=False, methods=['get'], url_path='stats')
    def admin_stats(self, request):
        qs = Complaint.objects.all()
        officers = User.objects.filter(role='officer', is_active=True)
        return Response({
            'total':          qs.count(),
            'pending':        qs.filter(status='pending').count(),
            'active':         qs.filter(status='active').count(),
            'resolved':       qs.filter(status='resolved').count(),
            'rejected':       qs.filter(status='rejected').count(),
            'closed':         qs.filter(status='closed').count(),
            'unassigned':     qs.filter(assigned_to=None).count(),
            'total_officers': officers.count(),
        })
