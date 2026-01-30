from django.db.models import Sum
from .models import EvalNode, EvalEntry, Threshold

class CalculationService:
    @staticmethod
    def calculate_leaf_score(entry: EvalEntry) -> float:
        """
        Calculates the score (0.0 to 1.0) for a leaf node based on the entry.
        """
        if not entry:
            return 0.0

        base_score = 0.0
        input_type = entry.node.input_type

        # Calculate base score
        if input_type == EvalNode.InputType.SCORE or input_type == EvalNode.InputType.NONE:
            # Fallback for NONE: try to treat as score if max is present
            if entry.max and entry.max > 0 and entry.earned is not None:
                base_score = entry.earned / entry.max
        elif input_type == EvalNode.InputType.RATE:
            if entry.rate is not None:
                base_score = entry.rate / 100.0
        elif input_type == EvalNode.InputType.ATTENDANCE:
            if entry.total and entry.total > 0 and entry.attended is not None:
                base_score = entry.attended / entry.total
        
        # Clamp base score before adjustment? Requirement says adjustment is added to base*100
        # "adjustedScore100 = base*100 + adjustment"
        # "leafScore = clamp(adjustedScore100 / 100, 0..1)"
        
        score_100 = base_score * 100
        if entry.adjustment:
            score_100 += entry.adjustment
            
        final_score = max(0.0, min(1.0, score_100 / 100.0))
        return final_score

    @staticmethod
    def calculate_node_score(node: EvalNode, user, mode='predicted') -> float:
        """
        Recursively calculates the score for a node (0.0 to 1.0).
        mode: 
          - 'current': Exclude unattempted leaves (returns None if no attempted leaves).
          - 'predicted': Unattempted leaves = 0.
          - 'max': Unattempted leaves = 1.0.
        """
        if node.is_leaf:
            entry = EvalEntry.objects.filter(node=node, user=user).first()
            
            # Helper to determine if we treat as completed
            is_completed = entry and entry.status == EvalEntry.Status.COMPLETED
            
            if is_completed:
                return CalculationService.calculate_leaf_score(entry)
            
            # If not completed or no entry
            if mode == 'current':
                return None
            elif mode == 'max':
                return 1.0
            else: # predicted
                return 0.0

        children = node.children.all()
        if not children.exists():
            return 0.0 if mode != 'current' else None

        weighted_score_sum = 0.0
        total_weight = 0.0
        
        valid_child_found = False

        for child in children:
            child_score = CalculationService.calculate_node_score(child, user, mode)
            
            if child_score is not None:
                valid_child_found = True
                weight = child.weight
                weighted_score_sum += weight * child_score
                total_weight += weight
            elif mode != 'current':
                # Should not happen for predicted/max as they return 0.0 or 1.0, not None
                # unless a child has no children and we returned None? (handled above)
                pass

        if not valid_child_found:
            return None if mode == 'current' else 0.0

        if total_weight == 0:
            return 0.0
            
        # Normalize
        return weighted_score_sum / total_weight

    @staticmethod
    def get_course_summary(course, user):
        """
        Returns summary dictionary with current, predicted, max scores and strict fail status.
        Handles unallocated weights by treating root's children weights as absolute percentages of the course.
        """
        roots = course.nodes.filter(parent__isnull=True)
        if not roots.exists():
            return {
                'current_score': 0.0, 
                'predicted_score': 0.0, 
                'max_score': 0.0,
                'is_fail_predicted': False,
                'is_certain_fail': False,
                'threshold': 60.0
            }

        # Instead of calling calculate_node_score on root (which normalizes),
        # we iterate through root's children and sum their weighted scores relative to the course (assumed 100%).
        # If there are multiple roots, we treat them as top-level components.
        
        # We need to flatten the top level structure effectively. 
        # But actually, usually there is one root "Overview" with weight 100?
        # If the user created "b (30%)", "c (30%)" as roots, then we iterate roots.
        # If the user created "Root (100%)" -> "b (30%)", "c (30%)", then root is normalized.
        
        # Let's handle both. If there is a single root with children, and root weight is 100 (or ignored as it is root),
        # we should look at its children.
        
        # Case 1: Multiple roots (e.g. user added b and c directly as roots).
        # We sum them up. Sum of weights might be < 100.
        
        # Case 2: One root "Total". Its children sum < 100.
        # calculate_node_score(root) normalizes children sum to 1.0. This is what we want to AVOID for "current_score".
        
        # So we need a helper that does NOT normalize at the top level call.
        
        # Determine strict "Secured" score.
        # This is sum(child_score * child_weight) for all effective leaves, but easier to traverse top-down.
        
        total_current_weighted_sum = 0.0
        total_predicted_weighted_sum = 0.0
        total_max_weighted_sum = 0.0
        
        # We treat all roots as direct contributors to the course (weight is percentage).
        # But if there is a single root that acts as a container (weight 100?), we might need to dive in.
        # However, typically "Root" has weight 100? Or 0? 
        # If the user made "Overall (100%)", then we calculate it.
        # If its children are 30% and 30%, calculate_node_score returns 1.0 (if perfect).
        # Then 1.0 * 100 = 100.
        
        # The issue is that calculate_node_score normalizes at EACH step.
        # If I have Root -> A(30), B(30).
        # Root score = (A_score*30 + B_score*30) / 60.
        # If I want "absolute score", I want (A_score*30 + B_score*30) / 100.
        
        # So, we should interpret "root weight" generally.
        # If roots are multiple, we sum them.
        # If root is single, we check if it has children. If so, we essentially want the sum of children's absolute contribution.
        
        # Let's enforce that we want the raw weighted sum of the top-most meaningful nodes, normalized to 100.
        
        # Let's modify calculate_node_score logic slightly or re-implement for summary.
        # Let's walk the tree and accumulate "secured points".
        
        current_secured = 0.0
        current_predicted = 0.0
        current_max = 0.0 # secured + potential in undefined
        
        # If we assume standard normalization is "Propriety" (Performance rate in defined area).
        
        # Let's define:
        # Secured = Raw weighted sum of all completed leaf contributions.
        # Defined Weight = Sum of weights of all leaves (or branches).
        
        def calculate_stats_recursive(node, user):
            # Returns (secured_val, predicted_val, max_val, node_weight)
            # node_weight is the weight of this node in PARENT.
            # But values returned are 0.0-1.0 (score).
            pass
            
        # Actually easier: use calculate_node_score but pay attention to weights.
        
        # Re-calc for roots
        defined_weight_sum = 0.0
        weighted_score_sum_current = 0.0
        weighted_score_sum_predicted = 0.0 # treated as if undefined is 0
        weighted_score_sum_max = 0.0 # treated as if undefined is 100 (in max mode calculation)
        
        target_nodes = list(roots)
        
        # Special check: if single root and it acts as container (100% and has children), use its children
        # This fixes the "Root(100) -> A(30),B(30)" case where Root normalizes to 1.0.
        if len(target_nodes) == 1 and target_nodes[0].children.exists():
             # Use children of the root instead
             target_nodes = list(target_nodes[0].children.all())
        
        for node in target_nodes:
            w = node.weight
            defined_weight_sum += w
            
            s_current = CalculationService.calculate_node_score(node, user, 'current')
            if s_current is not None:
                weighted_score_sum_current += s_current * w
                
            s_predicted = CalculationService.calculate_node_score(node, user, 'predicted')
            if s_predicted is not None:
                weighted_score_sum_predicted += s_predicted * w
                
            s_max = CalculationService.calculate_node_score(node, user, 'max')
            if s_max is not None:
                weighted_score_sum_max += s_max * w
        
        # Secured Score: This is simply weighted_score_sum_current.
        # e.g. 30 * 1.0 + 30 * 1.0 = 60.0.
        current_score = weighted_score_sum_current
        
        # Predicted Score:
        # Logic: (Secured / Defined) * 100
        # If defined is 60, and secured is 60 -> (60/60)*100 = 100.
        if defined_weight_sum > 0:
            predicted_score = (weighted_score_sum_predicted / defined_weight_sum) * 100.0
        else:
            predicted_score = 0.0
            
        # Max Score:
        # Logic: Secured + (Max achievable in remaining)
        # However, calculate_node_score('max') returns 1.0 for unattempted leaves.
        # So "weighted_score_sum_max" accounts for "Defined but unattempted".
        # We need to add "Undefined" (100 - defined_weight_sum) as well.
        
        undefined_weight = max(0.0, 100.0 - defined_weight_sum)
        max_score = weighted_score_sum_max + undefined_weight
        
        # Threshold
        try:
            threshold_val = course.threshold.value
        except Threshold.DoesNotExist:
            threshold_val = 60.0
            
        is_fail_predicted = predicted_score < threshold_val
        is_certain_fail = max_score < threshold_val
        
        return {
            'current_score': round(current_score, 2),
            'predicted_score': round(predicted_score, 2),
            'max_score': round(max_score, 2),
            'deficit': round(max(0, threshold_val - predicted_score), 2),
            'is_fail_predicted': is_fail_predicted,
            'is_certain_fail': is_certain_fail,
            'threshold': threshold_val
        }
