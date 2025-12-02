import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default async function TasksPage() {
  const supabase = await createClient();

  // Fetch all tasks
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
      meeting:meetings(title),
      assignee:profiles(full_name, email)
    `
    )
    .order("due_date", { ascending: true });

  // Group tasks by status
  const todoTasks = tasks?.filter((t) => t.status === "todo") || [];
  const inProgressTasks =
    tasks?.filter((t) => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "todo":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const TaskCard = ({ task }: { task: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Due: {format(new Date(task.due_date), "PPP")}
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1">
                  <span>
                    Assigned to:{" "}
                    {task.assignee.full_name || task.assignee.email}
                  </span>
                </div>
              )}
              {task.meeting && (
                <div className="flex items-center gap-1">
                  <span>Meeting: {task.meeting.title}</span>
                </div>
              )}
            </div>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              task.status
            )}`}
          >
            {task.status.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            View and manage all your tasks
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length}</div>
            <p className="text-xs text-muted-foreground">Not started</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>

      {/* To Do Tasks */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">To Do</h3>
        {todoTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks to do
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </div>

      {/* In Progress Tasks */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">In Progress</h3>
        {inProgressTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks in progress
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Completed</h3>
        {completedTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No completed tasks
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedTasks.slice(0, 10).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
