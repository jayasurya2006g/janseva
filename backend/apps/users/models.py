from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    CITIZEN = 'citizen'
    OFFICER = 'officer'
    ROLE_CHOICES = [
        (CITIZEN, 'Citizen'),
        (OFFICER, 'Officer'),
    ]

    role  = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CITIZEN)
    phone = models.CharField(max_length=15, blank=True)

    # Admins: is_staff=True, is_superuser=True  (created via createsuperuser)
    # Officers: role='officer', is_staff=False   (created by admin via API)
    # Citizens: role='citizen', is_staff=False   (self-register)

    def __str__(self):
        return f'{self.username} ({self.role})'
