/**
 * Types TypeScript strictement alignés sur le contrat API REST
 * Backend: FastAPI ScanGRID
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface CategoryCreateRequest {
  name: string;
  icon?: string;
}

export interface BinContent {
  title: string;
  description?: string;
  icon?: string; // Icon class name (e.g. "ri-home-line")
  items?: string[];
  photos?: string[];
}

export interface Bin {
  bin_id: string; // Mapped from backend 'id'
  x_grid: number;
  y_grid: number;
  width_units: number;
  depth_units: number;
  content: BinContent;
  color?: string;
  is_hole?: boolean;
  layer_id?: string;
  category_id?: string; // Added
  category?: Category; // Added
}

export interface Layer {
  layer_id: string;
  z_index: number;
  bins: Bin[];
}

export interface Drawer {
  drawer_id: string;
  name: string;
  width_units: number;
  depth_units: number;
  layers: Layer[];
}

// ============================================================================
// REQUÊTES (CREATE/UPDATE)
// ============================================================================

export interface BinCreateRequest {
  x_grid: number;
  y_grid: number;
  width_units: number;
  depth_units: number;
  content: BinContent;
  color?: string;
  is_hole?: boolean;
}

export interface LayerCreateRequest {
  z_index: number;
  bins: BinCreateRequest[];
}

export interface DrawerCreateRequest {
  name: string;
  width_units: number;
  depth_units: number;
  layers: LayerCreateRequest[];
}

export interface BinUpdateRequest {
  x_grid?: number;
  y_grid?: number;
  width_units?: number;
  depth_units?: number;
  content?: Partial<BinContent>;
  color?: string;
  is_hole?: boolean;
}

// ============================================================================
// RÉPONSES API
// ============================================================================

export interface ApiError {
  detail: string;
}

export interface SuccessResponse {
  message: string;
}

// ============================================================================
// TYPES UI (extensions pour l'interface)
// ============================================================================

export interface GridLayout {
  i: string; // bin_id
  x: number; // x_grid
  y: number; // y_grid
  w: number; // width_units
  h: number; // depth_units
  static?: boolean;
}

export interface DrawerFormData {
  name: string;
  width_units: number;
  depth_units: number;
}

export interface BinFormData {
  label_text: string;
  x_grid: number;
  y_grid: number;
  width_units: number;
  depth_units: number;
}
