"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";
import type {
  ParsedMeetingResponse,
  EditableMeetingData,
  EditableTaskGroup,
  EditableTask,
} from "@/types/meeting";
import { MeetingSummaryCard } from "@/components/review/meeting-summary-card";
import { TaskGroupSection } from "@/components/review/task-group-section";
import { saveMeetingData, getUsers } from "@/app/actions/upload";
import { generateTempId } from "@/lib/utils/meeting";

export default function ReviewPage() {
  const router = useRouter();
  const [meetingData, setMeetingData] = useState<EditableMeetingData | null>(
    null
  );
  const [users, setUsers] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);
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

    // Load users for assignee dropdown
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    const result = await getUsers();
    if (result.success && result.data) {
      setUsers(result.data);
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
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            status.type === "success"
              ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
              : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-medium ${
                status.type === "success"
                  ? "text-green-900 dark:text-green-100"
                  : "text-red-900 dark:text-red-100"
              }`}
            >
              {status.type === "success" ? "Success!" : "Error"}
            </p>
            <p
              className={`text-sm ${
                status.type === "success"
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {status.message}
            </p>
          </div>
        </div>
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
        </div>

        {meetingData.task_groups.map((group, groupIndex) => (
          <TaskGroupSection
            key={groupIndex}
            taskGroup={group}
            users={users}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
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
