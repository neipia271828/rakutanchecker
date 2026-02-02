from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class UserProfile(models.Model):
    """
    User profile model with additional student information.
    This extends the default User model without replacing it.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    # 氏名 (Full name)
    full_name = models.CharField(
        max_length=255,
        verbose_name=_('氏名'),
        help_text=_('フルネーム'),
        blank=True
    )
    
    # 学籍番号 (Student ID)
    student_id = models.CharField(
        max_length=50,
        verbose_name=_('学籍番号'),
        unique=True,
        null=True,
        blank=True,
        help_text=_('学籍番号（例: 2024001）')
    )
    
    # 生年月日 (Date of birth)
    date_of_birth = models.DateField(
        verbose_name=_('生年月日'),
        null=True,
        blank=True,
        help_text=_('生年月日')
    )
    
    # 入学年 (Enrollment year)
    enrollment_year = models.IntegerField(
        verbose_name=_('入学年'),
        null=True,
        blank=True,
        help_text=_('入学年（例: 2024）')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('ユーザープロファイル')
        verbose_name_plural = _('ユーザープロファイル')
    
    def __str__(self):
        if self.full_name:
            return f"{self.full_name} ({self.user.username})"
        return self.user.username
