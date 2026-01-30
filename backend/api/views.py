from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status, generics

from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, EvalNode, EvalEntry, Threshold
from .serializers import CourseSerializer, EvalNodeSerializer, EvalEntrySerializer, CourseSummarySerializer, EvalNodeFlatSerializer, RegisterSerializer, UserSerializer

from .services import CalculationService

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

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

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter courses by user.
        # But wait, Course model doesn't have user! I need to fix this.
        # Assuming I fix Course model to have `user`.
        return Course.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get', 'post'])
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
        summary = CalculationService.get_course_summary(course, request.user)
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

from .serializers import EventSerializer

class EventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EvalNode.objects.filter(course__user=self.request.user, due_date__isnull=False).order_by('due_date')
