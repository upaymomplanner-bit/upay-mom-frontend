// Database types for goals

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  year: number;
  quarter: number;
  status: "on_track" | "at_risk" | "completed" | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalWithDepartment extends Goal {
  departments: { name: string } | null;
}

// RPC response type for get_goal_completion_percentage
export interface GoalCompletionData {
  goal_id: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
}

export interface GoalCompletion {
  percentage: number;
  totalTasks: number;
  completedTasks: number;
}
