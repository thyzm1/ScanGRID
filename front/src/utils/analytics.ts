import type { Bin, Drawer } from '../types/api';

const STORAGE_KEY = 'scangrid_usage_analytics_v1';

interface StoredBinMetric {
  binId: string;
  title: string;
  drawerId?: string;
  drawerName?: string;
  searchCount: number;
  openCount: number;
  lastSearchAt?: string;
  lastOpenAt?: string;
}

interface StoredAnalytics {
  version: 1;
  searchesTotal: number;
  opensTotal: number;
  bins: Record<string, StoredBinMetric>;
  updatedAt: string;
}

export interface AnalyticsSnapshot {
  searchesTotal: number;
  opensTotal: number;
  bins: StoredBinMetric[];
  updatedAt: string;
}

const createEmpty = (): StoredAnalytics => ({
  version: 1,
  searchesTotal: 0,
  opensTotal: 0,
  bins: {},
  updatedAt: new Date().toISOString(),
});

const loadRaw = (): StoredAnalytics => {
  if (typeof window === 'undefined') return createEmpty();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmpty();

    const parsed = JSON.parse(raw) as StoredAnalytics;
    if (parsed.version !== 1 || typeof parsed.bins !== 'object') {
      return createEmpty();
    }

    return parsed;
  } catch {
    return createEmpty();
  }
};

const saveRaw = (value: StoredAnalytics) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const ensureMetric = (data: StoredAnalytics, bin: Bin, drawer?: Drawer): StoredBinMetric => {
  if (!data.bins[bin.bin_id]) {
    data.bins[bin.bin_id] = {
      binId: bin.bin_id,
      title: bin.content.title || 'Sans titre',
      drawerId: drawer?.drawer_id,
      drawerName: drawer?.name,
      searchCount: 0,
      openCount: 0,
    };
  }

  const metric = data.bins[bin.bin_id];
  metric.title = bin.content.title || metric.title;

  if (drawer) {
    metric.drawerId = drawer.drawer_id;
    metric.drawerName = drawer.name;
  }

  return metric;
};

export const recordBinSearch = (bin: Bin, drawer?: Drawer) => {
  const data = loadRaw();
  const metric = ensureMetric(data, bin, drawer);

  metric.searchCount += 1;
  metric.lastSearchAt = new Date().toISOString();

  data.searchesTotal += 1;
  data.updatedAt = new Date().toISOString();
  saveRaw(data);
};

export const recordBinOpen = (bin: Bin, drawer?: Drawer) => {
  const data = loadRaw();
  const metric = ensureMetric(data, bin, drawer);

  metric.openCount += 1;
  metric.lastOpenAt = new Date().toISOString();

  data.opensTotal += 1;
  data.updatedAt = new Date().toISOString();
  saveRaw(data);
};

export const getAnalyticsSnapshot = (): AnalyticsSnapshot => {
  const raw = loadRaw();

  return {
    searchesTotal: raw.searchesTotal,
    opensTotal: raw.opensTotal,
    bins: Object.values(raw.bins),
    updatedAt: raw.updatedAt,
  };
};

export const resetAnalytics = () => {
  saveRaw(createEmpty());
};
