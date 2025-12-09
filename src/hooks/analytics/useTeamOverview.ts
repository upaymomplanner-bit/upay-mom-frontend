import { useQuery } from "@tanstack/react-query";
import {
  getTeamClosureTimes,
  getTeamsNeedingSupport,
} from "@/api/analytics/team";
import { TaskScopeFilters, DateRangeFilters } from "@/api/analytics/utils";

export function useTeamClosureTimes(
  filters: TaskScopeFilters & DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "teamClosureTimes", filters],
    queryFn: () => getTeamClosureTimes(filters),
  });
}

export function useTeamsNeedingSupport(
  filters: TaskScopeFilters & DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "teamsNeedingSupport", filters],
    queryFn: () => getTeamsNeedingSupport(filters),
  });
}
