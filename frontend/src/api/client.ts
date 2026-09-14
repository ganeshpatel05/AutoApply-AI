const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  // In development mode (localhost) use http://localhost:8000, in production (Vercel) use relative paths ""
  return import.meta.env.DEV ? "http://localhost:8000" : "";
};

const API_BASE_URL = getApiBaseUrl();


interface ApiOptions extends RequestInit {
  data?: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...customConfig } = options;
  
  const headers = new Headers(customHeaders);
  
  if (data && !(data instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    method: data ? "POST" : "GET",
    ...customConfig,
    headers,
  };

  if (data) {
    config.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json().catch(() => null);

    if (response.ok) {
      return result;
    }

    throw new ApiError(
      response.status, 
      result?.detail || result?.message || "An error occurred", 
      result
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, "Unable to connect to CareerPilot AI backend. Make sure the API server is running.");
  }
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data?: any, options?: ApiOptions) => request<T>(endpoint, { ...options, data, method: "POST" }),
  put: <T>(endpoint: string, data?: any, options?: ApiOptions) => request<T>(endpoint, { ...options, data, method: "PUT" }),
  delete: <T>(endpoint: string, options?: ApiOptions) => request<T>(endpoint, { ...options, method: "DELETE" }),
};
