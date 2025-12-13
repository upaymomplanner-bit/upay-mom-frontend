"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ParsedMeetingResponse,
  SaveMeetingPayload,
} from "@/types/meeting";

async function getAuthToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function uploadTranscript(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const accessToken = await getAuthToken();
  if (!accessToken) {
    return { error: "No valid session" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  try {
    // Forward to external backend for processing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Backend requires meeting_details field
    if (!formData.has("meeting_details")) {
      formData.append(
        "meeting_details",
        JSON.stringify({
          meeting_title: "Uploaded Meeting",
          meeting_date: new Date().toISOString().split("T")[0],
        })
      );
    }

    const response = await fetch(`${backendUrl}/transcripts/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
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

  const accessToken = await getAuthToken();
  if (!accessToken) {
    return { error: "No valid session" };
  }

  try {
    // Send confirmed data to backend for saving
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Ensure meeting_type is present
    const payload = {
      ...meetingData,
      meeting_details: {
        ...meetingData.meeting_details,
        meeting_type: meetingData.meeting_details.meeting_type || "General",
      },
      user_id: user.id,
    };

    console.log(
      "Saving meeting data with payload:",
      JSON.stringify(payload, null, 2)
    );

    const response = await fetch(`${backendUrl}/transcripts/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
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
    console.log("Fetching users from profiles table...");
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, department_id")
      .order("full_name");

    if (error) throw error;

    // Self-healing: If no users found, check if current user needs a profile
    if (!users || users.length === 0) {
      console.log(
        "No profiles found. Checking if current user needs a profile..."
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists (double check)
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          console.log("Creating profile for current user...");
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "User",
            });

          if (insertError) {
            console.error("Failed to create profile:", insertError);
          } else {
            // Refetch users
            const { data: newUsers } = await supabase
              .from("profiles")
              .select("id, full_name, email, department_id")
              .order("full_name");

            return { success: true, data: newUsers };
          }
        }
      }
    }

    console.log(`Found ${users?.length || 0} users`);
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
