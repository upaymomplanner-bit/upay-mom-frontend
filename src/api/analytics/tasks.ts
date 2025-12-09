import {
  getSupabase,
  TaskScopeFilters,
  DateRangeFilters,
  TaskPriority,
  dateDiffHours,
  isOverdue,
  calculateWeightedAverage,
  priorityWeight,
} from "./utils";

export interface TaskProgressStats {
  distribution: {
    total: number;
    completed: number;
    in_progress: number;
    todo: number;
    completed_percent: number;
    in_progress_percent: number;
    todo_percent: number;
  };
  period_activity: {
    created_count: number;
    completed_count: number;
  };
  overdue: {
    count: number;
    most_overdue_sample: { id: string; title: string; due_date: string }[];
  };
  priority_breakdown: {
    urgent: number;
    important: number;
    medium: number;
    low: number;
  };
}

export interface TaskClosureTimeStats {
  overall_average_hours: number;
  by_priority: {
    urgent: number | null;
    important: number | null;
    medium: number | null;
    low: number | null;
  };
}

export interface WeightedClosureStats {
  weighted_average_hours: number;
  by_priority: TaskClosureTimeStats["by_priority"];
}

// Helper to build base query with scope filters
function applyScopeFilters(query: any, filters: TaskScopeFilters) {
  if (filters.departmentId)
    query = query.eq("department_id", filters.departmentId);

  // For Team and City, we rely on joined filters.
  // Since we can't easily modify the 'base' query object shape dynamically for deep filters in one line without potentially breaking return types or chain,
  // we assume the query passed in has ALREADY selected the necessary relations if needed, OR we apply filters that work on top level if possible.
  // But strictly:
  // tasks -> assignee -> team -> (id, city_id)

  return query;
}

export async function getTaskProgressByScope(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<TaskProgressStats> {
  const supabase = getSupabase();
  const now = new Date();

  // We need a broad selection to compute these stats.
  // Ideally use Count, but for Overdue and Breakdown we need data rows or multiple count queries.
  // A single fetch of 'active' tasks + period tasks is often best for dashboards.
  // Warning: large datasets.

  let query = supabase.from("tasks").select(`
      id, title, status, priority, due_date, created_at, updated_at,
      assignee:profiles!inner (
        team:teams!inner (
          id, city_id
        )
      )
    `);

  if (filters.cityId) query = query.eq("assignee.team.city_id", filters.cityId);
  if (filters.teamId) query = query.eq("assignee.team.id", filters.teamId);
  if (filters.departmentId)
    query = query.eq("department_id", filters.departmentId);

  // Period filtering: For "Progress" stats, we usually want CURRENT status of EVERYTHING relevant,
  // PLUS activity in the specific period.
  // If `from/to` is provided, user might mean "Tasks created in this period".
  // BUT "Status distribution" usually implies ALL open tasks?
  // Let's assume the filters apply to `created_at` for the "Scope of analysis".

  if (filters.from)
    query = query.gte("created_at", new Date(filters.from).toISOString());
  if (filters.to)
    query = query.lte("created_at", new Date(filters.to).toISOString());

  const { data: tasks, error } = await query;
  if (error) throw error;

  const stats: TaskProgressStats = {
    distribution: {
      total: 0,
      completed: 0,
      in_progress: 0,
      todo: 0,
      completed_percent: 0,
      in_progress_percent: 0,
      todo_percent: 0,
    },
    period_activity: { created_count: 0, completed_count: 0 },
    overdue: { count: 0, most_overdue_sample: [] },
    priority_breakdown: { urgent: 0, important: 0, medium: 0, low: 0 },
  };

  const overdueList: any[] = [];

  const periodStart = filters.from ? new Date(filters.from).getTime() : 0;
  const periodEnd = filters.to ? new Date(filters.to).getTime() : Infinity;

  stats.distribution.total = tasks.length;

  tasks.forEach((task) => {
    // Status
    if (task.status === "completed") stats.distribution.completed++;
    else if (task.status === "in_progress") stats.distribution.in_progress++;
    else stats.distribution.todo++;

    // Period Activity
    const createdTime = new Date(task.created_at).getTime();
    const updatedTime = task.updated_at
      ? new Date(task.updated_at).getTime()
      : 0;

    // "Created in period" - if the main query is already filtered by created_at, this is just total.
    // If main query is NOT filtered (e.g. strict scope only), we check here.
    // But we DID apply filters to main query. So created_count = total.
    stats.period_activity.created_count++;

    // "Completed in period"
    if (
      task.status === "completed" &&
      updatedTime >= periodStart &&
      updatedTime <= periodEnd
    ) {
      stats.period_activity.completed_count++;
    }

    // Priority
    const p = (task.priority as TaskPriority) || "medium";
    if (stats.priority_breakdown[p] !== undefined) {
      stats.priority_breakdown[p]++;
    }

    // Overdue
    if (isOverdue(task as any, now)) {
      stats.overdue.count++;
      overdueList.push(task);
    }
  });

  // Calculate percentages
  if (stats.distribution.total > 0) {
    stats.distribution.completed_percent =
      (stats.distribution.completed / stats.distribution.total) * 100;
    stats.distribution.in_progress_percent =
      (stats.distribution.in_progress / stats.distribution.total) * 100;
    stats.distribution.todo_percent =
      (stats.distribution.todo / stats.distribution.total) * 100;
  }

  // Sample overdue (sorted by most overdue)
  overdueList.sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );
  stats.overdue.most_overdue_sample = overdueList
    .slice(0, 5)
    .map((t) => ({ id: t.id, title: t.title, due_date: t.due_date }));

  return stats;
}

