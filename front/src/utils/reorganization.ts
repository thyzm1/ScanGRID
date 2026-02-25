import type { Bin, Category, Drawer } from '../types/api';

export type ReorganizationScope = 'drawer' | 'global';

export interface PlanBinMove {
  binId: string;
  title: string;
  fromDrawerId: string;
  fromDrawerName: string;
  fromLayerId: string;
  fromLayerIndex: number;
  fromX: number;
  fromY: number;
  toDrawerId: string;
  toDrawerName: string;
  toLayerId: string;
  toLayerIndex: number;
  toX: number;
  toY: number;
  reason: string;
}

export interface PlanUnplacedBin {
  binId: string;
  title: string;
  reason: string;
}

export interface DrawerPlanSummary {
  drawerId: string;
  drawerName: string;
  placed: number;
  movedIn: number;
  movedOut: number;
}

export interface ReorganizationPlan {
  scope: ReorganizationScope;
  generatedAt: string;
  totalBins: number;
  unchanged: number;
  moves: PlanBinMove[];
  unplaced: PlanUnplacedBin[];
  drawerSummaries: DrawerPlanSummary[];
}

export interface GeneratePlanOptions {
  scope: ReorganizationScope;
  currentDrawerId?: string;
  categoriesById?: Record<string, Category>;
}

interface BinMeta {
  bin: Bin;
  sourceDrawerId: string;
  sourceDrawerName: string;
  sourceLayerId: string;
  sourceLayerIndex: number;
  groupKey: string;
  tokens: string[];
}

interface DrawerProfile {
  drawer: Drawer;
  tokenCounts: Map<string, number>;
  groupCounts: Map<string, number>;
}

interface GroupAnchor {
  x: number;
  y: number;
  z: number;
  count: number;
}

interface PlacementCandidate {
  drawerId: string;
  drawerName: string;
  layerId: string;
  layerIndex: number;
  x: number;
  y: number;
  z: number;
  reason: string;
}

interface DrawerState {
  drawer: Drawer;
  orderedLayers: { layer_id: string; z_index: number }[];
  occupancy: boolean[][][];
  groupAnchors: Map<string, GroupAnchor>;
}

const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'ou', 'pour', 'avec',
  'dans', 'sur', 'sans', 'par', 'the', 'and', 'for', 'with', 'to', 'from', 'en',
  'a', 'au', 'aux', 'ce', 'cet', 'cette', 'ces', 'is', 'are', 'of', 'on', 'at',
  'x', 'mm', 'cm', 'm', 'pcs', 'piece', 'pieces', 'lot', 'kit', 'set'
]);

const tokenize = (value: string): string[] => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
};

const buildBinTokens = (bin: Bin, categoryName?: string): string[] => {
  const itemsText = Array.isArray(bin.content.items) ? bin.content.items.join(' ') : '';
  const source = [
    bin.content.title || '',
    bin.content.description || '',
    itemsText,
    categoryName || '',
    bin.category_id || ''
  ].join(' ');

  return tokenize(source);
};

const buildGroupKey = (bin: Bin, tokens: string[]): string => {
  if (bin.category_id) return `cat:${bin.category_id}`;
  if (tokens.length > 0) return `kw:${tokens[0]}`;
  return 'misc:autres';
};

const incrementMapCount = (map: Map<string, number>, key: string, inc = 1) => {
  map.set(key, (map.get(key) || 0) + inc);
};

const buildProfiles = (
  drawers: Drawer[],
  categoriesById: Record<string, Category>
): Map<string, DrawerProfile> => {
  const profiles = new Map<string, DrawerProfile>();

  for (const drawer of drawers) {
    const tokenCounts = new Map<string, number>();
    const groupCounts = new Map<string, number>();

    drawer.layers.forEach((layer) => {
      layer.bins.forEach((bin) => {
        const categoryName = bin.category_id ? categoriesById[bin.category_id]?.name : undefined;
        const tokens = buildBinTokens(bin, categoryName);
        const groupKey = buildGroupKey(bin, tokens);

        incrementMapCount(groupCounts, groupKey, 1);
        tokens.forEach((token) => incrementMapCount(tokenCounts, token, 1));
      });
    });

    profiles.set(drawer.drawer_id, { drawer, tokenCounts, groupCounts });
  }

  return profiles;
};

