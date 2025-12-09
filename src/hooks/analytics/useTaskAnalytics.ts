import { useQuery } from "@tanstack/react-query";
import {
  getTaskProgressByScope,
  getTaskCompletionTime,
  getWeightedTaskClosureTime,
} from "@/api/analytics/tasks";
import { TaskScopeFilters, DateRangeFilters } from "@/api/analytics/utils";

export function useTaskProgress(filters: TaskScopeFilters & DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "taskProgress", filters],
    queryFn: () => getTaskProgressByScope(filters),
  });
}

export function useTaskCompletionTime(
  filters: TaskScopeFilters & DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "taskCompletionTime", filters],
    queryFn: () => getTaskCompletionTime(filters),
  });
}

export function useWeightedTaskClosureTime(
  filters: TaskScopeFilters & DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "weightedTaskClosureTime", filters],
    queryFn: () => getWeightedTaskClosureTime(filters),
  });
}
