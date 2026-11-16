import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function responseErrorMessage(res: Response, fallback?: string): Promise<string> {
  const body = await res.clone().text().catch(() => "");
  if (body) {
    try {
      const payload = JSON.parse(body);
      const message = payload?.message ?? payload?.error ?? payload?.detail;
      if (typeof message === "string" && message.trim()) return message.trim();
    } catch {
      const text = body.trim();
      if (text && !text.startsWith("<")) return text.slice(0, 500);
    }
  }
  if (fallback) return fallback;
  const statusText = res.statusText ? ` ${res.statusText}` : "";
  return `Request failed (${res.status}${statusText}). Please try again.`;
}

export async function throwIfResNotOk(res: Response, fallback?: string) {
  if (!res.ok) {
    throw new ApiError(await responseErrorMessage(res, fallback), res.status);
  }
}

export async function fetchApiResponse(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    return await fetch(url, { ...init, credentials: init.credentials ?? "include" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }
}

export async function apiFetch(
  url: string,
  init: RequestInit = {},
  fallbackError?: string,
): Promise<Response> {
  const res = await fetchApiResponse(url, init);
  await throwIfResNotOk(res, fallbackError);
  return res;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  return apiFetch(url, {
    method,
    headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchApiResponse(queryKey.join("/") as string);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, "Could not load this information. Please try again.");
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