const makeDrawerState = (drawer: Drawer): DrawerState => {
  const orderedLayers = [...drawer.layers]
    .sort((a, b) => a.z_index - b.z_index)
    .map((l) => ({ layer_id: l.layer_id, z_index: l.z_index }));

  const layerCount = orderedLayers.length;
  const occupancy: boolean[][][] = Array.from({ length: layerCount }, () =>
    Array.from({ length: drawer.width_units }, () =>
      Array.from({ length: drawer.depth_units }, () => false)
    )
  );

  return {
    drawer,
    orderedLayers,
    occupancy,
    groupAnchors: new Map<string, GroupAnchor>(),
  };
};

const canPlaceAt = (
  state: DrawerState,
  bin: Bin,
  x: number,
  y: number,
  z: number
): boolean => {
  const width = bin.width_units;
  const depth = bin.depth_units;
  const height = Math.max(1, bin.height_units || 1);
  const layerCount = state.orderedLayers.length;

  if (x < 0 || y < 0 || z < 0) return false;
  if (x + width > state.drawer.width_units) return false;
  if (y + depth > state.drawer.depth_units) return false;
  if (z + height > layerCount) return false;

  for (let zz = z; zz < z + height; zz += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      for (let yy = y; yy < y + depth; yy += 1) {
        if (state.occupancy[zz][xx][yy]) {
          return false;
        }
      }
    }
  }

  if (z > 0) {
    for (let xx = x; xx < x + width; xx += 1) {
      for (let yy = y; yy < y + depth; yy += 1) {
        if (!state.occupancy[z - 1][xx][yy]) {
          return false;
        }
      }
    }
  }

  return true;
};

const computePlacementScore = (
  state: DrawerState,
  groupKey: string,
  x: number,
  y: number,
  z: number
): number => {
  let score = z * 100000 + y * state.drawer.width_units + x;
  const anchor = state.groupAnchors.get(groupKey);

  if (anchor) {
    const distance =
      Math.abs(anchor.x - x) +
      Math.abs(anchor.y - y) +
      Math.abs(anchor.z - z) * 4;
    score += distance * 15;
  }

  return score;
};

const markPlacement = (
  state: DrawerState,
  bin: Bin,
  x: number,
  y: number,
  z: number,
  groupKey: string
) => {
  const width = bin.width_units;
  const depth = bin.depth_units;
  const height = Math.max(1, bin.height_units || 1);

  for (let zz = z; zz < z + height; zz += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      for (let yy = y; yy < y + depth; yy += 1) {
        state.occupancy[zz][xx][yy] = true;
      }
    }
  }

  const existingAnchor = state.groupAnchors.get(groupKey);
  if (!existingAnchor) {
    state.groupAnchors.set(groupKey, { x, y, z, count: 1 });
    return;
  }

  const nextCount = existingAnchor.count + 1;
  state.groupAnchors.set(groupKey, {
    x: Math.round((existingAnchor.x * existingAnchor.count + x) / nextCount),
    y: Math.round((existingAnchor.y * existingAnchor.count + y) / nextCount),
    z: Math.round((existingAnchor.z * existingAnchor.count + z) / nextCount),
    count: nextCount,
  });
};

const getCategoryReason = (groupKey: string, categoriesById: Record<string, Category>): string | null => {
  if (!groupKey.startsWith('cat:')) return null;
  const categoryId = groupKey.slice(4);
  const categoryName = categoriesById[categoryId]?.name;
  if (!categoryName) return 'Regroupement par catégorie';
  return `Regroupement catégorie: ${categoryName}`;
};

const drawerCandidateScore = (
  binMeta: BinMeta,
  candidateDrawerId: string,
  profiles: Map<string, DrawerProfile>
): number => {
  const profile = profiles.get(candidateDrawerId);
  if (!profile) return Number.NEGATIVE_INFINITY;

  const groupBoost = (profile.groupCounts.get(binMeta.groupKey) || 0) * 6;

  let tokenOverlap = 0;
  for (const token of binMeta.tokens) {
    const count = profile.tokenCounts.get(token) || 0;
    tokenOverlap += Math.log1p(count);
  }

  const sameDrawerBoost = candidateDrawerId === binMeta.sourceDrawerId ? 0.5 : 0;

  return groupBoost + tokenOverlap + sameDrawerBoost;
};

