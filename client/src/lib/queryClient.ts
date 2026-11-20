import { QueryCache, QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly field?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function statusMessage(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do this.";
  if (status === 404) return "This record or feature could not be found. Refresh and try again.";
  if (status === 409) return "This record has changed or conflicts with existing data. Refresh and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The server could not complete the request. Please try again.";
  return "The request could not be completed. Please check your input and try again.";
}

export async function throwIfResNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  // Never show an HTML proxy error, raw response body, or stack trace in a toast.
  const payload = await res.json().catch(() => null);
  const message = typeof payload?.message === "string" && !/<[^>]+>/.test(payload.message)
    ? payload.message.trim().slice(0, 500)
    : "";
  throw new ApiError(res.status === 401 ? statusMessage(401) : message || statusMessage(res.status),
    res.status, typeof payload?.field === "string" ? payload.field : undefined);
}

interface RequestOptions {
  signal?: AbortSignal;
  /** Explicit exceptions for lookups that intentionally treat 401/404 as empty. */
  allowStatuses?: readonly number[];
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: RequestOptions = {},
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: data !== undefined ? { "Content-Type": "application/json" } : {},
      body: data !== undefined ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (!options.allowStatuses?.includes(res.status)) await throwIfResNotOk(res);
  return res;
}

export async function readApiJson<T = unknown>(
  response: Response,
  schema?: { parse(value: unknown): T },
): Promise<T> {
  await throwIfResNotOk(response);
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("The server returned an unexpected response. Refresh and try again.", response.status);
  }
  if (!schema) return data as T;
  try {
    return schema.parse(data);
  } catch {
    throw new ApiError("The server returned incomplete or incompatible data. Refresh and try again.", response.status);
  }
}

export async function apiJson<T = unknown>(
  method: string,
  url: string,
  data?: unknown,
  schema?: { parse(value: unknown): T },
  options?: RequestOptions,
): Promise<T> {
  return readApiJson(await apiRequest(method, url, data, options), schema);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T = unknown>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T | null> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const res = await apiRequest("GET", queryKey.join("/") as string, undefined, {
      signal, allowStatuses: unauthorizedBehavior === "returnNull" ? [401] : [],
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    return readApiJson(res);
  };

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Refresh errors must not turn a successful write into a failed write.
      // Keep the cached data, but make it clear it may no longer be up to date.
      const hasCachedData = query.state.data !== undefined;
      toast({
        title: hasCachedData ? "Could not refresh saved data" : "Could not load data",
        description: hasCachedData ? `${error.message} Displayed data may be out of date.` : error.message,
        variant: query.meta?.errorTone === "neutral" ? "default" : "destructive",
      });
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
