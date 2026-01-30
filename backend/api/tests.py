from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Course, EvalNode, EvalEntry, Threshold
from .services import CalculationService

User = get_user_model()

class CalculationServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.course = Course.objects.create(name='Math 101', year=2025, term='early', user=self.user)
        self.root = EvalNode.objects.create(course=self.course, name='Total', weight=100)

    def test_leaf_score_basic(self):
        leaf = EvalNode.objects.create(course=self.course, parent=self.root, name='Quiz', weight=100, input_type='score', is_leaf=True)
        entry = EvalEntry.objects.create(user=self.user, node=leaf, earned=80, max=100, status='completed')
        
        score = CalculationService.calculate_leaf_score(entry)
        self.assertEqual(score, 0.8)

    def test_leaf_score_adjustment(self):
        leaf = EvalNode.objects.create(course=self.course, parent=self.root, name='Quiz', weight=100, input_type='score', is_leaf=True)
        # 80/100 = 0.8 (80 points). Adjustment +5 -> 85 points -> 0.85
        entry = EvalEntry.objects.create(user=self.user, node=leaf, earned=80, max=100, adjustment=5, status='completed')
        self.assertEqual(CalculationService.calculate_leaf_score(entry), 0.85)

        # 80/100 = 0.8. Adjustment -10 -> 70 -> 0.7
        entry.adjustment = -10
        entry.save()
        self.assertEqual(CalculationService.calculate_leaf_score(entry), 0.7)

    def test_normalization(self):
        # Weights: 30 and 30 (sum 60). Should normalize to 50% each.
        n1 = EvalNode.objects.create(course=self.course, parent=self.root, name='Part1', weight=30, input_type='score', is_leaf=True)
        n2 = EvalNode.objects.create(course=self.course, parent=self.root, name='Part2', weight=30, input_type='score', is_leaf=True)
        
        # 100/100 -> 1.0
        EvalEntry.objects.create(user=self.user, node=n1, earned=100, max=100, status='completed')
        # 50/100 -> 0.5
        EvalEntry.objects.create(user=self.user, node=n2, earned=50, max=100, status='completed')
        
        # Average of 1.0 and 0.5 (equal weights) = 0.75
        score = CalculationService.calculate_node_score(self.root, self.user, 'predicted')
        self.assertAlmostEqual(score, 0.75)

    def test_nested_structure(self):
        # Root -> Mid(50) -> Leaf1(100)
        #      -> Leaf2(50)
        mid = EvalNode.objects.create(course=self.course, parent=self.root, name='Mid', weight=50)
        leaf1 = EvalNode.objects.create(course=self.course, parent=mid, name='L1', weight=100, input_type='score', is_leaf=True)
        leaf2 = EvalNode.objects.create(course=self.course, parent=self.root, name='L2', weight=50, input_type='score', is_leaf=True)
        
        # L1: 1.0 (completed)
        EvalEntry.objects.create(user=self.user, node=leaf1, earned=10, max=10, status='completed')
        # L2: 0.0 (incomplete)
        
        # Predicted: Mid(1.0) * 0.5 + L2(0.0) * 0.5 = 0.5
        score = CalculationService.calculate_node_score(self.root, self.user, 'predicted')
        self.assertAlmostEqual(score, 0.5)
        
        # Current: Mid(1.0). L2 checks ignored (returns None? No, L2 children check? L2 is leaf).
        # L2 is not completed. calculate_node_score(L2, current) -> None.
        # Root children: Mid (1.0), L2 (None).
        # Total weight: 50 (from Mid). Weighted sum: 1.0 * 50 = 50.
        # Result: 50 / 50 = 1.0
        score_current = CalculationService.calculate_node_score(self.root, self.user, 'current')
        self.assertAlmostEqual(score_current, 1.0)

    def test_max_score_and_certain_fail(self):
        # Weight 50/50.
        # L1 completed with 0.
        # L2 not completed.
        n1 = EvalNode.objects.create(course=self.course, parent=self.root, name='Part1', weight=50, input_type='score', is_leaf=True)
        n2 = EvalNode.objects.create(course=self.course, parent=self.root, name='Part2', weight=50, input_type='score', is_leaf=True)

        EvalEntry.objects.create(user=self.user, node=n1, earned=0, max=100, status='completed')
        
        # Predicted: L1(0) * 0.5 + L2(0) * 0.5 = 0.0
        # Max: L1(0) * 0.5 + L2(1.0) * 0.5 = 0.5 (50 points)
        
        summary = CalculationService.get_course_summary(self.course, self.user)
        self.assertEqual(summary['predicted_score'], 0.0)
        self.assertEqual(summary['max_score'], 50.0)
        self.assertTrue(summary['is_fail_predicted'])
        self.assertTrue(summary['is_certain_fail']) # Max 50 < 60

    def test_current_vs_predicted_mixed(self):
        # 3 parts, 33.3 each (approx). Let's use 10, 10, 10.
        n1 = EvalNode.objects.create(course=self.course, parent=self.root, name='P1', weight=10, input_type='score', is_leaf=True)
        n2 = EvalNode.objects.create(course=self.course, parent=self.root, name='P2', weight=10, input_type='score', is_leaf=True)
        n3 = EvalNode.objects.create(course=self.course, parent=self.root, name='P3', weight=10, input_type='score', is_leaf=True)
        
        # P1: 100%
        EvalEntry.objects.create(user=self.user, node=n1, earned=100, max=100, status='completed')
        # P2: Unattempted
        # P3: Unattempted
        
        # Current: Only P1 counts. 100%.
        self.assertAlmostEqual(CalculationService.calculate_node_score(self.root, self.user, 'current'), 1.0)
        
        # Predicted: P1(1.0), P2(0), P3(0). Avg (1+0+0)/3 = 0.333
        self.assertAlmostEqual(CalculationService.calculate_node_score(self.root, self.user, 'predicted'), 1/3)
