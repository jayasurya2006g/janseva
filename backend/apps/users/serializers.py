from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['role', 'is_staff', 'is_active', 'date_joined']


class OfficerCreateSerializer(serializers.ModelSerializer):
    """Used exclusively by admin to create officer accounts."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'phone', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role     = User.OFFICER
        user.is_staff = False
        user.save()
        return user


class CitizenRegisterSerializer(serializers.ModelSerializer):
    """Used by citizens for self-registration."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'phone', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = User.CITIZEN
        user.save()
        return user
