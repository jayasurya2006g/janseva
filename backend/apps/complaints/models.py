from django.db import models
from django.conf import settings


class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('active',   'Active'),
        ('resolved', 'Resolved'),
        ('closed',   'Closed'),
        ('rejected', 'Rejected'),
    ]
    CATEGORY_CHOICES = [
        ('roads',       'Roads & Potholes'),
        ('water',       'Water Supply'),
        ('sanitation',  'Sanitation'),
        ('electricity', 'Electricity'),
        ('other',       'Other'),
    ]

    citizen        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaints'
    )
    title          = models.CharField(max_length=200)
    description    = models.TextField()
    category       = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    location       = models.CharField(max_length=300)
    ward           = models.CharField(max_length=100, blank=True)
    image          = models.ImageField(upload_to='complaints/images/', blank=True, null=True)
    document       = models.FileField(upload_to='complaints/documents/', blank=True, null=True)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_complaints'
    )
    officer_remark = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} [{self.status}]'


class StatusLog(models.Model):
    complaint  = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='logs')
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    remark     = models.TextField(blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.complaint.title}: {self.old_status} → {self.new_status}'
