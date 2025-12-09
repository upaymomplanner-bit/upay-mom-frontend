import {
  getSupabase,
  TaskScopeFilters,
  DateRangeFilters,
  dateDiffHours,
  isOverdue,
} from "./utils";

export interface TeamClosureMetric {
  team_id: string;
  team_name: string;
  city_id: string;
  department_id: string;
  completed_tasks: number;
  average_close_hours: number;
  overdue_tasks: number;
}

export interface TeamSupportMetric {
  team_id: string;
  team_name: string;
  city_id: string | null;
  department_id: string | null;
  critical_issues: number; // overdue + urgent + stuck in_progress > 7 days
  average_close_hours: number;
  overdue_tasks: number;
}

export async function getTeamClosureTimes(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<TeamClosureMetric[]> {
  const supabase = getSupabase();

  let query = supabase.from("tasks").select(`
      id, status, created_at, updated_at, due_date,
      assignee:profiles!inner (
        team:teams!inner (
          id, name, city_id, department_id
        )
      )
    `);

  if (filters.cityId) query = query.eq("assignee.team.city_id", filters.cityId);
  if (filters.departmentId)
    query = query.eq("assignee.team.department_id", filters.departmentId); // Note: tasks.department_id vs team.department_id. Using team's department context here.
  if (filters.teamId) query = query.eq("assignee.team.id", filters.teamId);
  if (filters.from)
    query = query.gte("created_at", new Date(filters.from).toISOString());
  if (filters.to)
    query = query.lte("created_at", new Date(filters.to).toISOString());

  const { data: tasks, error } = await query;
  if (error) throw error;

  const teamMap: Record<
    string,
    {
      name: string;
      cityId: string;
      deptId: string;
      completed: number;
      totalTime: number;
      closedCount: number;
      overdue: number;
    }
  > = {};

  const now = new Date();

  tasks.forEach((task) => {
    // @ts-ignore - nested types from supabase join can be tricky to infer perfectly without generated types
    const team = task.assignee?.team;
    if (!team) return;

    if (!teamMap[team.id]) {
      teamMap[team.id] = {
        name: team.name,
        cityId: team.city_id,
        deptId: team.department_id,
        completed: 0,
        totalTime: 0,
        closedCount: 0,
        overdue: 0,
      };
    }

    if (task.status === "completed") {
      teamMap[team.id].completed++;
      if (task.updated_at) {
        teamMap[team.id].totalTime += dateDiffHours(
          task.created_at,
          task.updated_at
        );
        teamMap[team.id].closedCount++;
      }
    }

    if (isOverdue(task as any, now)) {
      teamMap[team.id].overdue++;
    }
  });

  return Object.keys(teamMap).map((tid) => {
    const t = teamMap[tid];
    return {
      team_id: tid,
      team_name: t.name,
      city_id: t.cityId,
      department_id: t.deptId,
      completed_tasks: t.completed,
      average_close_hours: t.closedCount > 0 ? t.totalTime / t.closedCount : 0,
      overdue_tasks: t.overdue,
    };
  });
}

export async function getTeamsNeedingSupport(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<TeamSupportMetric[]> {
  const supabase = getSupabase();
  const now = new Date();

  // "Issues faced" logic:
  // - tasks overdue
  // - tasks priority = 'urgent'
  // - tasks stuck in 'in_progress' > 7 days

  let query = supabase.from("tasks").select(`
      id, status, priority, due_date, created_at, updated_at,
      assignee:profiles!inner (
        team:teams!inner (
          id, name, city_id, department_id
        )
      )
    `);

  // Apply filters
  if (filters.cityId) query = query.eq("assignee.team.city_id", filters.cityId);
  if (filters.departmentId)
    query = query.eq("assignee.team.department_id", filters.departmentId);
  if (filters.teamId) query = query.eq("assignee.team.id", filters.teamId);
  if (filters.from)
    query = query.gte("created_at", new Date(filters.from).toISOString());
  if (filters.to)
    query = query.lte("created_at", new Date(filters.to).toISOString());

  const { data: tasks, error } = await query;
  if (error) throw error;

  const teamMetrics: Record<string, TeamSupportMetric> = {};

  tasks.forEach((task) => {
    // @ts-ignore
    const team = task.assignee?.team;
    if (!team) return;

    if (!teamMetrics[team.id]) {
      teamMetrics[team.id] = {
        team_id: team.id,
        team_name: team.name,
        city_id: team.city_id,
        department_id: team.department_id,
        critical_issues: 0,
        average_close_hours: 0, // Placeholder, calculated properly if needed, but here we rank by issues
        overdue_tasks: 0,
      };
    }

    const t = teamMetrics[team.id];
    let isCritical = false;

    // 1. Overdue
    if (isOverdue(task as any, now)) {
      t.overdue_tasks++;
      isCritical = true;
    }

    // 2. Urgent
    if (task.priority === "urgent") {
      isCritical = true;
    }

    // 3. Stuck in progress > 7 days
    if (task.status === "in_progress") {
      const daysInProgress = dateDiffHours(task.created_at || now, now) / 24;
      // Assumption: created_at is start. If we tracked state changes we'd use that.
      if (daysInProgress > 7) isCritical = true;
    }

    if (isCritical) t.critical_issues++;
  });

  // Calculate Average Close Hours for context (optional but requested in return shape)
  // We reuse logic from getTeamClosureTimes effectively.
  // For efficiency, could be merged. For now, we'll do a quick pass on completed tasks in the same set.
  const teamTimes: Record<string, { total: number; count: number }> = {};

  tasks.forEach((task) => {
    // @ts-ignore
    const tid = task.assignee?.team?.id;
    if (!tid) return;
    if (task.status === "completed" && task.updated_at) {
      if (!teamTimes[tid]) teamTimes[tid] = { total: 0, count: 0 };
      teamTimes[tid].total += dateDiffHours(task.created_at, task.updated_at);
      teamTimes[tid].count++;
    }
  });

  Object.values(teamMetrics).forEach((tm) => {
    const timeData = teamTimes[tm.team_id];
    if (timeData && timeData.count > 0) {
      tm.average_close_hours = timeData.total / timeData.count;
    }
  });

  // Rank/Sort by critical issues desc
  return Object.values(teamMetrics).sort(
    (a, b) => b.critical_issues - a.critical_issues
  );
}
