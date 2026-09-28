export type UserRole = 'ADMIN' | 'FARM_MANAGER' | 'OPERATOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Farm {
  id: number;
  name: string;
  location: string;
  area_acres: number;
  total_rows: number;
  trees_per_row: number;
  description?: string;
  created_at: string;
  total_trees?: number;
  healthy_trees?: number;
  diseased_trees?: number;
  unknown_trees?: number;
}

export type TreeHealthStatus = 'HEALTHY' | 'DISEASE_DETECTED' | 'TREATED' | 'UNKNOWN';

export interface LatestPrediction {
  id: number;
  disease_name: string;
  confidence: number;
  is_mock: boolean;
  symptoms?: string;
  treatment?: string;
  treatment_recommendation?: string;
  prediction_time: string;
}


export interface Tree {
  id: number;
  farm_id: number;
  tree_number: string;
  row_number: number;
  column_number: number;
  latitude?: number;
  longitude?: number;
  variety: string;
  health_status: TreeHealthStatus;
  last_inspected_at?: string;
  latest_prediction?: LatestPrediction;
}

export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'MOVING' | 'CAPTURING' | 'ERROR';

export interface Camera {
  id: number;
  farm_id: number;
  name: string;
  device_type: string;
  status: CameraStatus;
  current_row: number;
  current_column: number;
  current_tree_id?: number;
  rail_position_meters: number;
  speed_m_per_s: number;
  battery_percentage: number;
  updated_at: string;
}

export interface SimulationStatus {
  camera_id: number;
  farm_id: number;
  status: CameraStatus;
  x?: number;
  y?: number;
  current_row: number;
  current_column: number;
  direction?: 'FORWARD' | 'BACKWARD';
  current_tree_id?: number;
  current_tree_number?: string;
  current_tree_health?: TreeHealthStatus;
  rail_position_meters: number;
  total_rail_length_meters: number;
  progress_percentage: number;
  speed_m_per_s: number;
  is_capturing: boolean;
  last_event?: string;
  last_captured_image_id?: number;
  last_prediction?: {
    id: number;
    disease_name: string;
    confidence: number;
    symptoms?: string;
    treatment?: string;
    is_mock: boolean;
  };
  updated_at: string;
}

export interface FarmBoundaryPoint {
  x: number;
  y: number;
}

export interface FarmDimensions {
  width_meters: number;
  height_meters: number;
}

export interface LayoutTree {
  tree_id: number;
  tree_number: string;
  row: number;
  column: number;
  x: number;
  y: number;
  health_status: TreeHealthStatus | string;
  variety: string;
  latest_disease?: string | null;
  latest_confidence?: number | null;
}

export interface LayoutRow {
  row_number: number;
  rail_y: number;
  start_x: number;
  end_x: number;
  trees: LayoutTree[];
}

export interface CameraPathPoint {
  sequence: number;
  x: number;
  y: number;
  row: number;
  checkpoint_tree_id?: number | null;
}

export interface CameraPath {
  path_id: number;
  name: string;
  total_length_meters: number;
  points: CameraPathPoint[];
}

export interface FarmLayout {
  farm_id: number;
  name: string;
  location: string;
  dimensions: FarmDimensions;
  boundary: FarmBoundaryPoint[];
  rows: LayoutRow[];
  camera_paths: CameraPath[];
}


export interface ImageRecord {
  id: number;
  farm_id: number;
  tree_id: number;
  camera_id?: number;
  file_path: string;
  thumbnail_path?: string;
  capture_time: string;
  image_type?: string;
  processing_status: 'PENDING' | 'PROCESSED' | 'FAILED';
  prediction?: PredictionRecord;
}

export interface PredictionRecord {
  id: number;
  image_id: number;
  tree_id: number;
  disease_name: string;
  confidence: number;
  class_id: number;
  model_version: string;
  is_mock: boolean;
  symptoms?: string;
  treatment_recommendation?: string;
  prediction_time: string;
}

export interface DiseaseCountItem {
  disease_name: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

export interface FarmAnalyticsSummary {
  farm_id: number;
  farm_name: string;
  total_trees: number;
  health_score: number;
  health_distribution: {
    healthy_count: number;
    healthy_percentage: number;
    diseased_count: number;
    diseased_percentage: number;
    treated_count?: number;
    treated_percentage?: number;
    unknown_count: number;
    unknown_percentage: number;
  };
  disease_breakdown: DiseaseCountItem[];
  active_cameras: number;
  total_images_captured: number;
  total_predictions_made: number;
  recent_activity: {
    id: number;
    tree_number: string;
    tree_id: number;
    disease_name: string;
    confidence: number;
    is_mock: boolean;
    prediction_time: string;
  }[];
}

export interface TreatmentRecord {
  id: number;
  farm_id: number;
  tree_id: number;
  chemical_name: string;
  dosage?: string;
  operator_name: string;
  treatment_type: 'CHEMICAL' | 'ORGANIC' | 'PRUNING' | 'BIOLOGICAL';
  notes?: string;
  treated_at: string;
  created_at: string;
}

export interface AlertRecord {
  id: number;
  farm_id: number;
  tree_id?: number;
  camera_id?: number;
  alert_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  is_acknowledged: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface DiseaseAdvisory {
  class_id: number;
  name: string;
  scientific_name: string;
  severity: string;
  symptoms: string;
  treatment: string;
}

export interface SimulateDiseaseRequest {
  disease_name?: string;
  tree_id?: number;
  severity?: string;
  operator_notes?: string;
}

export interface SimulateDiseaseResponse {
  camera_id: number;
  farm_id: number;
  tree_id: number;
  tree_number: string;
  tree_health_status: string;
  disease_name: string;
  scientific_name?: string;
  confidence: number;
  severity: string;
  symptoms?: string;
  treatment_recommendation?: string;
  image_id: number;
  image_url: string;
  alert_id?: number;
  alert_severity?: string;
  simulation_status: SimulationStatus;
}

export interface BatchTreatmentRequest {
  farm_id: number;
  chemical_name: string;
  dosage?: string;
  operator_name?: string;
  treatment_type?: 'CHEMICAL' | 'ORGANIC' | 'PRUNING' | 'BIOLOGICAL';
  notes?: string;
  target_health_status?: string;
}

export interface BatchTreatmentResponse {
  farm_id: number;
  treated_count: number;
  chemical_name: string;
  tree_numbers: string[];
  message: string;
}

