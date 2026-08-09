from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import Complaint, StatusLog


class ComplaintEndpointTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            username="citizen", email="citizen@example.com", password="CitizenPass123"
        )
        self.other_citizen = User.objects.create_user(
            username="other-citizen", email="other@example.com", password="OtherPass123"
        )
        self.officer = User.objects.create_user(
            username="officer",
            email="officer@example.com",
            password="OfficerPass123",
            role=User.OFFICER,
        )
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="AdminPass123",
            is_staff=True,
        )
        self.complaint = self.create_complaint(self.citizen)

    def create_complaint(self, citizen, **overrides):
        values = {
            "citizen": citizen,
            "title": "Broken streetlight",
            "description": "The streetlight has stopped working.",
            "category": "electricity",
            "location": "Ward 4",
            "ward": "4",
        }
        values.update(overrides)
        return Complaint.objects.create(**values)

    def authenticate(self, user):
        passwords = {
            self.citizen: "CitizenPass123",
            self.other_citizen: "OtherPass123",
            self.officer: "OfficerPass123",
            self.admin: "AdminPass123",
        }
        response = self.client.post(
            reverse("users-login"),
            {"email": user.email, "password": passwords[user]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['tokens']['access']}"
        )

    def test_complaint_crud_routes_and_database(self):
        self.authenticate(self.citizen)
        list_response = self.client.get(reverse("complaints-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data["count"], 1)

        create_response = self.client.post(
            reverse("complaints-list"),
            {
                "title": "Blocked drain",
                "description": "Drain is blocked after rain.",
                "category": "sanitation",
                "location": "Ward 5",
                "ward": "5",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created = Complaint.objects.get(title="Blocked drain")
        self.assertEqual(created.citizen, self.citizen)

        detail_response = self.client.get(
            reverse("complaints-detail", args=[created.id])
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        patch_response = self.client.patch(
            reverse("complaints-detail", args=[created.id]),
            {"ward": "6"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        created.refresh_from_db()
        self.assertEqual(created.ward, "6")

        delete_response = self.client.delete(
            reverse("complaints-detail", args=[created.id])
        )
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Complaint.objects.filter(id=created.id).exists())

    def test_track_and_withdraw_create_status_log(self):
        self.authenticate(self.citizen)
        track_response = self.client.get(
            reverse("complaints-track", args=[self.complaint.id])
        )
        self.assertEqual(track_response.status_code, status.HTTP_200_OK)
        self.assertEqual(track_response.data["complaint"]["id"], self.complaint.id)
        self.assertEqual(track_response.data["history"], [])

        withdraw_response = self.client.post(
            reverse("complaints-withdraw", args=[self.complaint.id]), format="json"
        )
        self.assertEqual(withdraw_response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, "closed")
        self.assertEqual(StatusLog.objects.filter(complaint=self.complaint).count(), 1)

    def test_assign_and_update_status_create_logs(self):
        self.authenticate(self.admin)
        assign_response = self.client.patch(
            reverse("complaints-assign-complaint", args=[self.complaint.id]),
            {"officer_id": self.officer.id},
            format="json",
        )
        self.assertEqual(assign_response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.assigned_to, self.officer)
        self.assertEqual(self.complaint.status, "active")

        self.authenticate(self.officer)
        update_response = self.client.patch(
            reverse("complaints-update-status", args=[self.complaint.id]),
            {"status": "resolved", "remark": "Repair completed."},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, "resolved")
        self.assertEqual(StatusLog.objects.filter(complaint=self.complaint).count(), 2)

    def test_stats_route_returns_database_counts(self):
        self.authenticate(self.admin)
        self.create_complaint(self.citizen, status="resolved")
        response = self.client.get(reverse("complaints-admin-stats"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["pending"], 1)
        self.assertEqual(response.data["resolved"], 1)
        self.assertEqual(response.data["total_officers"], 1)

    def test_complaint_permissions_and_authentication(self):
        self.authenticate(self.other_citizen)
        track_response = self.client.get(
            reverse("complaints-track", args=[self.complaint.id])
        )
        self.assertEqual(track_response.status_code, status.HTTP_404_NOT_FOUND)
        assign_response = self.client.patch(
            reverse("complaints-assign-complaint", args=[self.complaint.id]),
            {"officer_id": self.officer.id},
            format="json",
        )
        self.assertEqual(assign_response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.credentials()
        list_response = self.client.get(reverse("complaints-list"))
        self.assertEqual(list_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_standard_complaint_routes_are_registered(self):
        self.authenticate(self.citizen)
        for route_name in ["complaints-list", "complaints-detail"]:
            args = [self.complaint.id] if route_name.endswith("detail") else []
            response = self.client.options(reverse(route_name, args=args))
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class ComplaintModelTests(APITestCase):
    def test_citizen_delete_cascades_complaints_and_logs(self):
        citizen = User.objects.create_user(
            username="delete-me", email="delete@example.com", password="DeletePass123"
        )
        complaint = Complaint.objects.create(
            citizen=citizen,
            title="Water leak",
            description="Water is leaking.",
            category="water",
            location="Ward 1",
        )
        StatusLog.objects.create(
            complaint=complaint,
            changed_by=citizen,
            old_status="pending",
            new_status="closed",
        )
        citizen.delete()
        self.assertFalse(Complaint.objects.filter(id=complaint.id).exists())
        self.assertFalse(StatusLog.objects.filter(complaint_id=complaint.id).exists())
