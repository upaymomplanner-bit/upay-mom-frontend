import { useQuery } from "@tanstack/react-query";
import { getDepartmentClosureTimes } from "@/api/analytics/department";
import { TaskScopeFilters, DateRangeFilters } from "@/api/analytics/utils";

export function useDepartmentClosureTimes(
  filters: TaskScopeFilters & DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "departmentClosureTimes", filters],
    queryFn: () => getDepartmentClosureTimes(filters),
  });
}
