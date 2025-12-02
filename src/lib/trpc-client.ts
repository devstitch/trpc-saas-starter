"use client";

// For queries (GET requests)
export async function trpcQuery(endpoint: string, input?: any): Promise<any> {
  const token = localStorage.getItem("token");
  let url = `/api/trpc/${endpoint}`;

  // For GET requests, tRPC expects URL-encoded JSON in the input query parameter
  if (input) {
    const jsonInput = JSON.stringify(input);
    url += `?input=${encodeURIComponent(jsonInput)}`;
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: { message: "Unknown error" } }));
    const errorMessage =
      errorData.error?.message || errorData.message || "Request failed";
    const error = new Error(errorMessage);
    // Attach full error data for better error handling
    (error as any).errorData = errorData;
    throw error;
  }

  const data = await response.json();
  return data.result?.data;
}

// For mutations (POST requests)
export async function trpcMutation(
  endpoint: string,
  input?: any
): Promise<any> {
  const token = localStorage.getItem("token");
  const url = `/api/trpc/${endpoint}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(input || {}),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: { message: "Unknown error" } }));
    const errorMessage =
      errorData.error?.message || errorData.message || "Request failed";
    const error = new Error(errorMessage);
    // Attach full error data for better error handling
    (error as any).errorData = errorData;
    throw error;
  }

  const data = await response.json();
  return data.result?.data;
}

// Backward compatibility - auto-detect query vs mutation
export async function trpcFetch(
  endpoint: string,
  options: {
    input?: any;
    type?: "query" | "mutation";
  } = {}
): Promise<any> {
  const { input, type } = options;

  // Auto-detect: if endpoint contains "list", "get", "me", it's likely a query
  const isQuery =
    type === "query" ||
    (type === undefined &&
      (endpoint.includes("list") ||
        endpoint.includes("get") ||
        endpoint.includes("me") ||
        endpoint.includes("hasAccess")));

  if (isQuery) {
    return trpcQuery(endpoint, input);
  } else {
    return trpcMutation(endpoint, input);
  }
}
