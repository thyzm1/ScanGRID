import type {
  Drawer,
  DrawerCreateRequest,
  BinUpdateRequest,
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
}

export const apiClient = new ApiClient();
