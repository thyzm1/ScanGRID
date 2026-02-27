import type {
  Drawer,
  DrawerCreateRequest,
  BinUpdateRequest,
  Category,
  CategoryCreateRequest,
} from '../types/api';

const API_BASE_URL = '/api'; // Toujours utiliser /api comme préfixe, que ce soit en dev ou prod

/**
 * Client API REST pour ScanGRID Backend
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // console.log(`📡 API Request: ${options?.method || 'GET'} ${url}`); 

    // ...existing request method...
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.detail || 'API Error');
    }

    return response.json();
  }

  // ========================================================================
  // CATEGORIES
  // ========================================================================

  async listCategories(): Promise<Category[]> {
    return this.request('/categories');
  }

  async createCategory(data: CategoryCreateRequest): Promise<Category> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    return this.request(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }

  // ========================================================================
  // DRAWERS
  // ========================================================================

  async listDrawers(): Promise<Drawer[]> {
    return this.request('/drawers');
  }

  async getDrawer(drawerId: string): Promise<Drawer> {
    return this.request(`/drawers/${drawerId}`);
  }

  async createDrawer(data: DrawerCreateRequest): Promise<Drawer> {
    return this.request('/drawers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDrawer(drawerId: string): Promise<{ message: string }> {
    return this.request(`/drawers/${drawerId}`, {
      method: 'DELETE',
    });
  }

  async createLayer(drawerId: string, z_index: number): Promise<any> {
    return this.request(`/drawers/${drawerId}/layers`, {
      method: 'POST',
      body: JSON.stringify({ z_index, bins: [] }),
    });
  }

  // ========================================================================
  // BINS
  // ========================================================================

  async updateBin(
    binId: string,
    data: BinUpdateRequest
  ): Promise<{ message: string }> {
    return this.request(`/bins/${binId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBin(binId: string): Promise<{ message: string }> {
    return this.request(`/bins/${binId}`, {
      method: 'DELETE',
    });
  }

  async createBin(layerId: string, data: any): Promise<any> {
    return this.request(`/layers/${layerId}/bins`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========================================================================
  // AI DESCRIPTION IMPROVEMENT
  // ========================================================================

  async improveDescription(
    title: string,
    content: string = '',
    instruction: string = 'Description pour un inventaire de composants électroniques'
  ): Promise<{ improved_description: string; model: string }> {
    const params = new URLSearchParams({
      title,
      content,
      instruction,
    });
    return this.request(`/improve-description?${params.toString()}`, {
      method: 'POST',
    });
  }

  // ========================================================================
  // BOM GENERATOR & IMPORT
  // ========================================================================

  async searchBOM(q: string): Promise<any[]> {
    const params = new URLSearchParams({ q });
    return this.request(`/bom/search?${params.toString()}`);
  }

  async matchBOM(lines: string[]): Promise<{ results: any[] }> {
    return this.request('/bom/match', {
      method: 'POST',
      body: JSON.stringify({ lines }),
    });
  }
}

export const apiClient = new ApiClient();

