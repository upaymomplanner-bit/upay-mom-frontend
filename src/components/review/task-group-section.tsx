"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  EditableTaskGroup,
  EditableTask,
  PlanAssociation,
} from "@/types/meeting";
import { TaskReviewCard } from "./task-review-card";
import {
  Target,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Plus,
} from "lucide-react";

interface TaskGroupSectionProps {
  taskGroup: EditableTaskGroup;
  users: Array<{ id: string; full_name: string; email: string }>;
  onUpdateTask: (
    groupIndex: number,
    taskIndex: number,
    updatedTask: EditableTask
  ) => void;
  onDeleteTask: (groupIndex: number, taskId: string) => void;
  onUpdateGroup: (groupIndex: number, updatedGroup: EditableTaskGroup) => void;
  onAddTask: (groupIndex: number) => void;
  groupIndex: number;
}

export function TaskGroupSection({
  taskGroup,
  users,
  onUpdateTask,
  onDeleteTask,
  onUpdateGroup,
  onAddTask,
  groupIndex,
}: TaskGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroup, setEditedGroup] = useState<EditableTaskGroup>(taskGroup);

  const getAssociationVariant = (type: string): "default" | "secondary" => {
    return type === "new" ? "default" : "secondary";
  };

  const handleSave = () => {
    onUpdateGroup(groupIndex, editedGroup);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGroup(taskGroup);
    setIsEditing(false);
  };

  const handleUpdatePlanAssociation = (
    field: keyof PlanAssociation,
    value: string
  ) => {
    setEditedGroup({
      ...editedGroup,
      plan_association: {
        ...editedGroup.plan_association,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <Card className="border-2 bg-muted/30">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`plan-title-${groupIndex}`}>
                        Plan/Goal Title
                      </Label>
                      <Input
                        id={`plan-title-${groupIndex}`}
                        value={editedGroup.plan_association.plan_title}
                        onChange={(e) =>
                          handleUpdatePlanAssociation(
                            "plan_title",
                            e.target.value
                          )
                        }
                        className="text-xl font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`plan-type-${groupIndex}`}>
                        Association Type
                      </Label>
                      <Select
                        value={editedGroup.plan_association.association_type}
                        onValueChange={(value: "new" | "existing") =>
                          handleUpdatePlanAssociation("association_type", value)
                        }
                      >
                        <SelectTrigger id={`plan-type-${groupIndex}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New Plan</SelectItem>
                          <SelectItem value="existing">
                            Existing Plan
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`plan-reference-${groupIndex}`}>
                        Plan Reference (Optional)
                      </Label>
                      <Input
                        id={`plan-reference-${groupIndex}`}
                        value={
                          editedGroup.plan_association.plan_reference || ""
                        }
                        onChange={(e) =>
                          handleUpdatePlanAssociation(
                            "plan_reference",
                            e.target.value
                          )
                        }
                        placeholder="Enter reference ID or name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`group-desc-${groupIndex}`}>
                        Group Description
                      </Label>
                      <Textarea
                        id={`group-desc-${groupIndex}`}
                        value={editedGroup.group_description}
                        onChange={(e) =>
                          setEditedGroup({
                            ...editedGroup,
                            group_description: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`plan-rationale-${groupIndex}`}>
                        Rationale
                      </Label>
                      <Textarea
                        id={`plan-rationale-${groupIndex}`}
                        value={editedGroup.plan_association.rationale || ""}
                        onChange={(e) =>
                          handleUpdatePlanAssociation(
                            "rationale",
                            e.target.value
                          )
                        }
                        rows={2}
                        placeholder="Why is this plan/goal relevant?"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                        >
                          {isOpen ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="ml-auto"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground ml-12">
                      {taskGroup.group_description}
                    </p>

                    {taskGroup.plan_association.rationale && (
                      <div className="flex items-start gap-2 p-3 bg-accent rounded-md ml-12">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium">Rationale: </span>
                          <span className="text-muted-foreground">
                            {taskGroup.plan_association.rationale}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{taskGroup.tasks.length}</span>
              {taskGroup.tasks.length === 1 ? "task" : "tasks"} in this group
              {!isOpen && (
                <span className="text-xs ml-2">(click chevron to expand)</span>
              )}
            </div>
          </CardContent>
        </Card>

        <CollapsibleContent>
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-border">
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

            {/* Add Task Button */}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => onAddTask(groupIndex)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task to This Group
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
