import {
  getSupabase,
  DateRangeFilters,
  dateDiffHours,
  isOverdue,
  TaskPriority,
  calculateWeightedAverage,
  groupTasksByDepartment,
} from "./utils";

// Types for City Analytics
export interface CityTaskSummary {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  overdue_tasks: number;
}

export interface CityPriorityDistribution {
  urgent: number;
  important: number;
  medium: number;
  low: number;
}

export interface CitySLAMetrics {
  average_time_to_close_hours: number;
  median_time_to_close_hours: number;
  distribution_by_priority: {
    urgent: number;
    important: number;
    medium: number;
    low: number;
  };
}

export interface DepartmentInCityMetrics {
  department_id: string;
  department_name: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  average_close_time_hours: number;
}

export interface CityGoalProgress {
  goal: {
    id: string;
    title: string;
    status: string | null;
    department_id: string | null;
  };
  total_tasks: number;
  completed_tasks: number;
  progress_percent: number;
}

export interface CityOverviewData {
  summary: CityTaskSummary;
  priority_distribution: CityPriorityDistribution;
  sla_metrics: CitySLAMetrics;
  department_breakdown: DepartmentInCityMetrics[];
}

// Helpers
function median(values: number[]): number {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

// ------------------------------------------------------------------
// API Functions
// ------------------------------------------------------------------

export async function getCityOverview(
  cityId: string,
  filters?: DateRangeFilters
): Promise<CityOverviewData> {
  const supabase = getSupabase();

  // 1. Identify relevant departments and teams for this city
  // Fetch teams in this city to get their IDs and department IDs
  const { data: cityTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, department_id, name")
    .eq("city_id", cityId);

  if (teamsError) throw teamsError;

  const teamIds = cityTeams.map((t) => t.id);
  const departmentIds = Array.from(
    new Set(cityTeams.map((t) => t.department_id).filter(Boolean))
  ) as string[];

  if (teamIds.length === 0 && departmentIds.length === 0) {
    // Return empty state if no teams/departments found in city
    return {
      summary: {
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        todo_tasks: 0,
        overdue_tasks: 0,
      },
      priority_distribution: { urgent: 0, important: 0, medium: 0, low: 0 },
      sla_metrics: {
        average_time_to_close_hours: 0,
        median_time_to_close_hours: 0,
        distribution_by_priority: {
          urgent: 0,
          important: 0,
          medium: 0,
          low: 0,
        },
      },
      department_breakdown: [],
    };
  }

  // 2. Fetch Tasks
  // We need tasks that match:
  // - assignee in one of teamIds
  // OR
  // - department_id in departmentIds
  // AND
  // - Date filters if applied (on created_at usually, or updated_at?)
  // The prompt implies filtering "tasks" in general. Usually "Overview" implies activity within a period or state of tasks created in a period.
  // We'll apply date filter to `created_at` for task volume counts, but be careful with "completed in period".
  // For simplicity and consistency with standard analytics, we'll fetch tasks *active* or *created* or *completed* in the period?
  // Use `created_at` for filtering the "set of tasks" we analyze, unless specified otherwise.
  // Prompt says: "Input... Optional filters: from, to"

  let query = supabase.from("tasks").select(`
      id, title, status, priority, due_date, created_at, updated_at,
      department_id,
      assignee_id,
      assignee:profiles!tasks_assignee_id_fkey (
        team_id
      ),
      department:departments ( id, name )
    `);

  // Simple date filtering on created_at for the "Overview" scope
  if (filters?.from)
    query = query.gte("created_at", new Date(filters.from).toISOString());
  if (filters?.to)
    query = query.lte("created_at", new Date(filters.to).toISOString());

  const { data: rawTasks, error: tasksError } = await query;
  if (tasksError) throw tasksError;

  // Client-side filtering for the OR condition (City Logic)
  // "Tasks where: department has team in city OR assignee belongs to team in city"

  // Note: We need to check the task's assignee's team_id.

  const relevantTasks = rawTasks.filter((task) => {
    const taskTeamId = task.assignee?.team_id;
    const isAssigneeInCity = taskTeamId && teamIds.includes(taskTeamId);
    const isDepartmentInCity =
      task.department_id && departmentIds.includes(task.department_id);

    return isAssigneeInCity || isDepartmentInCity;
  });

  // A. City Task Summary
  const summary: CityTaskSummary = {
    total_tasks: relevantTasks.length,
    completed_tasks: 0,
    in_progress_tasks: 0,
    todo_tasks: 0,
    overdue_tasks: 0,
  };

  const priorityDist: CityPriorityDistribution = {
    urgent: 0,
    important: 0,
    medium: 0,
    low: 0,
  };
  const closedTasksTimes: { time: number; priority: TaskPriority }[] = [];
  const priorityTimes: Record<string, number[]> = {
    urgent: [],
    important: [],
    medium: [],
    low: [],
  };

  const now = new Date();

  // D. Department Breakdown prep
  const deptTasksMap: Record<string, typeof relevantTasks> = {};

  for (const task of relevantTasks) {
    // Status counts
    if (task.status === "completed") summary.completed_tasks++;
    else if (task.status === "in_progress") summary.in_progress_tasks++;
    else summary.todo_tasks++;

    // Overdue check
    if (isOverdue(task as any, now)) summary.overdue_tasks++;

    // Priority
    const p = (task.priority as TaskPriority) || "medium"; // default to medium if null, or skip
    if (
      task.priority &&
      ["urgent", "important", "medium", "low"].includes(task.priority)
    ) {
      priorityDist[task.priority as keyof CityPriorityDistribution]++;
    }

    // SLA / Time metrics (only for completed)
    if (task.status === "completed" && task.updated_at) {
      const hours = dateDiffHours(task.created_at, task.updated_at);
      closedTasksTimes.push({ time: hours, priority: p });
      if (priorityTimes[p]) priorityTimes[p].push(hours);
    }

    // Group for Department Breakdown
    if (task.department_id) {
      if (!deptTasksMap[task.department_id])
        deptTasksMap[task.department_id] = [];
      deptTasksMap[task.department_id].push(task);
    }
  }

  // C. SLA / Time calculation
  const totalClosed = closedTasksTimes.length;
  const average_time =
    totalClosed > 0
      ? closedTasksTimes.reduce((acc, v) => acc + v.time, 0) / totalClosed
      : 0;
  const median_time = median(closedTasksTimes.map((v) => v.time));

  const sla_metrics: CitySLAMetrics = {
    average_time_to_close_hours: average_time,
    median_time_to_close_hours: median_time,
    distribution_by_priority: {
      urgent: priorityTimes["urgent"].length
        ? priorityTimes["urgent"].reduce((a, b) => a + b, 0) /
          priorityTimes["urgent"].length
        : 0,
      important: priorityTimes["important"].length
        ? priorityTimes["important"].reduce((a, b) => a + b, 0) /
          priorityTimes["important"].length
        : 0,
      medium: priorityTimes["medium"].length
        ? priorityTimes["medium"].reduce((a, b) => a + b, 0) /
          priorityTimes["medium"].length
        : 0,
      low: priorityTimes["low"].length
        ? priorityTimes["low"].reduce((a, b) => a + b, 0) /
          priorityTimes["low"].length
        : 0,
    },
  };

  // D. Department Breakdown
  // Only for departments relevant to the city (those in departmentIds list? Or those that have tasks involved?)
  // Prompt: "For each department that has tasks relevant to that city"
  const department_breakdown: DepartmentInCityMetrics[] = [];

  for (const [deptId, tasks] of Object.entries(deptTasksMap)) {
    // Only include if this department is "in the city" (has a team there) OR specifically requested?
    // "For each department that has tasks relevant to that city" -> Since we already filtered relevantTasks, all here are relevant.
    // We might want to just show them all.

    // Calculate metrics for this department subset
    let deptCompleted = 0;
    let deptOverdue = 0;
    let deptTotalTime = 0;
    let deptClosedCount = 0;

    tasks.forEach((t) => {
      if (t.status === "completed") {
        deptCompleted++;
        if (t.updated_at) {
          deptTotalTime += dateDiffHours(t.created_at, t.updated_at);
          deptClosedCount++;
        }
      }
      if (isOverdue(t as any, now)) deptOverdue++;
    });

    department_breakdown.push({
      department_id: deptId,
      department_name: tasks[0].department?.name || "Unknown",
      total_tasks: tasks.length,
      completed_tasks: deptCompleted,
      overdue_tasks: deptOverdue,
      average_close_time_hours:
        deptClosedCount > 0 ? deptTotalTime / deptClosedCount : 0,
    });
  }

  return {
    summary,
    priority_distribution: priorityDist,
    sla_metrics,
    department_breakdown,
  };
}

export async function getCityGoalProgress(
  cityId: string,
  filters?: DateRangeFilters
): Promise<CityGoalProgress[]> {
  const supabase = getSupabase();

  // 1. Get departments in city
  const { data: cityTeams } = await supabase
    .from("teams")
    .select("department_id")
    .eq("city_id", cityId);
  const departmentIds =
    Array.from(
      new Set(cityTeams?.map((t) => t.department_id).filter(Boolean))
    ) || [];

  if (departmentIds.length === 0) return [];

  // 2. Fetch Goals for these departments
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select(
      `
      id, title, status, department_id,
      tasks (
        id, status, created_at
      )
    `
    )
    .in("department_id", departmentIds);

  if (goalsError) throw goalsError;

  // 3. Process Goals
  // "Connected to departments in the city".
  // We need to respect date filters? "filters?: DateRangeFilters" for task counting probably?

  return goals.map((goal) => {
    // Filter tasks if needed by date
    let tasks = goal.tasks || [];
    if (filters?.from)
      tasks = tasks.filter(
        (t) => new Date(t.created_at) >= new Date(filters.from!)
      );
    if (filters?.to)
      tasks = tasks.filter(
        (t) => new Date(t.created_at) <= new Date(filters.to!)
      );

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;

    return {
      goal: {
        id: goal.id,
        title: goal.title,
        status: goal.status,
        department_id: goal.department_id,
      },
      total_tasks: total,
      completed_tasks: completed,
      progress_percent: total > 0 ? (completed / total) * 100 : 0,
    };
  });
}
