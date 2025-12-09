import { createClient } from "@/lib/supabase/client";

// Shared Types
export type TaskPriority = "urgent" | "important" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "completed";

export interface DateRangeFilters {
  from?: string | Date;
  to?: string | Date;
}

export interface TaskScopeFilters {
  orgScope?: boolean;
  cityId?: string;
  departmentId?: string;
  teamId?: string;
}

export interface GoalScopeFilters {
  orgScope?: boolean;
  cityId?: string;
  departmentId?: string;
  teamId?: string;
}

// Supabase Client Helper or usage pattern
// We will use this function to get the client in all API files
export const getSupabase = () => createClient();

// Utility Functions

export function dateDiffHours(
  start: string | Date,
  end: string | Date
): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60);
}

export function isOverdue(
  task: { due_date: string | null; status: string },
  now: Date = new Date()
): boolean {
  if (!task.due_date || task.status === "completed") return false;
  return new Date(task.due_date) < now;
}

export function priorityWeight(priority: TaskPriority | null): number {
  switch (priority) {
    case "urgent":
      return 4;
    case "important":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function calculateWeightedAverage(
  values: { time: number; priority: TaskPriority | null }[]
): number {
  if (values.length === 0) return 0;

  let totalWeightedTime = 0;
  let totalWeight = 0;

  for (const v of values) {
    const w = priorityWeight(v.priority);
    if (w > 0) {
      totalWeightedTime += v.time * w;
      totalWeight += w;
    }
  }

  return totalWeight === 0 ? 0 : totalWeightedTime / totalWeight;
}

// Helpers for manual grouping if needed (though we'll try to use SQL/Supabase filters where possible)
export function groupTasksByDepartment<
  T extends { department_id: string | null }
>(tasks: T[]): Record<string, T[]> {
  return tasks.reduce((acc, task) => {
    const key = task.department_id || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, T[]>);
}

// Common type definitions for API responses to ensure consistency
export interface Distribution {
  [key: string]: number;
}

export interface TaskSummary {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  overdue: number;
}
