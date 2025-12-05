
// NOTE: This helper is deprecated in favor of the centralized `apiClient` which
// injects the required authentication headers (eg. x-user-id) automatically.
export async function apiCreateUser(payload: {
  email: string;
  password: string;
  user_name: string;
  department: string;
  phone?: string;
  manager?: string;
  roles?: string[];
}) {
  // Forward to the shared api client so headers and base URL are consistent.
  // Importing here dynamically to avoid circular import issues during module
  // initialization in some build setups.
  const { apiClient } = await import("@/lib/api");
  return apiClient.createUser(payload);
}
