import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { apiFetch, fetchApiResponse, throwIfResNotOk } from "@/lib/queryClient";

async function fetchUser(): Promise<User | null> {
  const response = await fetchApiResponse("/api/auth/user");

  if (response.status === 401) {
    return null;
  }

  await throwIfResNotOk(response, "Could not check your sign-in status.");

  return response.json();
}

async function logoutFn(): Promise<void> {
  await apiFetch("/api/logout", {
    method: "POST",
  }, "Could not sign out. Please try again.");
}

interface LoginCredentials {
  identifier: string;
  password: string;
}

async function loginFn(credentials: LoginCredentials): Promise<User> {
  const response = await apiFetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }, "Could not sign in. Check your details and try again.");

  return response.json();
}

export interface SignupCredentials {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  termsAccepted: boolean;
}

interface AuthMessage {
  message: string;
}

async function registerFn(credentials: SignupCredentials): Promise<AuthMessage> {
  const response = await apiFetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }, "Could not create your account. Please try again.");

  return response.json();
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
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/landing";
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerFn,
    onSuccess: (data) => {
      return data;
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
