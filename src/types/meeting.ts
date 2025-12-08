// Types for parsed meeting data from backend /transcripts/process endpoint

export interface ChecklistItem {
  title: string;
}

export interface Assignment {
  assignee_name: string;
  assignee_email: string | null;
}

export interface TaskDetails {
  description: string;
  checklist_items: ChecklistItem[];
}

export interface ParsedTask {
  title: string;
  details: TaskDetails;
  assignments: Assignment[];
  due_date: string | null;
  startDateTime: string;
  priority: string;
}

export interface PlanAssociation {
  association_type: "new" | "existing";
  plan_title: string;
  plan_reference: string | null;
  rationale: string;
}

export interface TaskGroup {
  plan_association: PlanAssociation;
  tasks: ParsedTask[];
  group_description: string;
}

export interface MeetingDetails {
  meeting_title: string | null;
  meeting_date: string;
  meeting_type?: string;
}

export interface ParsedMeetingResponse {
  meeting_details: MeetingDetails;
  task_groups: TaskGroup[];
  action_items_count: number;
  meeting_date: string;
  meeting_summary: string;
}

// Editable versions for the review page
export interface EditableTask extends ParsedTask {
  id: string; // Temporary ID for editing
  assignee_id?: string; // Selected user ID from dropdown
  goal_id?: string; // Selected goal ID
  department_id?: string; // Selected department ID
}

export interface EditableTaskGroup extends Omit<TaskGroup, "tasks"> {
  tasks: EditableTask[];
}

export interface EditableMeetingData
  extends Omit<ParsedMeetingResponse, "task_groups"> {
  task_groups: EditableTaskGroup[];
}

// Payload for saving to backend
export interface SaveMeetingPayload {
  meeting_details: MeetingDetails;
  task_groups: TaskGroup[];
  action_items_count: number;
  meeting_date: string;
  meeting_summary: string;
}
