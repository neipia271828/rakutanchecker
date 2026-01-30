from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Course(models.Model):
    class Term(models.TextChoices):
        EARLY = 'early', _('前期')
        LATE = 'late', _('後期')
        FULL_YEAR = 'full_year', _('通年') # Adding full_year just in case

    name = models.CharField(max_length=255)
    year = models.IntegerField()
    term = models.CharField(max_length=20, choices=Term.choices)
    is_required = models.BooleanField(default=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.year} {self.term} - {self.name}"

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
