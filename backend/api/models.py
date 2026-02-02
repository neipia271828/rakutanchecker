from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from .user_models import UserProfile

class Course(models.Model):
    """
    Course template shared across students of the same enrollment year.
    Created by admin users.
    """
    class Term(models.TextChoices):
        EARLY = 'early', _('前期')
        LATE = 'late', _('後期')
        FULL_YEAR = 'full_year', _('通年')

    name = models.CharField(max_length=255, verbose_name=_('科目名'))
    year = models.IntegerField(verbose_name=_('開講年度'), help_text=_('例: 2024'))
    term = models.CharField(max_length=20, choices=Term.choices, verbose_name=_('学期'))
    is_required = models.BooleanField(default=False, verbose_name=_('必修科目'))
    total_classes = models.IntegerField(default=15, verbose_name=_('総授業回数'))
    target_enrollment_year = models.IntegerField(
        verbose_name=_('対象入学年'),
        help_text=_('この科目を履修する学生の入学年（例: 2024年入学生向け）')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['name', 'year', 'term', 'target_enrollment_year']
        ordering = ['-year', 'term', 'name']

    def __str__(self):
        return f"{self.year} {self.get_term_display()} - {self.name} ({self.target_enrollment_year}年入学)"


class CourseEnrollment(models.Model):
    """
    Individual student enrollment in a course.
    Stores student-specific data like attendance.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name=_('学生')
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name=_('科目')
    )
    attendance_mask = models.BigIntegerField(
        default=0,
        verbose_name=_('出席記録'),
        help_text=_('ビットマスク形式の出席記録')
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'course']
        verbose_name = _('履修登録')
        verbose_name_plural = _('履修登録')

    def __str__(self):
        return f"{self.user.username} - {self.course.name}"

class EvalNode(models.Model):
    class InputType(models.TextChoices):
        SCORE = 'score', _('点数入力') # earned / max
        RATE = 'rate', _('割合入力') # rate (%)
        ATTENDANCE = 'attendance', _('出席入力') # attended / total
        NONE = 'none', _('入力なし') # For intermediate nodes

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='nodes')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    name = models.CharField(max_length=255)
    weight = models.FloatField(help_text="Weight percentage (e.g. 30 for 30%)")
    input_type = models.CharField(max_length=20, choices=InputType.choices, default=InputType.NONE)
    is_leaf = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.name} - {self.name}"

class EvalEntry(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _('未入力')
        COMPLETED = 'completed', _('入力済')

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    node = models.ForeignKey(EvalNode, on_delete=models.CASCADE, related_name='entries')
    
    # Input fields
    earned = models.FloatField(null=True, blank=True)
    max = models.FloatField(null=True, blank=True)
    rate = models.FloatField(null=True, blank=True)
    attended = models.IntegerField(null=True, blank=True)
    total = models.IntegerField(null=True, blank=True)
    
    adjustment = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'node')

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.node.is_leaf:
            raise ValidationError(_("Entries can only be created for leaf nodes."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} - {self.node.name} ({self.status})"

class Threshold(models.Model):
    class ThresholdType(models.TextChoices):
        ROOT_ONLY = 'root_only', _('全体のみ')

    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='threshold')
    type = models.CharField(max_length=20, choices=ThresholdType.choices, default=ThresholdType.ROOT_ONLY)
    value = models.FloatField(default=60.0)

    def __str__(self):
        return f"{self.course.name} Threshold: {self.value}"
