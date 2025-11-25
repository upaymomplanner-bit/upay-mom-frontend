"use server";

import createClient, { Middleware } from "openapi-fetch";
import { type paths } from "../data.types";
import { createClient as createSupabaseServerClient } from "../../db/supabase/client";

// TODO: make baseUrl configurable via env variable
export async function createBackendClient() {
  const backendClient = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  });
  backendClient.use(backendMiddleware);
  return backendClient;
}

const backendMiddleware: Middleware = {
  async onRequest({ request, options }) {
    console.debug(
      "[backendClient_server][middleware][request]",
      `${request.method} ${request.url}`
    );

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error(
        "[backendClient][middleware][getSession]",
        `${error.name} | ${error.message}`
      );
      console.debug(
        "[backendClient][middleware][getSession]",
        `${error.code} | ${error.status} | ${error.cause} | ${error.stack}`
      );
      return request;
    }
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      console.error(
        "[backendClient][middleware]",
        "access token not found in session"
      );
      return request;
    }

    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
};
