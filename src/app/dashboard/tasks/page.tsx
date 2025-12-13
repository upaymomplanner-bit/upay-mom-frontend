import { createClient } from "@/lib/supabase/server";
import { TasksView } from "@/components/dashboard/tasks-view";

export default async function TasksPage() {
  const supabase = await createClient();

  // Fetch all tasks with metadata
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      due_date,
      metadata,
      meeting:meetings(id, title),
      assignee:profiles(full_name, email)
    `
    )
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
  }

  return <TasksView tasks={tasks || []} />;
}
