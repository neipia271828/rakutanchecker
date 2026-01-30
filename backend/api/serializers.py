from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Course, EvalNode, EvalEntry, Threshold
from .services import CalculationService

class CourseSerializer(serializers.ModelSerializer):
    summary = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'year', 'term', 'is_required', 'created_at', 'updated_at', 'summary']

    def get_summary(self, obj):
        user = self.context['request'].user
        # We need to import CalculationService here to avoid circular import if it was at top level
        # safely (though services.py imports models, models doesn't import services)
        # But serializers imports services. It should be fine.
        return CalculationService.get_course_summary(obj, user)

class EvalNodeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = EvalNode
        fields = ['id', 'course', 'parent', 'name', 'weight', 'input_type', 'is_leaf', 'order', 'children', 'due_date']
        read_only_fields = ['children']

    def get_children(self, obj):
        children = obj.children.all().order_by('order')
        return EvalNodeSerializer(children, many=True).data

class EvalNodeFlatSerializer(serializers.ModelSerializer):
    """Serializer for flat list operations if needed"""
    class Meta:
        model = EvalNode
        fields = '__all__'

class EvalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = EvalEntry
        fields = ['id', 'user', 'node', 'earned', 'max', 'rate', 'attended', 'total', 'adjustment', 'status', 'updated_at']
        read_only_fields = ['user', 'updated_at'] 
        # user will be set in view

    def validate(self, data):
        # Validate that node belongs to the course in context if needed, 
        # but here we just get node ID.
        # Ensure node is leaf is handled by model clean(), but good to have here too so DRF returns 400.
        node = data.get('node')
        if node and not node.is_leaf:
             raise serializers.ValidationError("Entries can only be created for leaf nodes.")
        return data

class CourseSummarySerializer(serializers.Serializer):
    current_score = serializers.FloatField()
    predicted_score = serializers.FloatField()
    max_score = serializers.FloatField()
    deficit = serializers.FloatField()
    is_fail_predicted = serializers.BooleanField()
    is_certain_fail = serializers.BooleanField()
    is_certain_fail = serializers.BooleanField()
    threshold = serializers.FloatField()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class EventSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = EvalNode
        fields = ['id', 'name', 'course_name', 'due_date', 'input_type', 'weight']
