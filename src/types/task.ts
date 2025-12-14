// Database types for tasks
export interface ChecklistItem {
  title: string;
}

export interface TaskMetadata {
  plan_title?: string;
  assignee_names?: string[];
  checklist_items?: ChecklistItem[];
}

// Task from Supabase with relations
export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "urgent" | "important" | "medium" | "low";
  due_date: string | null;
  metadata: TaskMetadata | null;
  meeting:
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null;
  assignee:
    | { full_name: string | null; email: string }
    | { full_name: string | null; email: string }[]
    | null;
}

// Normalized task type after processing (single relations, not arrays)
export interface NormalizedTask {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "urgent" | "important" | "medium" | "low";
  due_date: string | null;
  metadata: TaskMetadata;
  meeting: { id: string; title: string } | null;
  assignee: { full_name: string | null; email: string } | null;
}

export type StatusFilter = "all" | "todo" | "in_progress" | "completed";