export async function getTaskCompletionTime(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<TaskClosureTimeStats> {
  const supabase = getSupabase();

  let query = supabase
    .from("tasks")
    .select(
      `
      id, status, priority, created_at, updated_at,
      assignee:profiles!inner (
        team:teams!inner (
          id, city_id
        )
      )
    `
    )
    .eq("status", "completed")
    .not("updated_at", "is", null);

  if (filters.cityId) query = query.eq("assignee.team.city_id", filters.cityId);
  if (filters.teamId) query = query.eq("assignee.team.id", filters.teamId);
  if (filters.departmentId)
    query = query.eq("department_id", filters.departmentId);

  if (filters.from)
    query = query.gte("updated_at", new Date(filters.from).toISOString()); // Use updated_at for closure time analysis period
  if (filters.to)
    query = query.lte("updated_at", new Date(filters.to).toISOString());

  const { data: tasks, error } = await query;
  if (error) throw error;

  const times: { time: number; priority: TaskPriority }[] = [];
  const byPriority: Record<string, number[]> = {
    urgent: [],
    important: [],
    medium: [],
    low: [],
  };

  tasks.forEach((task) => {
    const hours = dateDiffHours(task.created_at, task.updated_at);
    const p = (task.priority as TaskPriority) || "medium";

    times.push({ time: hours, priority: p });
    if (byPriority[p]) byPriority[p].push(hours);
  });

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    overall_average_hours: avg(times.map((t) => t.time)),
    by_priority: {
      urgent: byPriority.urgent.length ? avg(byPriority.urgent) : null,
      important: byPriority.important.length ? avg(byPriority.important) : null,
      medium: byPriority.medium.length ? avg(byPriority.medium) : null,
      low: byPriority.low.length ? avg(byPriority.low) : null,
    },
  };
}

export async function getWeightedTaskClosureTime(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<WeightedClosureStats> {
  // Reuse the logic from getTaskCompletionTime but apply weights
  // For efficiency, we can just call it (as it fetches the same data + aggregates)
  // BUT we need the raw numbers to weight them. getTaskCompletionTime returns avgs.
  // So we re-implement fetching.

  const supabase = getSupabase();

  let query = supabase
    .from("tasks")
    .select(
      `
      id, status, priority, created_at, updated_at,
      assignee:profiles!inner (
        team:teams!inner (
          id, city_id
        )
      )
    `
    )
    .eq("status", "completed")
    .not("updated_at", "is", null);

  if (filters.cityId) query = query.eq("assignee.team.city_id", filters.cityId);
  if (filters.teamId) query = query.eq("assignee.team.id", filters.teamId);
  if (filters.departmentId)
    query = query.eq("department_id", filters.departmentId);
  if (filters.from)
    query = query.gte("updated_at", new Date(filters.from).toISOString());
  if (filters.to)
    query = query.lte("updated_at", new Date(filters.to).toISOString());

  const { data: tasks, error } = await query;
  if (error) throw error;

  const times: { time: number; priority: TaskPriority }[] = [];
  const byPriority: Record<string, number[]> = {
    urgent: [],
    important: [],
    medium: [],
    low: [],
  };

  tasks.forEach((task) => {
    const hours = dateDiffHours(task.created_at, task.updated_at);
    const p = (task.priority as TaskPriority) || "medium";
    times.push({ time: hours, priority: p });
    if (byPriority[p]) byPriority[p].push(hours);
  });

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    weighted_average_hours: calculateWeightedAverage(times),
    by_priority: {
      urgent: byPriority.urgent.length ? avg(byPriority.urgent) : null,
      important: byPriority.important.length ? avg(byPriority.important) : null,
      medium: byPriority.medium.length ? avg(byPriority.medium) : null,
      low: byPriority.low.length ? avg(byPriority.low) : null,
    },
  };
}