const findPlacementInDrawer = (
  state: DrawerState,
  binMeta: BinMeta,
  categoriesById: Record<string, Category>
): PlacementCandidate | null => {
  const height = Math.max(1, binMeta.bin.height_units || 1);
  const maxStartLayer = state.orderedLayers.length - height;
  if (maxStartLayer < 0) return null;

  let best: { x: number; y: number; z: number; score: number } | null = null;

  for (let z = 0; z <= maxStartLayer; z += 1) {
    for (let y = 0; y <= state.drawer.depth_units - binMeta.bin.depth_units; y += 1) {
      for (let x = 0; x <= state.drawer.width_units - binMeta.bin.width_units; x += 1) {
        if (!canPlaceAt(state, binMeta.bin, x, y, z)) continue;

        const score = computePlacementScore(state, binMeta.groupKey, x, y, z);
        if (!best || score < best.score) {
          best = { x, y, z, score };
        }
      }
    }
  }

  if (!best) return null;

  const categoryReason = getCategoryReason(binMeta.groupKey, categoriesById);
  const reason =
    categoryReason ||
    (binMeta.tokens.length > 0
      ? `Similarité contenu: ${binMeta.tokens.slice(0, 2).join(', ')}`
      : 'Optimisation de l’espace');

  return {
    drawerId: state.drawer.drawer_id,
    drawerName: state.drawer.name,
    layerId: state.orderedLayers[best.z].layer_id,
    layerIndex: best.z,
    x: best.x,
    y: best.y,
    z: best.z,
    reason,
  };
};

const flattenBins = (
  drawers: Drawer[],
  categoriesById: Record<string, Category>
): BinMeta[] => {
  const binMetas: BinMeta[] = [];

  drawers.forEach((drawer) => {
    drawer.layers.forEach((layer, layerIndex) => {
      layer.bins.forEach((bin) => {
        const categoryName = bin.category_id ? categoriesById[bin.category_id]?.name : undefined;
        const tokens = buildBinTokens(bin, categoryName);
        const groupKey = buildGroupKey(bin, tokens);

        binMetas.push({
          bin,
          sourceDrawerId: drawer.drawer_id,
          sourceDrawerName: drawer.name,
          sourceLayerId: layer.layer_id,
          sourceLayerIndex: layerIndex,
          groupKey,
          tokens,
        });
      });
    });
  });

  return binMetas;
};

const sortBinsForPlacement = (bins: BinMeta[]): BinMeta[] => {
  const groupFrequency = new Map<string, number>();
  bins.forEach((binMeta) => {
    incrementMapCount(groupFrequency, binMeta.groupKey, 1);
  });

  return [...bins].sort((a, b) => {
    const groupDiff = (groupFrequency.get(b.groupKey) || 0) - (groupFrequency.get(a.groupKey) || 0);
    if (groupDiff !== 0) return groupDiff;

    const volumeA = a.bin.width_units * a.bin.depth_units * Math.max(1, a.bin.height_units || 1);
    const volumeB = b.bin.width_units * b.bin.depth_units * Math.max(1, b.bin.height_units || 1);
    if (volumeB !== volumeA) return volumeB - volumeA;

    return a.bin.bin_id.localeCompare(b.bin.bin_id);
  });
};

const buildDrawerSummary = (
  targetDrawers: Drawer[],
  moves: PlanBinMove[],
  allPlacements: Array<{ binMeta: BinMeta; placement: PlacementCandidate }>
): DrawerPlanSummary[] => {
  return targetDrawers.map((drawer) => {
    const placed = allPlacements.filter((entry) => entry.placement.drawerId === drawer.drawer_id).length;
    const movedIn = moves.filter(
      (move) => move.toDrawerId === drawer.drawer_id && move.fromDrawerId !== drawer.drawer_id
    ).length;
    const movedOut = moves.filter(
      (move) => move.fromDrawerId === drawer.drawer_id && move.toDrawerId !== drawer.drawer_id
    ).length;

    return {
      drawerId: drawer.drawer_id,
      drawerName: drawer.name,
      placed,
      movedIn,
      movedOut,
    };
  });
};

