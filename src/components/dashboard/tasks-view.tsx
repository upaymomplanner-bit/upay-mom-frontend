"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Search,
  ListChecks,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  title: string;
}

interface TaskMetadata {
  plan_title?: string;
  assignee_names?: string[];
  checklist_items?: ChecklistItem[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
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

// Normalized task type after processing
interface NormalizedTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  metadata: TaskMetadata;
  meeting: { id: string; title: string } | null;
  assignee: { full_name: string | null; email: string } | null;
}

interface TasksViewProps {
  tasks: Task[];
}

type StatusFilter = "all" | "todo" | "in_progress" | "completed";

// Helper to normalize Supabase relation data (handles both single object and array formats)
function normalizeRelation<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  return data;
}

export function TasksView({ tasks: rawTasks }: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(
    new Set()
  );
  const [initialized, setInitialized] = useState(false);

  // Normalize tasks to handle Supabase array relations
  const tasks: NormalizedTask[] = useMemo(() => {
    return rawTasks.map((task) => ({
      ...task,
      meeting: normalizeRelation(task.meeting),
      assignee: normalizeRelation(task.assignee),
      metadata: task.metadata || {},
    }));
  }, [rawTasks]);

  // Filter tasks based on search and status
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === "" ||
        task.meeting?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Group tasks by meeting
  const tasksByMeeting = useMemo(() => {
    const grouped = new Map<
      string,
      { meeting: { id: string; title: string } | null; tasks: NormalizedTask[] }
    >();

    filteredTasks.forEach((task) => {
      const meetingId = task.meeting?.id || "no-meeting";
      const meetingTitle = task.meeting?.title || "No Meeting Associated";

      if (!grouped.has(meetingId)) {
        grouped.set(meetingId, {
          meeting: task.meeting || { id: "no-meeting", title: meetingTitle },
          tasks: [],
        });
      }
      grouped.get(meetingId)!.tasks.push(task);
    });

    return Array.from(grouped.values());
  }, [filteredTasks]);

  // Initialize expanded meetings on mount
  useEffect(() => {
    if (!initialized && tasksByMeeting.length > 0) {
      setExpandedMeetings(
        new Set(tasksByMeeting.map((g) => g.meeting?.id || "no-meeting"))
      );
      setInitialized(true);
    }
  }, [tasksByMeeting, initialized]);

  // Count tasks by status (from original data, not filtered)
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleMeetingExpanded = (meetingId: string) => {
    setExpandedMeetings((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) {
        next.delete(meetingId);
      } else {
        next.add(meetingId);
      }
      return next;
    });
  };

  const getPriorityVariant = (
    priority: string
  ): "destructive" | "secondary" | "default" | "outline" => {
    switch (priority) {
      case "high":
      case "urgent":
        return "destructive";
      case "medium":
      case "important":
        return "secondary";
      case "low":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "todo":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "todo":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

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
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoCount}</div>
            <p className="text-xs text-muted-foreground">Not started</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by meeting name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks grouped by Meeting */}
      <div className="space-y-4">
        {tasksByMeeting.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks found matching your filters
            </CardContent>
          </Card>
        ) : (
          tasksByMeeting.map(({ meeting, tasks: meetingTasks }) => {
            const meetingId = meeting?.id || "no-meeting";
            const isMeetingExpanded = expandedMeetings.has(meetingId);

            const meetingTodoCount = meetingTasks.filter(
              (t) => t.status === "todo"
            ).length;
            const meetingInProgressCount = meetingTasks.filter(
              (t) => t.status === "in_progress"
            ).length;
            const meetingCompletedCount = meetingTasks.filter(
              (t) => t.status === "completed"
            ).length;

            return (
              <Card
                key={meetingId}
                className="overflow-hidden"
              >
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleMeetingExpanded(meetingId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMeetingExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">
                        {meeting?.title || "No Meeting Associated"}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3" />
                        {meetingTodoCount}
                      </Badge>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3" />
                        {meetingInProgressCount}
                      </Badge>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3" />
                        {meetingCompletedCount}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {isMeetingExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {meetingTasks.map((task) => {
                        const isTaskExpanded = expandedTasks.has(task.id);
                        const hasMetadata =
                          task.metadata &&
                          (task.metadata.plan_title ||
                            (task.metadata.checklist_items &&
                              task.metadata.checklist_items.length > 0) ||
                            (task.metadata.assignee_names &&
                              task.metadata.assignee_names.length > 0));
                        const checklistItems =
                          task.metadata?.checklist_items || [];
                        const totalChecklist = checklistItems.length;

                        return (
                          <div
                            key={task.id}
                            className="border rounded-lg overflow-hidden"
                          >
                            {/* Task Header */}
                            <div
                              className={cn(
                                "p-4 flex items-start gap-3 transition-colors",
                                hasMetadata &&
                                  "cursor-pointer hover:bg-muted/50"
                              )}
                              onClick={() =>
                                hasMetadata && toggleTaskExpanded(task.id)
                              }
                            >
                              {/* Expand/Collapse Icon */}
                              <div className="mt-0.5">
                                {hasMetadata ? (
                                  isTaskExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )
                                ) : (
                                  <div className="w-4" />
                                )}
                              </div>

                              {/* Status Icon */}
                              <div className="mt-0.5">
                                {getStatusIcon(task.status)}
                              </div>

                              {/* Task Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">
                                      {task.title}
                                    </span>
                                    <Badge
                                      variant={getPriorityVariant(
                                        task.priority
                                      )}
                                    >
                                      {task.priority}
                                    </Badge>
                                    {totalChecklist > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <ListChecks className="h-3 w-3" />
                                        {totalChecklist} items
                                      </span>
                                    )}
                                  </div>
                                  <Badge
                                    variant={getStatusVariant(task.status)}
                                  >
                                    {task.status.replace("_", " ")}
                                  </Badge>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                                  {task.due_date && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Due:{" "}
                                      {format(new Date(task.due_date), "PPP")}
                                    </div>
                                  )}
                                  {task.assignee && (
                                    <div className="flex items-center gap-1">
                                      <span>
                                        Assigned to:{" "}
                                        {task.assignee.full_name ||
                                          task.assignee.email}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Metadata (Expandable) */}
                            {isTaskExpanded && hasMetadata && (
                              <div className="border-t bg-muted/30 px-4 py-3">
                                <div className="ml-8 space-y-3">
                                  {/* Plan Title */}
                                  {task.metadata.plan_title && (
                                    <div>
                                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                        Plan
                                      </h4>
                                      <p className="text-sm">
                                        {task.metadata.plan_title}
                                      </p>
                                    </div>
                                  )}

                                  {/* Assignee Names from Metadata */}
                                  {task.metadata.assignee_names &&
                                    task.metadata.assignee_names.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                          Additional Assignees
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                          {task.metadata.assignee_names.map(
                                            (name, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="outline"
                                              >
                                                {name}
                                              </Badge>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Checklist Items */}
                                  {checklistItems.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                        Checklist Items
                                      </h4>
                                      <div className="space-y-2">
                                        {checklistItems.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2"
                                          >
                                            <div className="h-4 w-4 rounded border border-border flex items-center justify-center">
                                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                            </div>
                                            <span className="text-sm">
                                              {item.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
