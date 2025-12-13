"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Save,
  Plus,
} from "lucide-react";
import type {
  ParsedMeetingResponse,
  EditableMeetingData,
  EditableTaskGroup,
  EditableTask,
  Goal,
} from "@/types/meeting";
import { MeetingSummaryCard } from "@/components/review/meeting-summary-card";
import { TaskGroupSection } from "@/components/review/task-group-section";
import { saveMeetingData, getUsers, getGoals } from "@/app/actions/upload";
import { generateTempId } from "@/lib/utils/meeting";

export default function ReviewPage() {
  const router = useRouter();
  const [meetingData, setMeetingData] = useState<EditableMeetingData | null>(
    null
  );
  const [users, setUsers] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    // Load data from session storage
    const dataStr = sessionStorage.getItem("pending-meeting-data");
    if (!dataStr) {
      router.push("/dashboard/upload");
      return;
    }

    try {
      const parsedData: ParsedMeetingResponse = JSON.parse(dataStr);

      // Convert to editable format with temp IDs
      const editableData: EditableMeetingData = {
        ...parsedData,
        task_groups: parsedData.task_groups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => ({
            ...task,
            id: generateTempId(),
          })),
        })),
      };

      setMeetingData(editableData);
    } catch (error) {
      console.error("Failed to parse meeting data:", error);
      setStatus({
        type: "error",
        message: "Failed to load meeting data. Please try uploading again.",
      });
    }

    // Load users and goals
    loadData();
  }, [router]);

  const loadData = async () => {
    const [usersResult, goalsResult] = await Promise.all([
      getUsers(),
      getGoals(),
    ]);

    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data);
    }

    if (goalsResult.success && goalsResult.data) {
      setGoals(goalsResult.data);
    }
  };

  const handleUpdateTitle = (title: string) => {
    if (!meetingData) return;
    setMeetingData({
      ...meetingData,
      meeting_details: {
        ...meetingData.meeting_details,
        meeting_title: title,
      },
    });
  };

  const handleUpdateDate = (date: string) => {
    if (!meetingData) return;
    setMeetingData({
      ...meetingData,
      meeting_details: {
        ...meetingData.meeting_details,
        meeting_date: date,
      },
    });
  };

  const handleUpdateSummary = (summary: string) => {
    if (!meetingData) return;
    setMeetingData({
      ...meetingData,
      meeting_summary: summary,
    });
  };

  const handleUpdateTask = (
    groupIndex: number,
    taskIndex: number,
    updatedTask: EditableTask
  ) => {
    if (!meetingData) return;

    const updatedGroups = [...meetingData.task_groups];
    updatedGroups[groupIndex].tasks[taskIndex] = updatedTask;

    setMeetingData({
      ...meetingData,
      task_groups: updatedGroups,
    });
  };

  const handleDeleteTask = (groupIndex: number, taskId: string) => {
    if (!meetingData) return;

    const updatedGroups = [...meetingData.task_groups];
    updatedGroups[groupIndex].tasks = updatedGroups[groupIndex].tasks.filter(
      (task) => task.id !== taskId
    );

    setMeetingData({
      ...meetingData,
      task_groups: updatedGroups,
    });
  };

  const handleUpdateGroup = (
    groupIndex: number,
    updatedGroup: EditableTaskGroup
  ) => {
    if (!meetingData) return;

    const updatedGroups = [...meetingData.task_groups];
    updatedGroups[groupIndex] = updatedGroup;

    setMeetingData({
      ...meetingData,
      task_groups: updatedGroups,
    });
  };

  const handleAddTask = (groupIndex: number) => {
    if (!meetingData) return;

    const newTask: EditableTask = {
      id: generateTempId(),
      title: "New Task",
      details: {
        description: "",
        checklist_items: [],
      },
      assignments: [],
      due_date: null,
      startDateTime: new Date().toISOString(),
      priority: "3",
    };

    const updatedGroups = [...meetingData.task_groups];
    updatedGroups[groupIndex].tasks.push(newTask);

    setMeetingData({
      ...meetingData,
      task_groups: updatedGroups,
      action_items_count: meetingData.action_items_count + 1,
    });
  };

  const handleAddGroup = () => {
    if (!meetingData) return;

    const newGroup: EditableTaskGroup = {
      plan_association: {
        association_type: "new",
        plan_title: "New Plan",
        plan_reference: null,
        rationale: "",
      },
      tasks: [],
      group_description: "New task group",
    };

    setMeetingData({
      ...meetingData,
      task_groups: [...meetingData.task_groups, newGroup],
    });
  };

  const handleConfirm = async () => {
    if (!meetingData) return;

    // Validation
    if (!meetingData.meeting_details.meeting_title) {
      setStatus({
        type: "error",
        message: "Please provide a meeting title before confirming.",
      });
      return;
    }

    const hasTasksWithoutAssignee = meetingData.task_groups.some((group) =>
      group.tasks.some((task) => !task.assignee_id)
    );

    if (hasTasksWithoutAssignee) {
      setStatus({
        type: "error",
        message:
          "Some tasks are missing assignees. Please assign all tasks before confirming.",
      });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      // Convert editable data back to save format
      const savePayload = {
        meeting_details: meetingData.meeting_details,
        task_groups: meetingData.task_groups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => {
            // Remove temporary client-side fields
            const { id, assignee_id, goal_id, department_id, ...taskData } =
              task;
            return taskData;
          }),
        })),
        action_items_count: meetingData.task_groups.reduce(
          (sum, group) => sum + group.tasks.length,
          0
        ),
        meeting_date: meetingData.meeting_details.meeting_date,
        meeting_summary: meetingData.meeting_summary,
      };

      const result = await saveMeetingData(savePayload);

      if (result.error) {
        setStatus({ type: "error", message: result.error });
      } else {
        // Clear session storage
        sessionStorage.removeItem("pending-meeting-data");

        setStatus({
          type: "success",
          message:
            "Meeting and tasks saved successfully! Redirecting to dashboard...",
        });

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? All changes will be lost.")) {
      sessionStorage.removeItem("pending-meeting-data");
      router.push("/dashboard/upload");
    }
  };

  if (!meetingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading meeting data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Review Meeting Data
          </h2>
          <p className="text-muted-foreground">
            Review and edit the extracted information before saving
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>
      </div>

      {/* Status Messages */}
      {status && (
        <Alert variant={status.type === "error" ? "destructive" : "default"}>
          {status.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {status.type === "success" ? "Success!" : "Error"}
          </AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {/* Meeting Summary */}
      <MeetingSummaryCard
        meetingDetails={meetingData.meeting_details}
        meetingSummary={meetingData.meeting_summary}
        onUpdateTitle={handleUpdateTitle}
        onUpdateDate={handleUpdateDate}
        onUpdateSummary={handleUpdateSummary}
      />

      {/* Task Groups */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">
            Extracted Tasks ({meetingData.action_items_count} total)
          </h3>
          <Button
            variant="outline"
            onClick={handleAddGroup}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Group
          </Button>
        </div>

        {meetingData.task_groups.map((group, groupIndex) => (
          <TaskGroupSection
            key={groupIndex}
            taskGroup={group}
            users={users}
            goals={goals}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onUpdateGroup={handleUpdateGroup}
            onAddTask={handleAddTask}
            groupIndex={groupIndex}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 rounded-lg border-2 shadow-lg">
        <Button
          onClick={handleConfirm}
          disabled={saving}
          size="lg"
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Confirm & Save Meeting
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
