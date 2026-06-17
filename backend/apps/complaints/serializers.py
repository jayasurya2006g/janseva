from rest_framework import serializers
from .models import Complaint, StatusLog


class StatusLogSerializer(serializers.ModelSerializer):
    changed_by = serializers.StringRelatedField()

    class Meta:
        model  = StatusLog
        fields = ['id', 'changed_by', 'old_status', 'new_status', 'remark', 'timestamp']


class ComplaintSerializer(serializers.ModelSerializer):
    citizen     = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    logs        = StatusLogSerializer(many=True, read_only=True)
    image       = serializers.ImageField(required=False, allow_null=True)
    document    = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = Complaint
        fields = '__all__'
        read_only_fields = [
            'citizen', 'status', 'assigned_to',
            'officer_remark', 'created_at', 'updated_at'
        ]

    def validate_image(self, value):
        if value:
            allowed = ['image/jpeg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed:
                raise serializers.ValidationError('Only JPEG, PNG, and WebP images are allowed.')
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('Image must be under 5 MB.')
        return value

    def validate_document(self, value):
        if value:
            if hasattr(value, 'content_type') and value.content_type != 'application/pdf':
                raise serializers.ValidationError('Only PDF documents are allowed.')
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError('Document must be under 10 MB.')
        return value

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            rep['image'] = request.build_absolute_uri(instance.image.url)
        if instance.document and request:
            rep['document'] = request.build_absolute_uri(instance.document.url)
        return rep
