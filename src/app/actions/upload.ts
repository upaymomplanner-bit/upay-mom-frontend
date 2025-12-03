"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ParsedMeetingResponse,
  SaveMeetingPayload,
} from "@/types/meeting";

export async function uploadTranscript(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  try {
    // Forward to external backend for processing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/transcripts/process`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const data: ParsedMeetingResponse = await response.json();

    // Return parsed data for review (don't save yet)
    return { success: true, data };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { error: error.message };
  }
}

export async function saveMeetingData(meetingData: SaveMeetingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    // Send confirmed data to backend for saving
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/transcripts/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...meetingData,
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save error: ${errorText}`);
    }

    const result = await response.json();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/meetings");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Save error:", error);
    return { error: error.message };
  }
}

// Fetch all users for assignee dropdown
export async function getUsers() {
  const supabase = await createClient();

  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, department_id")
      .order("full_name");

    if (error) throw error;

    return { success: true, data: users };
  } catch (error: any) {
    console.error("Get users error:", error);
    return { error: error.message };
  }
}

// Fetch all goals for linking tasks
export async function getGoals() {
  const supabase = await createClient();

  try {
    const { data: goals, error } = await supabase
      .from("goals")
      .select("id, title, year, quarter, department_id")
      .order("year", { ascending: false });

    if (error) throw error;

    return { success: true, data: goals };
  } catch (error: any) {
    console.error("Get goals error:", error);
    return { error: error.message };
  }
}
