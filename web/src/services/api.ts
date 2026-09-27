import {
  User,
  Farm,
  Tree,
  Camera,
  SimulationStatus,
  ImageRecord,
  PredictionRecord,
  FarmAnalyticsSummary
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiClient {
  private token: string | null = localStorage.getItem('mangovision_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('mangovision_token', token);
    } else {
      localStorage.removeItem('mangovision_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      // Optional: window.location.href = '/login';
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Farms
  async getFarms(): Promise<Farm[]> {
    return this.request<Farm[]>('/farms');
  }

  async getFarm(farmId: number): Promise<Farm> {
    return this.request<Farm>(`/farms/${farmId}`);
  }

  async getFarmTrees(farmId: number): Promise<Tree[]> {
    return this.request<Tree[]>(`/farms/${farmId}/trees`);
  }

  async getFarmCameras(farmId: number): Promise<Camera[]> {
    return this.request<Camera[]>(`/farms/${farmId}/cameras`);
  }

  async getFarmLayout(farmId: number): Promise<import('../types').FarmLayout> {
    return this.request<import('../types').FarmLayout>(`/farms/${farmId}/layout`);
  }


  // Trees
  async getTree(treeId: number): Promise<Tree> {
    return this.request<Tree>(`/trees/${treeId}`);
  }

  async getTreeImages(treeId: number): Promise<ImageRecord[]> {
    return this.request<ImageRecord[]>(`/trees/${treeId}/images`);
  }

  async getTreePredictions(treeId: number): Promise<PredictionRecord[]> {
    return this.request<PredictionRecord[]>(`/trees/${treeId}/predictions`);
  }

  // Simulation
  async getSimulationStatus(cameraId: number): Promise<SimulationStatus> {
    return this.request<SimulationStatus>(`/cameras/${cameraId}/simulation/status`);
  }

  async startSimulation(cameraId: number, speed?: number): Promise<SimulationStatus> {
    return this.request<SimulationStatus>(`/cameras/${cameraId}/simulation/start`, {
      method: 'POST',
      body: JSON.stringify({ action: 'START', speed }),
    });
  }

  async pauseSimulation(cameraId: number): Promise<SimulationStatus> {
    return this.request<SimulationStatus>(`/cameras/${cameraId}/simulation/pause`, {
      method: 'POST',
    });
  }

  async stopSimulation(cameraId: number): Promise<SimulationStatus> {
    return this.request<SimulationStatus>(`/cameras/${cameraId}/simulation/stop`, {
      method: 'POST',
    });
  }

  async resetSimulation(cameraId: number): Promise<SimulationStatus> {
    return this.request<SimulationStatus>(`/cameras/${cameraId}/simulation/reset`, {
      method: 'POST',
    });
  }

  async stepSimulation(cameraId: number): Promise<SimulationStatus> {
    return this.request<SimulationStatus>(`/cameras/${cameraId}/simulation/step`, {
      method: 'POST',
    });
  }

  // Analytics
  async getAnalytics(farmId?: number): Promise<FarmAnalyticsSummary> {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return this.request<FarmAnalyticsSummary>(`/analytics/dashboard${query}`);
  }

  // Images & Predictions
  async getFarmImages(farmId: number): Promise<ImageRecord[]> {
    return this.request<ImageRecord[]>(`/images/farm/${farmId}`);
  }

  async getFarmPredictions(farmId: number): Promise<PredictionRecord[]> {
    return this.request<PredictionRecord[]>(`/predictions/farm/${farmId}`);
  }

  async uploadLeafImage(formData: FormData): Promise<ImageRecord> {
    return this.request<ImageRecord>('/images/upload', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
