import {
  getSupabase,
  GoalScopeFilters,
  DateRangeFilters,
  isOverdue,
  TaskPriority,
} from "./utils";

export interface GoalSummary {
  goal: {
    id: string;
    title: string;
    description: string | null;
    year: number;
    quarter: number | null;
    status: string | null;
    department_id: string | null;
  };
  total_tasks: number;
  completed_tasks: number;
  at_risk_tasks: number;
  progress_percent: number;
}

export async function getGoalSummary(
  filters: GoalScopeFilters & DateRangeFilters
): Promise<GoalSummary[]> {
  const supabase = getSupabase();
  const now = new Date();

  // Fetch Goals
  // We need goals that belong to the scope.
  // Goals have department_id.
  // If City/Team filter is active, we check departments?
  // "Using tasks.goal_id and goals"
  // "For a given filter... Compute for each goal"

  // Strategy:
  // 1. Determine relevant goals.
  // 2. Fetch those goals with their tasks.
  // 3. Calculate metrics.

  let query = supabase.from("goals").select(`
      id, title, description, year, quarter, status, department_id,
      tasks (
        id, status, priority, due_date, created_at, updated_at
      )
    `);

  // Scope Filtering for Goals
  if (filters.departmentId) {
    query = query.eq("department_id", filters.departmentId);
  } else if (filters.cityId || filters.teamId) {
    // If City/Team filter, we need to map that to Departments?
    // OR we just find goals that HAVE TASKS matching that city/team?
    // This is safer. A goal might be "Department Wide", but if we view "City A", we want to see progress of that goal IN City A?
    // Prompt: "Filter goals for... specific city... specific team".
    // "Map tasks to goals and show progress".
    // This implies showing the goal IF it's relevant, and showing progress BASED ON the scope.
    // We will clean the task list in memory.
    // But we need to fetch all goals? Or strict goals?
    // Let's fetch goals for the *departments* involved in the filtered City/Team first to narrow down.
    // Simplification: query tasks matching the scope -> get distinct goal_ids -> fetch those goals.
    // This requires two steps but is accurate.
  }

  // Two-step approach for City/Team scope to be efficient and accurate
  let goalIds: string[] | null = null;

  if (filters.cityId || filters.teamId) {
    let taskQuery = supabase
      .from("tasks")
      .select("goal_id, assignee:profiles!inner(team:teams!inner(id, city_id))")
      .not("goal_id", "is", null);
    if (filters.cityId)
      taskQuery = taskQuery.eq("assignee.team.city_id", filters.cityId);
    if (filters.teamId)
      taskQuery = taskQuery.eq("assignee.team.id", filters.teamId);

    const { data: relevantTasks } = await taskQuery;
    if (relevantTasks) {
      goalIds = Array.from(
        new Set(relevantTasks.map((t) => t.goal_id).filter(Boolean))
      ) as string[];
    }

    if (goalIds && goalIds.length === 0) return []; // No goals found for this scope
    if (goalIds) query = query.in("id", goalIds);
  }

  const { data: goals, error } = await query;
  if (error) throw error;

  const results: GoalSummary[] = [];

  for (const goal of goals) {
    let tasks = goal.tasks || [];

    // Apply Date Filters to tasks
    if (filters.from)
      tasks = tasks.filter(
        (t: any) => new Date(t.created_at) >= new Date(filters.from!)
      );
    if (filters.to)
      tasks = tasks.filter(
        (t: any) => new Date(t.created_at) <= new Date(filters.to!)
      );

    // Calculate metrics
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === "completed").length;

    let at_risk = 0;
    tasks.forEach((t: any) => {
      if (t.status !== "completed") {
        if (isOverdue(t, now) || t.priority === "urgent") {
          at_risk++;
        }
      }
    });

    results.push({
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        year: goal.year,
        quarter: goal.quarter,
        status: goal.status,
        department_id: goal.department_id,
      },
      total_tasks: total,
      completed_tasks: completed,
      at_risk_tasks: at_risk,
      progress_percent: total > 0 ? (completed / total) * 100 : 0,
    });
  }

  return results;
}
