import {
  getSupabase,
  TaskScopeFilters,
  DateRangeFilters,
  dateDiffHours,
  isOverdue,
  TaskPriority,
} from "./utils";

export interface MeetingSummary {
  meeting_id: string;
  meeting_title: string;
  date: string;
  status: string | null;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  critical_issues: number;
  departments_involved: { id: string; name: string }[];
  teams_involved: { id: string; name: string }[];
}

export interface MeetingComplianceStats {
  summary: {
    total_meetings: number;
    processing: number;
    completed: number;
    failed: number;
  };
  meetings: MeetingSummary[];
}

export async function getMeetingComplianceAnalytics(
  filters: TaskScopeFilters & DateRangeFilters
): Promise<MeetingComplianceStats> {
  const supabase = getSupabase();

  // 1. Fetch Meetings
  // We filter meetings by date
  // And we need to filter by scope?
  // Meetings don't directly have department/team/city. They have host_id.
  // OR they are linked to TASKS which have dept/team.
  // Prompt says: "For a given scope... Compute...".
  // If we filter by City, do we mean "Meetings that discussed tasks relevant to City"? Or "Meetings hosted by people in City"?
  // "tasks linked via tasks.meeting_id" -> This is the strong link.

  // Strategy:
  // Fetch meetings in date range.
  // Join tasks.
  // Filter meetings that have at least one task matching the scope?
  // OR fetch all meetings and just show analytics for tasks WITHIN them that match scope?
  // Usually "Meeting Analytics" means "Analyze the meetings themselves".
  // Let's assume: Fetch meetings. Filter those meetings that are relevant to the scope (have tasks in scope).

  let query = supabase.from("meetings").select(`
      id, title, date, status, summary,
      tasks (
        id, title, status, priority, due_date, created_at, updated_at,
        department:departments ( id, name ),
        assignee:profiles (
          team:teams (
            id, name, city_id, department_id
          )
        )
      )
    `);

  if (filters.from)
    query = query.gte("date", new Date(filters.from).toISOString());
  if (filters.to) query = query.lte("date", new Date(filters.to).toISOString());

  const { data: meetings, error } = await query;
  if (error) throw error;

  const stats: MeetingComplianceStats = {
    summary: { total_meetings: 0, processing: 0, completed: 0, failed: 0 },
    meetings: [],
  };

  const now = new Date();

  for (const meeting of meetings) {
    const tasks = meeting.tasks || [];

    // Check Relevance to Scope
    // If scope filters exist, we only include this meeting if it contains RELEVANT tasks?
    // Or we only count relevant tasks?
    // Let's filter tasks inside the meeting first.

    let relevantTasks = tasks;
    if (filters.cityId)
      relevantTasks = relevantTasks.filter(
        (t: any) => t.assignee?.team?.city_id === filters.cityId
      );
    if (filters.departmentId)
      relevantTasks = relevantTasks.filter(
        (t: any) => t.department?.id === filters.departmentId
      );
    if (filters.teamId)
      relevantTasks = relevantTasks.filter(
        (t: any) => t.assignee?.team?.id === filters.teamId
      );

    // If we have strict scope filters and 0 relevant tasks, maybe we skip the meeting entirely?
    if (
      (filters.cityId || filters.departmentId || filters.teamId) &&
      relevantTasks.length === 0
    ) {
      continue;
    }

    // Update Global Summary (only for included meetings)
    stats.summary.total_meetings++;
    if (meeting.status === "completed") stats.summary.completed++;
    else if (meeting.status === "processing") stats.summary.processing++;
    else if (meeting.status === "failed") stats.summary.failed++;

    // Analyze Tasks
    let completed = 0;
    let open = 0;
    let critical = 0;
    const depts = new Map<string, string>();
    const teams = new Map<string, string>();

    for (const t of relevantTasks) {
      if (t.status === "completed") completed++;
      else open++;

      // Critical Issues
      let isCritical = false;
      if (isOverdue(t as any, now)) isCritical = true;
      if (t.priority === "urgent") isCritical = true;
      if (t.status === "in_progress") {
        const days = dateDiffHours(t.created_at, now) / 24;
        if (days > 7) isCritical = true;
      }
      if (isCritical) critical++;

      // Metadata
      if (t.department) depts.set(t.department.id, t.department.name);
      // @ts-ignore
      if (t.assignee?.team) teams.set(t.assignee.team.id, t.assignee.team.name);
    }

    stats.meetings.push({
      meeting_id: meeting.id,
      meeting_title: meeting.title,
      date: meeting.date,
      status: meeting.status,
      total_tasks: relevantTasks.length,
      completed_tasks: completed,
      open_tasks: open,
      critical_issues: critical,
      departments_involved: Array.from(depts.entries()).map(([id, name]) => ({
        id,
        name,
      })),
      teams_involved: Array.from(teams.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    });
  }

  return stats;
}
