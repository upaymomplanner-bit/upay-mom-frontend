"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    // Forward to external backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/transcripts/process`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const data = await response.json();

    // In a real scenario, we might want to save the parsed tasks to Supabase here
    // or return them to the client for review.
    // For now, let's assume the backend handles everything or returns the tasks.

    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { error: error.message };
  }
}
