from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .user_models import UserProfile
from .models import Course, CourseEnrollment, EvalNode, EvalEntry, Threshold

User = get_user_model()


class UserProfileInline(admin.StackedInline):
    """Inline admin for UserProfile"""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'プロファイル'


class UserAdmin(BaseUserAdmin):
    """Custom admin for User model with profile inline"""
    inlines = (UserProfileInline,)
    list_display = ['username', 'email', 'get_full_name', 'get_student_id', 'get_enrollment_year', 'is_staff']
    
    def get_full_name(self, obj):
        return obj.profile.full_name if hasattr(obj, 'profile') else '-'
    get_full_name.short_description = '氏名'
    
    def get_student_id(self, obj):
        return obj.profile.student_id if hasattr(obj, 'profile') else '-'
    get_student_id.short_description = '学籍番号'
    
    def get_enrollment_year(self, obj):
        return obj.profile.enrollment_year if hasattr(obj, 'profile') else '-'
    get_enrollment_year.short_description = '入学年'


class CourseEnrollmentInline(admin.TabularInline):
    """Inline admin for course enrollments"""
    model = CourseEnrollment
    extra = 0
    fields = ['user', 'attendance_mask', 'enrolled_at']
    readonly_fields = ['enrolled_at']


class CourseAdmin(admin.ModelAdmin):
    """Custom admin for Course model"""
    list_display = ['name', 'year', 'term', 'target_enrollment_year', 'is_required', 'total_classes']
    list_filter = ['year', 'term', 'target_enrollment_year', 'is_required']
    search_fields = ['name']
    inlines = [CourseEnrollmentInline]


class CourseEnrollmentAdmin(admin.ModelAdmin):
    """Custom admin for CourseEnrollment model"""
    list_display = ['user', 'course', 'get_attendance_count', 'enrolled_at']
    list_filter = ['course', 'enrolled_at']
    search_fields = ['user__username', 'course__name']
    
    def get_attendance_count(self, obj):
        return bin(obj.attendance_mask).count('1')
    get_attendance_count.short_description = '出席回数'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(UserProfile)
admin.site.register(Course, CourseAdmin)
admin.site.register(CourseEnrollment, CourseEnrollmentAdmin)
admin.site.register(EvalNode)
admin.site.register(EvalEntry)
admin.site.register(Threshold)
