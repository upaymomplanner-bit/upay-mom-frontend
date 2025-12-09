import { useQuery } from "@tanstack/react-query";
import { getGoalSummary } from "@/api/analytics/goals";
import { GoalScopeFilters, DateRangeFilters } from "@/api/analytics/utils";

export function useGoalSummary(filters: GoalScopeFilters & DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "goalSummary", filters],
    queryFn: () => getGoalSummary(filters),
  });
}
