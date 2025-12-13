"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EditableTaskGroup, EditableTask } from "@/types/meeting";
import { TaskReviewCard } from "./task-review-card";
import { Target, Lightbulb } from "lucide-react";

interface TaskGroupSectionProps {
  taskGroup: EditableTaskGroup;
  users: Array<{ id: string; full_name: string; email: string }>;
  onUpdateTask: (
    groupIndex: number,
    taskIndex: number,
    updatedTask: EditableTask
  ) => void;
  onDeleteTask: (groupIndex: number, taskId: string) => void;
  groupIndex: number;
}

export function TaskGroupSection({
  taskGroup,
  users,
  onUpdateTask,
  onDeleteTask,
  groupIndex,
}: TaskGroupSectionProps) {
  const getAssociationVariant = (type: string): "default" | "secondary" => {
    return type === "new" ? "default" : "secondary";
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 bg-muted/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Target className="h-5 w-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">
                  {taskGroup.plan_association.plan_title}
                </CardTitle>
                <Badge
                  variant={getAssociationVariant(
                    taskGroup.plan_association.association_type
                  )}
                >
                  {taskGroup.plan_association.association_type === "new"
                    ? "New Plan"
                    : "Existing Plan"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {taskGroup.group_description}
              </p>

              {taskGroup.plan_association.rationale && (
                <div className="flex items-start gap-2 p-3 bg-accent rounded-md">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Rationale: </span>
                    <span className="text-muted-foreground">
                      {taskGroup.plan_association.rationale}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{taskGroup.tasks.length}</span>
            {taskGroup.tasks.length === 1 ? "task" : "tasks"} in this group
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
        {taskGroup.tasks.map((task, taskIndex) => (
          <TaskReviewCard
            key={task.id}
            task={task}
            users={users}
            onUpdate={(updatedTask) =>
              onUpdateTask(groupIndex, taskIndex, updatedTask)
            }
            onDelete={(taskId) => onDeleteTask(groupIndex, taskId)}
          />
        ))}
      </div>
    </div>
  );
}
