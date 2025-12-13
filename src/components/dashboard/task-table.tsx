"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "completed";
  priority: "urgent" | "important" | "medium" | "low";
  due_date: string | null;
  assignee: {
    full_name: string | null;
  } | null;
}

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    task.status === "completed"
                      ? "default"
                      : task.status === "in_progress"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {task.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    task.priority === "urgent"
                      ? "destructive"
                      : task.priority === "important"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>{task.assignee?.full_name || "Unassigned"}</TableCell>
              <TableCell>
                {task.due_date
                  ? format(new Date(task.due_date), "MMM d, yyyy")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center h-24 text-muted-foreground"
              >
                No tasks found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
