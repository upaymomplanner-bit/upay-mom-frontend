import { createClient } from "@/lib/supabase/client";

// Types for date filters
export interface DateRangeFilters {
  from?: string; // ISO date string
  to?: string; // ISO date string
}

// Types matching RPC return values
export interface CityTasksOverview {
  city_id: string;
  city_name: string;
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface DepartmentProgress {
  city_id: string;
  city_name: string;
  department_id: string;
  department_name: string;
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  avg_completion_time_hours: number;
}

export interface ClosureTimeByPriority {
  priority: string;
  priority_weight: number;
  total_completed: number;
  avg_closure_hours: number;
  min_closure_hours: number;
  max_closure_hours: number;
  median_closure_hours: number;
}

export interface WeightedAvgClosureTime {
  weighted_avg_hours: number;
  total_tasks: number;
  urgent_contribution: number;
  important_contribution: number;
  medium_contribution: number;
  low_contribution: number;
}

export interface ClosureTimeByLocation {
  city_id: string;
  city_name: string;
  department_id: string;
  department_name: string;
  total_completed: number;
  avg_closure_hours: number;
  min_closure_hours: number;
  max_closure_hours: number;
  median_closure_hours: number;
  urgent_avg_hours: number | null;
  important_avg_hours: number | null;
  medium_avg_hours: number | null;
  low_avg_hours: number | null;
}

export interface ClosureTimeByCity {
  city_id: string;
  city_name: string;
  total_completed: number;
  avg_closure_hours: number;
  median_closure_hours: number;
  urgent_avg_hours: number | null;
  important_avg_hours: number | null;
  medium_avg_hours: number | null;
  low_avg_hours: number | null;
}

// API Functions

/**
 * Fetch tasks grouped by city with status breakdown
 */
export async function fetchTasksByCity(
  filters?: DateRangeFilters
): Promise<CityTasksOverview[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_tasks_by_city", {
    date_from: filters?.from || null,
    date_to: filters?.to || null,
  });

  if (error) throw error;
  return data as CityTasksOverview[];
}

/**
 * Fetch task progress per department, optionally filtered by city
 */
export async function fetchDepartmentProgress(
  cityId?: string,
  filters?: DateRangeFilters
): Promise<DepartmentProgress[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_city_department_progress", {
    filter_city_id: cityId || null,
    date_from: filters?.from || null,
    date_to: filters?.to || null,
  });

  if (error) throw error;
  return data as DepartmentProgress[];
}

/**
 * Fetch average closure time grouped by priority level
 */
export async function fetchClosureTimeByPriority(
  filters?: DateRangeFilters
): Promise<ClosureTimeByPriority[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "get_task_closure_time_by_priority",
    {
      date_from: filters?.from || null,
      date_to: filters?.to || null,
    }
  );

  if (error) throw error;
  return data as ClosureTimeByPriority[];
}

/**
 * Fetch weighted average closure time across all priorities
 */
export async function fetchWeightedAvgClosureTime(
  filters?: DateRangeFilters
): Promise<WeightedAvgClosureTime | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_weighted_avg_closure_time", {
    date_from: filters?.from || null,
    date_to: filters?.to || null,
  });

  if (error) throw error;
  return data?.[0] as WeightedAvgClosureTime | null;
}

/**
 * Fetch closure time by location (city + department)
 */
export async function fetchClosureTimeByLocation(
  filters?: DateRangeFilters
): Promise<ClosureTimeByLocation[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_closure_time_by_location", {
    date_from: filters?.from || null,
    date_to: filters?.to || null,
  });

  if (error) throw error;
  return data as ClosureTimeByLocation[];
}

/**
 * Fetch closure time by city only (aggregated across departments)
 */
export async function fetchClosureTimeByCity(
  filters?: DateRangeFilters
): Promise<ClosureTimeByCity[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_closure_time_by_city", {
    date_from: filters?.from || null,
    date_to: filters?.to || null,
  });

  if (error) throw error;
  return data as ClosureTimeByCity[];
}
