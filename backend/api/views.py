from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status, generics

from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, EvalNode, EvalEntry, Threshold
from .serializers import CourseSerializer, EvalNodeSerializer, EvalEntrySerializer, CourseSummarySerializer, EvalNodeFlatSerializer, RegisterSerializer, UserSerializer

from .services import CalculationService
import json
import os

# #region agent log
LOG_PATH = os.environ.get('DEBUG_LOG_PATH', '/var/log/rakutan-backend/debug.log')
def _log_debug(location, message, data, hypothesis_id=None):
    try:
        # Create log directory if it doesn't exist
        log_dir = os.path.dirname(LOG_PATH)
        if log_dir and not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir, exist_ok=True)
            except (OSError, PermissionError):
                # If we can't create the log directory, silently skip logging
                return
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

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    authentication_classes = []
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        # #region agent log
        _log_debug('views.py:RegisterView.create', '登録リクエスト受信', {
            'username': request.data.get('username'),
            'email': request.data.get('email'),
            'has_full_name': 'full_name' in request.data,
            'has_student_id': 'student_id' in request.data,
            'has_date_of_birth': 'date_of_birth' in request.data,
            'has_enrollment_year': 'enrollment_year' in request.data
        }, 'H1')
        # #endregion
        
        try:
            response = super().create(request, *args, **kwargs)
            # #region agent log
            _log_debug('views.py:RegisterView.create', '登録成功', {
                'status_code': response.status_code,
                'user_id': response.data.get('id') if hasattr(response, 'data') else None
            }, 'H1')
            # #endregion
            return response
        except Exception as e:
            # #region agent log
            _log_debug('views.py:RegisterView.create', '登録エラー', {
                'error': str(e),
                'error_type': type(e).__name__,
                'request_data': {k: str(v)[:100] for k, v in request.data.items()}
            }, 'H1')
            # #endregion
            raise


class CurrentUserView(generics.RetrieveAPIView):
    """Return current authenticated user information"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # We assume obj has 'owner' via some path.
        # Course -> no owner field currently? Wait, Requirements say "User -> School -> Future(Student ID)".
        # MVP: Course doesn't have an owner field in my models yet! 
        # I missed adding user to Course model in Issue 3 step!
        # "User (roll, school identification...)"
        # "Course (instance belonging to year/term)"
        # MVP: "1科目を作成できる". "User roles: student/teacher...".
        # Check Issue 12: "Student can view only their input". But Course itself belongs to whom?
        # A Course is a template copy. A Student "takes" a course.
        # The requirements imply "Student -> Enrolled Course"? 
        # Or does a Student manage their own "My Courses"?
        # "Subject template created by teacher... Student enters grades".
        # "Student: Input into leaf nodes".
        # The Course instance should be linked to student? Or shared course?
        # The prompt says: "Phase 0 (MVP): Single usage, cloud login".
        # So "Course" is owned by the user in MVP.
        # I need to add `user` field to `Course` model.
        return obj.user == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to create courses.
    All authenticated users can view courses.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions (POST, PUT, PATCH, DELETE) are only allowed to admin users
        return request.user and request.user.is_staff


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_permissions(self):
        if self.action in {'entries', 'summary', 'attendance', 'update_attendance'}:
            return [permissions.IsAuthenticated()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        """
        Return courses for the user's enrollment year.
        Admins see all courses.
        """
        user = self.request.user
        
        if user.is_staff:
            # Admins see all courses
            return Course.objects.all()
        
        # Students see courses for their enrollment year
        try:
            enrollment_year = user.profile.enrollment_year
            if enrollment_year:
                return Course.objects.filter(target_enrollment_year=enrollment_year)
        except:
            pass
        
        # If no enrollment year, return empty queryset
        return Course.objects.none()

    def perform_create(self, serializer):
        """Only admins can create courses"""
        course = serializer.save()
        
        # 自動的に「全体評価 (100%)」ルートノードを作成
        EvalNode.objects.create(
            course=course,
            parent=None,
            name='全体評価',
            weight=100,
            input_type=EvalNode.InputType.NONE,
            is_leaf=False,
            order=0
        )

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticated])
    def nodes(self, request, pk=None):
        course = self.get_object()
        
        if request.method == 'GET':
            # Return tree
            roots = course.nodes.filter(parent__isnull=True).order_by('order')
            serializer = EvalNodeSerializer(roots, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Add node to this course
            data = request.data.copy()
            data['course'] = course.id
            serializer = EvalNodeFlatSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        course = self.get_object()
        # Get or create enrollment
        from .models import CourseEnrollment
        enrollment, _ = CourseEnrollment.objects.get_or_create(user=request.user, course=course)
        # #region agent log
        _log_debug('views.py:CourseViewSet.summary', 'summary計算開始', {
            'course_id': course.id,
            'user_id': request.user.id,
            'total_classes': getattr(course, 'total_classes', None),
            'enrollment_attendance_mask': getattr(enrollment, 'attendance_mask', None),
            'has_roots': course.nodes.filter(parent__isnull=True).exists()
        }, 'ATT')
        # #endregion
        summary = CalculationService.get_course_summary(course, request.user, enrollment)
        # #region agent log
        _log_debug('views.py:CourseViewSet.summary', 'summary計算完了', {
            'course_id': course.id,
            'keys': list(summary.keys()),
            'attendance_rate': summary.get('attendance_rate'),
            'current_attended': summary.get('current_attended')
        }, 'ATT')
        # #endregion
        return Response(summary)

    @action(detail=True, methods=['get', 'post'])
    def entries(self, request, pk=None):
        course = self.get_object()
        if request.method == 'GET':
            # return all entries for this course's nodes
            nodes = course.nodes.all() # flat
            entries = EvalEntry.objects.filter(user=request.user, node__in=nodes)
            serializer = EvalEntrySerializer(entries, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create or update entry
            # Expect: node_id, values...
            node_id = request.data.get('node')
            node = get_object_or_404(EvalNode, pk=node_id, course=course)
            
            # Check if entry exists
            entry, created = EvalEntry.objects.get_or_create(
                user=request.user,
                node=node
            )
            
            serializer = EvalEntrySerializer(entry, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'put'], url_path='threshold')
    def threshold(self, request, pk=None):
        course = self.get_object()
        threshold, created = Threshold.objects.get_or_create(course=course)
        
        if request.method == 'PUT':
            value = request.data.get('value')
            if value is not None:
                threshold.value = float(value)
                threshold.save()
        
        return Response({'value': threshold.value})

    @action(detail=True, methods=['patch'], url_path='attendance', permission_classes=[permissions.IsAuthenticated])
    def update_attendance(self, request, pk=None):
        """Update attendance mask for the user's enrollment"""
        course = self.get_object()
        from .models import CourseEnrollment
        
        # Get or create enrollment
        enrollment, _ = CourseEnrollment.objects.get_or_create(user=request.user, course=course)
        
        # Update attendance mask
        attendance_mask = request.data.get('attendance_mask')
        if attendance_mask is not None:
            enrollment.attendance_mask = int(attendance_mask)
            enrollment.save()
            return Response({'attendance_mask': enrollment.attendance_mask})
        
        return Response({'error': 'attendance_mask is required'}, status=status.HTTP_400_BAD_REQUEST)

from .serializers import EventSerializer

class EventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models import CourseEnrollment
        # Get courses the user is enrolled in
        enrolled_courses = CourseEnrollment.objects.filter(user=self.request.user).values_list('course_id', flat=True)
        return EvalNode.objects.filter(course_id__in=enrolled_courses, due_date__isnull=False).order_by('due_date')
