from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Course, CourseEnrollment, EvalNode, EvalEntry, Threshold, UserProfile

User = get_user_model()
from .services import CalculationService
import json
import os

# #region agent log
LOG_PATH = '/Users/suzukiakiramuki/playground/rakutanchecker/.cursor/debug.log'
def _log_debug(location, message, data, hypothesis_id=None):
    try:
        with open(LOG_PATH, 'a') as f:
            log_entry = {
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': hypothesis_id,
                'location': location,
                'message': message,
                'data': data,
                'timestamp': int(__import__('time').time() * 1000)
            }
            f.write(json.dumps(log_entry) + '\n')
    except Exception:
        pass
# #endregion


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for student's course enrollment"""
    class Meta:
        model = CourseEnrollment
        fields = ['id', 'user', 'course', 'attendance_mask', 'enrolled_at', 'updated_at']
        read_only_fields = ['user', 'enrolled_at', 'updated_at']


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for course template"""
    summary = serializers.SerializerMethodField()
    attendance_mask = serializers.SerializerMethodField()
    enrollment_id = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'year', 'term', 'is_required', 'total_classes', 'target_enrollment_year', 
                  'attendance_mask', 'enrollment_id', 'created_at', 'updated_at', 'summary']
        read_only_fields = ['created_at', 'updated_at']

    def get_enrollment_id(self, obj):
        """Get the enrollment ID for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = CourseEnrollment.objects.filter(user=request.user, course=obj).first()
            return enrollment.id if enrollment else None
        return None

    def get_attendance_mask(self, obj):
        """Get attendance mask from user's enrollment"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = CourseEnrollment.objects.filter(user=request.user, course=obj).first()
            return enrollment.attendance_mask if enrollment else 0
        return 0

    def get_summary(self, obj):
        user = self.context['request'].user
        # Get or create enrollment for this user
        enrollment, _ = CourseEnrollment.objects.get_or_create(user=user, course=obj)
        return CalculationService.get_course_summary(obj, user, enrollment)

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
    attendance_rate = serializers.FloatField()
    current_attended = serializers.IntegerField()
    threshold = serializers.FloatField()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='profile.full_name', read_only=True)
    student_id = serializers.CharField(source='profile.student_id', read_only=True)
    date_of_birth = serializers.DateField(source='profile.date_of_birth', read_only=True)
    enrollment_year = serializers.IntegerField(source='profile.enrollment_year', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'student_id', 'date_of_birth', 'enrollment_year', 'is_staff']
        read_only_fields = ['is_staff']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=True)
    student_id = serializers.CharField(write_only=True, required=True)
    date_of_birth = serializers.DateField(write_only=True, required=True)
    enrollment_year = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'full_name', 'student_id', 'date_of_birth', 'enrollment_year']
        read_only_fields = ['id']

    def create(self, validated_data):
        # #region agent log
        _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー登録開始', {
            'username': validated_data.get('username'),
            'has_full_name': 'full_name' in validated_data,
            'has_student_id': 'student_id' in validated_data,
            'has_date_of_birth': 'date_of_birth' in validated_data,
            'has_enrollment_year': 'enrollment_year' in validated_data
        }, 'H1')
        # #endregion
        
        # Extract profile data
        full_name = validated_data.pop('full_name')
        student_id = validated_data.pop('student_id')
        date_of_birth = validated_data.pop('date_of_birth')
        enrollment_year = validated_data.pop('enrollment_year')
        
        # #region agent log
        _log_debug('serializers.py:RegisterSerializer.create', 'プロファイルデータ抽出完了', {
            'full_name': full_name,
            'student_id': student_id,
            'date_of_birth': str(date_of_birth) if date_of_birth else None,
            'enrollment_year': enrollment_year
        }, 'H1')
        # #endregion
        
        # Create user
        # #region agent log
        _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー作成開始', {
            'username': validated_data['username'],
            'email': validated_data.get('email', '')
        }, 'H1')
        # #endregion
        
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=validated_data['password']
            )
            # #region agent log
            _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー作成完了', {
                'user_id': user.id,
                'username': user.username
            }, 'H1')
            # #endregion
        except Exception as e:
            # #region agent log
            _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー作成エラー', {
                'error': str(e),
                'error_type': type(e).__name__
            }, 'H1')
            # #endregion
            raise
        
        # Create profile
        # #region agent log
        _log_debug('serializers.py:RegisterSerializer.create', 'プロファイル作成開始', {
            'user_id': user.id,
            'full_name': full_name,
            'student_id': student_id,
            'date_of_birth': str(date_of_birth) if date_of_birth else None,
            'enrollment_year': enrollment_year
        }, 'H1')
        # #endregion
        
        try:
            profile = UserProfile.objects.create(
                user=user,
                full_name=full_name,
                student_id=student_id,
                date_of_birth=date_of_birth,
                enrollment_year=enrollment_year
            )
            # #region agent log
            _log_debug('serializers.py:RegisterSerializer.create', 'プロファイル作成完了', {
                'profile_id': profile.id,
                'user_id': profile.user.id
            }, 'H1')
            # #endregion
        except Exception as e:
            # #region agent log
            _log_debug('serializers.py:RegisterSerializer.create', 'プロファイル作成エラー', {
                'error': str(e),
                'error_type': type(e).__name__,
                'user_id': user.id
            }, 'H1')
            # #endregion
            # ユーザーは作成済みなので削除
            try:
                user.delete()
                # #region agent log
                _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー削除完了（ロールバック）', {'user_id': user.id}, 'H1')
                # #endregion
            except Exception as delete_error:
                # #region agent log
                _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー削除エラー', {
                    'error': str(delete_error),
                    'user_id': user.id
                }, 'H1')
                # #endregion
            raise
        
        # #region agent log
        _log_debug('serializers.py:RegisterSerializer.create', 'ユーザー登録完了', {
            'user_id': user.id,
            'username': user.username
        }, 'H1')
        # #endregion
        
        return user
    
    def to_representation(self, instance):
        # #region agent log
        _log_debug('serializers.py:RegisterSerializer.to_representation', 'レスポンス生成開始', {
            'user_id': instance.id,
            'username': instance.username
        }, 'H1')
        # #endregion
        
        # Return only basic user fields, not profile fields
        # Profile fields are write_only and should not be in response
        try:
            result = {
                'id': instance.id,
                'username': instance.username,
                'email': instance.email
            }
            # #region agent log
            _log_debug('serializers.py:RegisterSerializer.to_representation', 'レスポンス生成完了', {
                'user_id': instance.id,
                'result': result
            }, 'H1')
            # #endregion
            return result
        except Exception as e:
            # #region agent log
            _log_debug('serializers.py:RegisterSerializer.to_representation', 'レスポンス生成エラー', {
                'error': str(e),
                'error_type': type(e).__name__,
                'user_id': instance.id if hasattr(instance, 'id') else None
            }, 'H1')
            # #endregion
            raise

class EventSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = EvalNode
        fields = ['id', 'name', 'course_name', 'due_date', 'input_type', 'weight']