export const generateReorganizationPlan = (
  drawers: Drawer[],
  options: GeneratePlanOptions
): ReorganizationPlan => {
  const categoriesById = options.categoriesById || {};

  const targetDrawers =
    options.scope === 'drawer'
      ? drawers.filter((drawer) => drawer.drawer_id === options.currentDrawerId)
      : drawers;

  if (targetDrawers.length === 0) {
    return {
      scope: options.scope,
      generatedAt: new Date().toISOString(),
      totalBins: 0,
      unchanged: 0,
      moves: [],
      unplaced: [],
      drawerSummaries: [],
    };
  }

  const sourceDrawers = options.scope === 'drawer' ? targetDrawers : drawers;
  const profiles = buildProfiles(drawers, categoriesById);
  const binMetas = sortBinsForPlacement(flattenBins(sourceDrawers, categoriesById));

  const drawerStates = new Map<string, DrawerState>();
  targetDrawers.forEach((drawer) => {
    drawerStates.set(drawer.drawer_id, makeDrawerState(drawer));
  });

  const moves: PlanBinMove[] = [];
  const unplaced: PlanUnplacedBin[] = [];
  let unchanged = 0;

  const allPlacements: Array<{ binMeta: BinMeta; placement: PlacementCandidate }> = [];

  for (const binMeta of binMetas) {
    const candidateDrawers = targetDrawers
      .filter((drawer) => {
        const maxLayers = drawer.layers.length;
        return (
          binMeta.bin.width_units <= drawer.width_units &&
          binMeta.bin.depth_units <= drawer.depth_units &&
          Math.max(1, binMeta.bin.height_units || 1) <= maxLayers
        );
      })
      .map((drawer) => ({
        drawer,
        score: drawerCandidateScore(binMeta, drawer.drawer_id, profiles),
      }))
      .sort((a, b) => b.score - a.score);

    if (candidateDrawers.length === 0) {
      unplaced.push({
        binId: binMeta.bin.bin_id,
        title: binMeta.bin.content.title || 'Sans titre',
        reason: 'Dimensions incompatibles avec les tiroirs/couches disponibles',
      });
      continue;
    }

    let placed = false;

    for (const candidate of candidateDrawers) {
      const state = drawerStates.get(candidate.drawer.drawer_id);
      if (!state) continue;

      const placement = findPlacementInDrawer(state, binMeta, categoriesById);
      if (!placement) continue;

      markPlacement(
        state,
        binMeta.bin,
        placement.x,
        placement.y,
        placement.z,
        binMeta.groupKey
      );

      allPlacements.push({ binMeta, placement });

      const hasChanged =
        placement.drawerId !== binMeta.sourceDrawerId ||
        placement.layerId !== binMeta.sourceLayerId ||
        placement.x !== binMeta.bin.x_grid ||
        placement.y !== binMeta.bin.y_grid;

      if (hasChanged) {
        moves.push({
          binId: binMeta.bin.bin_id,
          title: binMeta.bin.content.title || 'Sans titre',
          fromDrawerId: binMeta.sourceDrawerId,
          fromDrawerName: binMeta.sourceDrawerName,
          fromLayerId: binMeta.sourceLayerId,
          fromLayerIndex: binMeta.sourceLayerIndex,
          fromX: binMeta.bin.x_grid,
          fromY: binMeta.bin.y_grid,
          toDrawerId: placement.drawerId,
          toDrawerName: placement.drawerName,
          toLayerId: placement.layerId,
          toLayerIndex: placement.layerIndex,
          toX: placement.x,
          toY: placement.y,
          reason: placement.reason,
        });
      } else {
        unchanged += 1;
      }

      placed = true;
      break;
    }

    if (!placed) {
      unplaced.push({
        binId: binMeta.bin.bin_id,
        title: binMeta.bin.content.title || 'Sans titre',
        reason: 'Pas assez d’espace disponible en respectant le support vertical',
      });
    }
  }

  const drawerSummaries = buildDrawerSummary(targetDrawers, moves, allPlacements);

  return {
    scope: options.scope,
    generatedAt: new Date().toISOString(),
    totalBins: binMetas.length,
    unchanged,
    moves,
    unplaced,
    drawerSummaries,
  };
};
