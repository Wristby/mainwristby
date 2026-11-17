import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { ApiError, apiJson, apiRequest, readApiJson } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

async function fetchUser(): Promise<User | null> {
  const response = await apiRequest("GET", "/api/auth/user", undefined, { allowStatuses: [401] });

  if (response.status === 401) {
    return null;
  }

  return readApiJson<User>(response);
}

async function logoutFn(): Promise<void> {
  await apiRequest("POST", "/api/logout");
}

interface LoginCredentials {
  username: string;
  password: string;
}

async function loginFn(credentials: LoginCredentials): Promise<User> {
  try {
    return await apiJson<User>("POST", "/api/login", credentials);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError("Incorrect username or password.", 401);
    }
    throw error;
  }
}

async function registerFn(credentials: LoginCredentials): Promise<User> {
  return apiJson<User>("POST", "/api/register", credentials);
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutFn,
    onError: (error) => toast({ title: "Could not sign out", description: error.message, variant: "destructive" }),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/landing";
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      window.location.href = "/";
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerFn,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      window.location.href = "/";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error?.message,
  };
}
