import {
  User,
  Farm,
  Tree,
  Camera,
  SimulationStatus,
  ImageRecord,
  PredictionRecord,
  FarmAnalyticsSummary,
  TreatmentRecord,
  AlertRecord,
  DiseaseAdvisory,
  SimulateDiseaseRequest,
  SimulateDiseaseResponse
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

  async simulateDisease(
    cameraId: number,
    data?: SimulateDiseaseRequest
  ): Promise<SimulateDiseaseResponse> {
    return this.request<SimulateDiseaseResponse>(`/cameras/${cameraId}/simulation/simulate-disease`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
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

  // Alerts
  async getAlerts(farmId?: number, unresolvedOnly: boolean = false): Promise<AlertRecord[]> {
    const params = new URLSearchParams();
    if (farmId) params.append('farm_id', farmId.toString());
    if (unresolvedOnly) params.append('unresolved_only', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<AlertRecord[]>(`/alerts${qs}`);
  }

  async getActiveAlertsCount(farmId?: number): Promise<{ active_alerts_count: number }> {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    return this.request<{ active_alerts_count: number }>(`/alerts/active-count${qs}`);
  }

  async acknowledgeAlert(alertId: number): Promise<AlertRecord> {
    return this.request<AlertRecord>(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  async resolveAlert(alertId: number): Promise<AlertRecord> {
    return this.request<AlertRecord>(`/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
  }

  // Treatments
  async getTreeTreatments(treeId: number): Promise<TreatmentRecord[]> {
    return this.request<TreatmentRecord[]>(`/treatments/tree/${treeId}`);
  }

  async getFarmTreatments(farmId: number): Promise<TreatmentRecord[]> {
    return this.request<TreatmentRecord[]>(`/treatments/farm/${farmId}`);
  }

  async logTreatment(payload: {
    tree_id: number;
    chemical_name: string;
    dosage?: string;
    operator_name?: string;
    treatment_type?: string;
    notes?: string;
    update_tree_health?: boolean;
    new_health_status?: string;
  }): Promise<TreatmentRecord> {
    return this.request<TreatmentRecord>('/treatments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async batchTreatTrees(payload: import('../types').BatchTreatmentRequest): Promise<import('../types').BatchTreatmentResponse> {
    return this.request<import('../types').BatchTreatmentResponse>('/treatments/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }


  // Advisories
  async getAdvisories(): Promise<DiseaseAdvisory[]> {
    return this.request<DiseaseAdvisory[]>('/advisories');
  }

  async getAdvisoryByName(diseaseName: string): Promise<DiseaseAdvisory> {
    return this.request<DiseaseAdvisory>(`/advisories/${encodeURIComponent(diseaseName)}`);
  }

  // Export CSV URL
  getExportAuditCsvUrl(farmId?: number): string {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    return `${API_BASE_URL}/analytics/export/csv${qs}`;
  }
}

export const api = new ApiClient();
