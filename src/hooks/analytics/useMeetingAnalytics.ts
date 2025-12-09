import { useQuery } from "@tanstack/react-query";
import { getMeetingComplianceAnalytics } from "@/api/analytics/meetings";
import { TaskScopeFilters, DateRangeFilters } from "@/api/analytics/utils";

export function useMeetingComplianceAnalytics(
  filters: TaskScopeFilters & DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "meetingCompliance", filters],
    queryFn: () => getMeetingComplianceAnalytics(filters),
  });
}
