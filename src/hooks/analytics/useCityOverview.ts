import { useQuery } from "@tanstack/react-query";
import { getCityOverview, getCityGoalProgress } from "@/api/analytics/city";
import { DateRangeFilters } from "@/api/analytics/utils";

export function useCityOverview(cityId: string, filters?: DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "cityOverview", { cityId, filters }],
    queryFn: () => getCityOverview(cityId, filters),
    enabled: !!cityId,
  });
}

export function useCityGoalProgress(
  cityId: string,
  filters?: DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "cityGoalProgress", { cityId, filters }],
    queryFn: () => getCityGoalProgress(cityId, filters),
    enabled: !!cityId,
  });
}
