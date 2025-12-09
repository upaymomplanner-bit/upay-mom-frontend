import {
  getSupabase,
  TaskScopeFilters,
  DateRangeFilters,
  dateDiffHours,
  isOverdue,
} from "./utils";

export interface DepartmentClosureMetric {
  department_id: string;
  department_name: string;
  completed_tasks: number;
  average_close_hours: number;
  median_close_hours: number;
  overdue_tasks: number;
}

export async function getDepartmentClosureTimes(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<DepartmentClosureMetric[]> {
  const supabase = getSupabase();

  // Base query for tasks that are completed (for closure times) OR overdue (for the metric)
  // Actually we need 'all' tasks to calc overdue, and 'completed' tasks to calc closure time.
  // And we group by department.

  let query = supabase
    .from("tasks")
    .select(
      `
      id, status, created_at, updated_at, due_date,
      department:departments ( id, name )
    `
    )
    .not("department_id", "is", null);

  // Apply Scope Filters
  if (filters.cityId) {
    // Join on assignee -> team -> city
    // This is complex to filter at top level with .eq without proper foreign key embedding filtering
    // We can filter inside the select or post-filter.
    // For performance, we'll try to rely on Supabase filtering on related resource if possible, but
    // `tasks.department_id` is direct. `tasks` to `city` is via assignee.
    // Note: If request is filtered by city, we only want tasks in that city.
    // Standard approach for this schema:
    // Fetch tasks where assignee.team.city_id = cityId
    // query = query.eq('assignee.team.city_id', filters.cityId) // This doesn't work directly in Deep Join syntax easily for filtering root rows.
    // We'll rely on post-filtering or strict inner join equivalent if possible.
    // Given library limitations, fetch and filter is safest for now.
    // But we will select assignee info to enable filtering.
  }

  if (filters.departmentId)
    query = query.eq("department_id", filters.departmentId);
  // filters.teamId ...
  if (filters.from)
    query = query.gte("created_at", new Date(filters.from).toISOString());
  if (filters.to)
    query = query.lte("created_at", new Date(filters.to).toISOString());

  // We need assignee info if we strictly filter by city/team
  if (filters.cityId || filters.teamId) {
    query = query.select(`
      id, status, created_at, updated_at, due_date, department_id,
      department:departments ( id, name ),
      assignee:profiles!inner (
        team:teams!inner (
          city_id,
          id
        )
      )
    `);

    // Now we can apply strict filters on the joined tables
    if (filters.cityId)
      query = query.eq("assignee.team.city_id", filters.cityId);
    if (filters.teamId) query = query.eq("assignee.team.id", filters.teamId);
  }

  const { data: tasks, error } = await query;
  if (error) throw error;

  // Group by Department
  const deptMap: Record<
    string,
    {
      name: string;
      completed: number;
      times: number[];
      overdue: number;
    }
  > = {};

  const now = new Date();

  for (const task of tasks) {
    const dId = task.department?.id;
    if (!dId) continue; // Should not happen due to .not('department_id', 'is', null)

    if (!deptMap[dId]) {
      deptMap[dId] = {
        name: task.department?.name || "Unknown",
        completed: 0,
        times: [],
        overdue: 0,
      };
    }

    if (task.status === "completed") {
      deptMap[dId].completed++;
      if (task.updated_at) {
        deptMap[dId].times.push(
          dateDiffHours(task.created_at, task.updated_at)
        );
      }
    }

    if (isOverdue(task as any, now)) {
      deptMap[dId].overdue++;
    }
  }

  return Object.keys(deptMap).map((dId) => {
    const data = deptMap[dId];
    data.times.sort((a, b) => a - b);
    const avg = data.times.length
      ? data.times.reduce((a, b) => a + b, 0) / data.times.length
      : 0;
    const mid = Math.floor(data.times.length / 2);
    const median = data.times.length
      ? data.times.length % 2
        ? data.times[mid]
        : (data.times[mid - 1] + data.times[mid]) / 2
      : 0;

    return {
      department_id: dId,
      department_name: data.name,
      completed_tasks: data.completed,
      average_close_hours: avg,
      median_close_hours: median,
      overdue_tasks: data.overdue,
    };
  });
}
