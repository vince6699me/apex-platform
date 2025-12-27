
/**
 * Generic API Client for Apex Trading Platform
 * Simulates standard RESTful behavior with latency and status codes
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const DEFAULT_LATENCY = 400;

class ApiClient {
  private simulateLatency(ms: number = DEFAULT_LATENCY) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    console.debug(`[API] GET ${path}`);
    await this.simulateLatency();
    // Logic for specific paths can be handled in the domain-specific APIs
    return { data: {} as T, status: 200, message: "OK" };
  }

  async post<T>(path: string, body: any): Promise<ApiResponse<T>> {
    console.debug(`[API] POST ${path}`, body);
    await this.simulateLatency(600);
    return { data: {} as T, status: 201, message: "Created" };
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    console.debug(`[API] DELETE ${path}`);
    await this.simulateLatency(300);
    return { data: {} as T, status: 204, message: "No Content" };
  }
}

export const apiClient = new ApiClient();
