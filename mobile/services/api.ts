const DEFAULT_API_URL = 'http://10.0.2.2:8000/api'; // Android Emulator default or local IP

class MobileApiClient {
  private token: string | null = null;
  private baseUrl: string = DEFAULT_API_URL;

  setToken(token: string | null) {
    this.token = token;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(err.detail || `Request failed with ${response.status}`);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; user: any }>('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async getFarms() {
    return this.request<any[]>('/farms');
  }

  async getFarmTrees(farmId: number) {
    return this.request<any[]>(`/farms/${farmId}/trees`);
  }

  async getFarmCameras(farmId: number) {
    return this.request<any[]>(`/farms/${farmId}/cameras`);
  }

  async getTree(treeId: number) {
    return this.request<any>(`/trees/${treeId}`);
  }

  async getSimulationStatus(cameraId: number) {
    return this.request<any>(`/cameras/${cameraId}/simulation/status`);
  }

  async startSimulation(cameraId: number, speed?: number) {
    return this.request<any>(`/cameras/${cameraId}/simulation/start`, {
      method: 'POST',
      body: JSON.stringify({ action: 'START', speed }),
    });
  }

  async pauseSimulation(cameraId: number) {
    return this.request<any>(`/cameras/${cameraId}/simulation/pause`, {
      method: 'POST',
    });
  }

  async resetSimulation(cameraId: number) {
    return this.request<any>(`/cameras/${cameraId}/simulation/reset`, {
      method: 'POST',
    });
  }

  async getAnalytics(farmId?: number) {
    const q = farmId ? `?farm_id=${farmId}` : '';
    return this.request<any>(`/analytics/dashboard${q}`);
  }

  async getPredictions(farmId: number) {
    return this.request<any[]>(`/predictions/farm/${farmId}`);
  }

  async getAlerts(farmId?: number) {
    const q = farmId ? `?farm_id=${farmId}` : '';
    return this.request<any[]>(`/alerts${q}`);
  }

  async logTreatment(payload: any) {
    return this.request<any>('/treatments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdvisories() {
    return this.request<any[]>('/advisories');
  }
}

export const mobileApi = new MobileApiClient();
