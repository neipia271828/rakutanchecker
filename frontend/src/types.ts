export interface Course {
    id: number;
    name: string;
    year: number;
    term: 'early' | 'late' | 'full_year';
    is_required: boolean;
    total_classes: number;
    attendance_mask: number;
    summary?: CourseSummary;
}

export interface EvalNode {
    id: number;
    course: number;
    parent: number | null;
    name: string;
    weight: number;
    input_type: 'score' | 'rate' | 'attendance' | 'none';
    is_leaf: boolean;
    order: number;
    children: EvalNode[];
    due_date?: string;
}

export interface EvalEntry {
    id: number;
    node: number;
    earned?: number;
    max?: number;
    rate?: number;
    attended?: number;
    total?: number;
    adjustment: number;
    status: 'pending' | 'completed';
}

export interface CourseSummary {
    current_score: number;
    predicted_score: number;
    max_score: number;
    deficit: number;
    is_fail_predicted: boolean;
    is_certain_fail: boolean;
    attendance_rate: number;
    current_attended: number;
    attendance_threshold: number;
    is_attendance_fail: boolean;
    is_attendance_safe: boolean;
    threshold: number;
}
