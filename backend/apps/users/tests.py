from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class UserEndpointTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            username="citizen",
            email="citizen@example.com",
            password="CitizenPass123",
            phone="9876543210",
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
            is_superuser=True,
        )

    def authenticate(self, user):
        response = self.client.post(
            reverse("users-login"),
            {
                "email": user.email,
                "password": (
                    "AdminPass123"
                    if user == self.admin
                    else "CitizenPass123" if user == self.citizen else "OfficerPass123"
                ),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['tokens']['access']}"
        )
        return response.data["tokens"]

    def test_register_creates_citizen_in_database(self):
        response = self.client.post(
            reverse("users-register"),
            {
                "username": "newcitizen",
                "email": "newcitizen@example.com",
                "password": "NewCitizen123",
                "phone": "9123456789",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newcitizen@example.com").exists())
        self.assertEqual(
            User.objects.get(email="newcitizen@example.com").role, User.CITIZEN
        )

    def test_login_and_token_refresh_routes(self):
        response = self.client.post(
            reverse("users-login"),
            {"email": self.citizen.email, "password": "CitizenPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        refresh_response = self.client.post(
            reverse("token_refresh"),
            {"refresh": response.data["tokens"]["refresh"]},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

    def test_profile_update_and_logout_routes(self):
        tokens = self.authenticate(self.citizen)
        profile = self.client.get(reverse("users-profile"))
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["email"], self.citizen.email)

        update = self.client.patch(
            reverse("users-update-profile"),
            {"username": "updated-citizen", "phone": "9000000000"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertEqual(self.citizen.username, "updated-citizen")
        self.assertEqual(self.citizen.phone, "9000000000")

        logout = self.client.post(
            reverse("users-logout"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(logout.status_code, status.HTTP_200_OK)

    def test_admin_routes_manage_officer_database_state(self):
        self.authenticate(self.admin)
        create_response = self.client.post(
            reverse("admin-create-officer"),
            {
                "username": "new-officer",
                "email": "new-officer@example.com",
                "password": "NewOfficer123",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        officer = User.objects.get(email="new-officer@example.com")
        self.assertEqual(officer.role, User.OFFICER)

        list_response = self.client.get(reverse("admin-list-officers"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 2)

        deactivate = self.client.patch(
            reverse("admin-deactivate-officer", args=[officer.id]), format="json"
        )
        self.assertEqual(deactivate.status_code, status.HTTP_200_OK)
        officer.refresh_from_db()
        self.assertFalse(officer.is_active)

        activate = self.client.patch(
            reverse("admin-activate-officer", args=[officer.id]), format="json"
        )
        self.assertEqual(activate.status_code, status.HTTP_200_OK)
        officer.refresh_from_db()
        self.assertTrue(officer.is_active)

        reset = self.client.patch(
            reverse("admin-reset-officer-password", args=[officer.id]),
            {"password": "ResetOfficer123"},
            format="json",
        )
        self.assertEqual(reset.status_code, status.HTTP_200_OK)
        officer.refresh_from_db()
        self.assertTrue(officer.check_password("ResetOfficer123"))

    def test_admin_routes_require_staff(self):
        self.authenticate(self.citizen)
        response = self.client.get(reverse("admin-list-officers"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_routes_require_authentication(self):
        for route_name, method in [
            ("users-profile", self.client.get),
            ("users-update-profile", self.client.patch),
            ("users-logout", self.client.post),
        ]:
            response = (
                method(reverse(route_name), {}, format="json")
                if method != self.client.get
                else method(reverse(route_name))
            )
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
