"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EditableTask, ChecklistItem } from "@/types/meeting";
import {
  Pencil,
  Trash2,
  Calendar,
  CheckSquare,
  User,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";

interface TaskReviewCardProps {
  task: EditableTask;
  users: Array<{ id: string; full_name: string; email: string }>;
  onUpdate: (updatedTask: EditableTask) => void;
  onDelete: (taskId: string) => void;
}

export function TaskReviewCard({
  task,
  users,
  onUpdate,
  onDelete,
}: TaskReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const getPriorityVariant = (
    priority: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    const priorityNum = parseInt(priority);
    if (priorityNum <= 2) return "destructive";
    if (priorityNum === 3) return "secondary";
    return "outline";
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      "1": "Urgent",
      "2": "Important",
      "3": "Medium",
      "4": "Low",
      "5": "Low",
    };
    return map[priority] || "Medium";
  };

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleUpdateChecklistItem = (index: number, title: string) => {
    const updatedChecklist = [...editedTask.details.checklist_items];
    updatedChecklist[index] = { title };
    setEditedTask({
      ...editedTask,
      details: {
        ...editedTask.details,
        checklist_items: updatedChecklist,
      },
    });
  };

  const handleAddChecklistItem = () => {
    setEditedTask({
      ...editedTask,
      details: {
        ...editedTask.details,
        checklist_items: [...editedTask.details.checklist_items, { title: "" }],
      },
    });
  };

  const handleRemoveChecklistItem = (index: number) => {
    const updatedChecklist = editedTask.details.checklist_items.filter(
      (_, i) => i !== index
    );
    setEditedTask({
      ...editedTask,
      details: {
        ...editedTask.details,
        checklist_items: updatedChecklist,
      },
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`task-title-${task.id}`}>Task Title</Label>
                  <Input
                    id={`task-title-${task.id}`}
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    className="font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`task-desc-${task.id}`}>Description</Label>
                  <Textarea
                    id={`task-desc-${task.id}`}
                    value={editedTask.details.description}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        details: {
                          ...editedTask.details,
                          description: e.target.value,
                        },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`task-priority-${task.id}`}>Priority</Label>
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value) =>
                      setEditedTask({ ...editedTask, priority: value })
                    }
                  >
                    <SelectTrigger id={`task-priority-${task.id}`}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Urgent</SelectItem>
                      <SelectItem value="2">Important</SelectItem>
                      <SelectItem value="3">Medium</SelectItem>
                      <SelectItem value="4">Low</SelectItem>
                      <SelectItem value="5">Very Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <Badge variant={getPriorityVariant(task.priority)}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                {task.details.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {task.details.description}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(task.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checklist Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckSquare className="h-4 w-4" />
              Checklist Items
            </div>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddChecklistItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              {editedTask.details.checklist_items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={item.title}
                    onChange={(e) =>
                      handleUpdateChecklistItem(idx, e.target.value)
                    }
                    placeholder="Checklist item..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {editedTask.details.checklist_items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No checklist items. Click "Add Item" to create one.
                </p>
              )}
            </div>
          ) : (
            <>
              {task.details.checklist_items.length > 0 ? (
                <ul className="space-y-1">
                  {task.details.checklist_items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary">•</span>
                      {item.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No checklist items
                </p>
              )}
            </>
          )}
        </div>

        {/* Due Date and Assignee */}
        <div className="flex flex-wrap gap-4 text-sm">
          {isEditing ? (
            <>
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label htmlFor={`task-date-${task.id}`}>Due Date</Label>
                <Input
                  id={`task-date-${task.id}`}
                  type="date"
                  value={editedTask.due_date || ""}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, due_date: e.target.value })
                  }
                />
              </div>
              <div className="flex-1 min-w-[200px] space-y-2">
                <Label htmlFor={`task-assignee-${task.id}`}>Assignee</Label>
                <Select
                  value={editedTask.assignee_id || ""}
                  onValueChange={(value) =>
                    setEditedTask({
                      ...editedTask,
                      assignee_id: value,
                    })
                  }
                >
                  <SelectTrigger id={`task-assignee-${task.id}`}>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                      >
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              {task.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Due:{" "}
                    {new Date(task.due_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {task.assignments.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {task.assignments.map((assignment, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs"
                      >
                        {assignment.assignee_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!task.assignee_id && task.assignments.length > 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">Assignee needs to be selected</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
