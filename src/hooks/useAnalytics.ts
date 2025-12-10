import { useQuery } from "@tanstack/react-query";
import {
  fetchTasksByCity,
  fetchDepartmentProgress,
  fetchClosureTimeByPriority,
  fetchWeightedAvgClosureTime,
  fetchClosureTimeByLocation,
  fetchClosureTimeByCity,
  DateRangeFilters,
} from "@/api/analytics";

/**
 * Hook to fetch tasks grouped by city with status breakdown
 */
export function useTasksByCity(filters?: DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "tasksByCity", filters],
    queryFn: () => fetchTasksByCity(filters),
  });
}

/**
 * Hook to fetch task progress per department, optionally filtered by city
 */
export function useDepartmentProgress(
  cityId?: string,
  filters?: DateRangeFilters
) {
  return useQuery({
    queryKey: ["analytics", "departmentProgress", cityId, filters],
    queryFn: () => fetchDepartmentProgress(cityId, filters),
  });
}

/**
 * Hook to fetch average closure time grouped by priority level
 */
export function useClosureTimeByPriority(filters?: DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "closureTimeByPriority", filters],
    queryFn: () => fetchClosureTimeByPriority(filters),
  });
}

/**
 * Hook to fetch weighted average closure time across all priorities
 */
export function useWeightedAvgClosureTime(filters?: DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "weightedAvgClosureTime", filters],
    queryFn: () => fetchWeightedAvgClosureTime(filters),
  });
}

/**
 * Hook to fetch closure time by location (city + department)
 */
export function useClosureTimeByLocation(filters?: DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "closureTimeByLocation", filters],
    queryFn: () => fetchClosureTimeByLocation(filters),
  });
}

/**
 * Hook to fetch closure time by city only (aggregated across departments)
 */
export function useClosureTimeByCity(filters?: DateRangeFilters) {
  return useQuery({
    queryKey: ["analytics", "closureTimeByCity", filters],
    queryFn: () => fetchClosureTimeByCity(filters),
  });
}
