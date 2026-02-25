import type { Bin, Category, Drawer } from '../types/api';

export type ReorganizationScope = 'drawer' | 'global';
export type ReorganizationMode = 'smart' | 'by_layer';

export interface PlanBinMove {
  binId: string;
  title: string;
  fromDrawerId: string;
  fromDrawerName: string;
  fromLayerId: string;
  fromLayerIndex: number;
  fromX: number;
  fromY: number;
  fromWidthUnits: number;
  fromDepthUnits: number;
  toDrawerId: string;
  toDrawerName: string;
  toLayerId: string;
  toLayerIndex: number;
  toX: number;
  toY: number;
  toWidthUnits: number;
  toDepthUnits: number;
  rotated: boolean;
  reason: string;
}

export interface PlanPlacement {
  binId: string;
  title: string;
  widthUnits: number;
  depthUnits: number;
  heightUnits: number;
  rotated: boolean;
  fromDrawerId: string;
  fromDrawerName: string;
  fromLayerId: string;
  fromLayerIndex: number;
  fromX: number;
  fromY: number;
  fromWidthUnits: number;
  fromDepthUnits: number;
  toDrawerId: string;
  toDrawerName: string;
  toLayerId: string;
  toLayerIndex: number;
  toX: number;
  toY: number;
  changed: boolean;
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
  mode: ReorganizationMode;
  generatedAt: string;
  totalBins: number;
  unchanged: number;
  moves: PlanBinMove[];
  placements: PlanPlacement[];
  unplaced: PlanUnplacedBin[];
  drawerSummaries: DrawerPlanSummary[];
}

export interface GeneratePlanOptions {
  scope: ReorganizationScope;
  mode: ReorganizationMode;
  currentDrawerId?: string;
  categoriesById?: Record<string, Category>;
}

interface SizeSignature {
  family: string;
  diameter: number;
  length: number;
  raw: string;
}

interface BinMeta {
  bin: Bin;
  sourceDrawerId: string;
  sourceDrawerName: string;
  sourceLayerId: string;
  sourceLayerIndex: number;
  groupKey: string;
  tokens: string[];
  sizeSignature: SizeSignature | null;
  canPlaceOnTop: boolean;
  canRotate: boolean;
}

interface DrawerProfile {
  tokenCounts: Map<string, number>;
  groupCounts: Map<string, number>;
  sizeFamilyCounts: Map<string, number>;
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
  widthUnits: number;
  depthUnits: number;
  rotated: boolean;
}

interface DrawerState {
  drawer: Drawer;
  orderedLayers: { layer_id: string; z_index: number }[];
  occupancy: boolean[][][];
  supportSurface: boolean[][][];
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

const parseSizeSignature = (bin: Bin): SizeSignature | null => {
  const itemsText = Array.isArray(bin.content.items) ? bin.content.items.join(' ') : '';
  const source = `${bin.content.title || ''} ${bin.content.description || ''} ${itemsText}`;

  const metricMatch = source.match(/\bM\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\b/i);
  if (metricMatch) {
    const diameter = parseFloat(metricMatch[1].replace(',', '.'));
    const length = parseFloat(metricMatch[2].replace(',', '.'));
    if (!Number.isNaN(diameter) && !Number.isNaN(length)) {
      return {
        family: `M${diameter}`,
        diameter,
        length,
        raw: `M${diameter}x${length}`,
      };
    }
  }

  const genericMatch = source.match(/\b(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\b/i);
  if (genericMatch) {
    const diameter = parseFloat(genericMatch[1].replace(',', '.'));
    const length = parseFloat(genericMatch[2].replace(',', '.'));
    if (!Number.isNaN(diameter) && !Number.isNaN(length)) {
      return {
        family: `S${diameter}`,
        diameter,
        length,
        raw: `${diameter}x${length}`,
      };
    }
  }

  return null;
};

const buildGroupKey = (bin: Bin, sizeSignature: SizeSignature | null, tokens: string[]): string => {
  if (bin.category_id) return `cat:${bin.category_id}`;
  if (sizeSignature) return `size:${sizeSignature.family}`;
  if (tokens.length > 0) return `kw:${tokens[0]}`;
  return 'misc:autres';
};

const canSupportOtherBins = (bin: Bin): boolean => {
  return bin.content.can_place_on_top !== false;
};

const canRotateBin = (bin: Bin): boolean => {
  return bin.content.can_rotate === true;
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
    const sizeFamilyCounts = new Map<string, number>();

    drawer.layers.forEach((layer) => {
      layer.bins.forEach((bin) => {
        const categoryName = bin.category_id ? categoriesById[bin.category_id]?.name : undefined;
        const tokens = buildBinTokens(bin, categoryName);
        const sizeSignature = parseSizeSignature(bin);
        const groupKey = buildGroupKey(bin, sizeSignature, tokens);

        incrementMapCount(groupCounts, groupKey, 1);
        tokens.forEach((token) => incrementMapCount(tokenCounts, token, 1));
        if (sizeSignature) {
          incrementMapCount(sizeFamilyCounts, sizeSignature.family, 1);
        }
      });
    });

    profiles.set(drawer.drawer_id, { tokenCounts, groupCounts, sizeFamilyCounts });
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
  const supportSurface: boolean[][][] = Array.from({ length: layerCount }, () =>
    Array.from({ length: drawer.width_units }, () =>
      Array.from({ length: drawer.depth_units }, () => false)
    )
  );

  return {
    drawer,
    orderedLayers,
    occupancy,
    supportSurface,
    groupAnchors: new Map<string, GroupAnchor>(),
  };
};

const canPlaceAt = (
  state: DrawerState,
  width: number,
  depth: number,
  height: number,
  x: number,
  y: number,
  z: number
): boolean => {
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
        if (!state.supportSurface[z - 1][xx][yy]) {
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
  z: number,
  preferUpperLayers: boolean,
  maxStartLayer: number,
  rotated: boolean
): number => {
  const zCost = preferUpperLayers ? maxStartLayer - z : z;
  let score = zCost * 100000 + y * state.drawer.width_units + x;
  const anchor = state.groupAnchors.get(groupKey);

  if (anchor) {
    const distance =
      Math.abs(anchor.x - x) +
      Math.abs(anchor.y - y) +
      Math.abs(anchor.z - z) * 4;
    score += distance * 15;
  }

  if (rotated) {
    score += 8;
  }

  return score;
};

const markPlacement = (
  state: DrawerState,
  width: number,
  depth: number,
  height: number,
  x: number,
  y: number,
  z: number,
  groupKey: string,
  canPlaceOnTop: boolean
) => {
  for (let zz = z; zz < z + height; zz += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      for (let yy = y; yy < y + depth; yy += 1) {
        state.occupancy[zz][xx][yy] = true;
      }
    }
  }

  const topLayer = z + height - 1;
  for (let xx = x; xx < x + width; xx += 1) {
    for (let yy = y; yy < y + depth; yy += 1) {
      state.supportSurface[topLayer][xx][yy] = canPlaceOnTop;
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

const drawerCandidateScore = (
  binMeta: BinMeta,
  candidateDrawerId: string,
  profiles: Map<string, DrawerProfile>,
  mode: ReorganizationMode
): number => {
  const profile = profiles.get(candidateDrawerId);
  if (!profile) return Number.NEGATIVE_INFINITY;

  if (mode === 'by_layer') {
    return candidateDrawerId === binMeta.sourceDrawerId ? 1 : Number.NEGATIVE_INFINITY;
  }

  const groupBoost = (profile.groupCounts.get(binMeta.groupKey) || 0) * 6;

  let tokenOverlap = 0;
  for (const token of binMeta.tokens) {
    const count = profile.tokenCounts.get(token) || 0;
    tokenOverlap += Math.log1p(count);
  }

  const sizeBoost = binMeta.sizeSignature
    ? (profile.sizeFamilyCounts.get(binMeta.sizeSignature.family) || 0) * 3
    : 0;

  const sameDrawerBoost = candidateDrawerId === binMeta.sourceDrawerId ? 0.5 : 0;

  return groupBoost + tokenOverlap + sizeBoost + sameDrawerBoost;
};

const findPlacementInDrawer = (
  state: DrawerState,
  binMeta: BinMeta,
  mode: ReorganizationMode
): PlacementCandidate | null => {
  const height = Math.max(1, binMeta.bin.height_units || 1);
  const maxStartLayer = state.orderedLayers.length - height;
  if (maxStartLayer < 0) return null;
  const preferUpperLayers = mode === 'smart' && !binMeta.canPlaceOnTop;

  const orientations: Array<{ widthUnits: number; depthUnits: number; rotated: boolean }> = [
    {
      widthUnits: binMeta.bin.width_units,
      depthUnits: binMeta.bin.depth_units,
      rotated: false,
    },
  ];
  if (
    binMeta.canRotate &&
    binMeta.bin.width_units !== binMeta.bin.depth_units
  ) {
    orientations.push({
      widthUnits: binMeta.bin.depth_units,
      depthUnits: binMeta.bin.width_units,
      rotated: true,
    });
  }

  const zCandidates: number[] = [];
  if (mode === 'by_layer') {
    const z = Math.min(Math.max(0, binMeta.sourceLayerIndex), maxStartLayer);
    zCandidates.push(z);
  } else {
    if (preferUpperLayers) {
      for (let z = maxStartLayer; z >= 0; z -= 1) {
        zCandidates.push(z);
      }
    } else {
      for (let z = 0; z <= maxStartLayer; z += 1) {
        zCandidates.push(z);
      }
    }
  }

  let best:
    | { x: number; y: number; z: number; score: number; widthUnits: number; depthUnits: number; rotated: boolean }
    | null = null;

  for (const orientation of orientations) {
    for (const z of zCandidates) {
      for (let y = 0; y <= state.drawer.depth_units - orientation.depthUnits; y += 1) {
        for (let x = 0; x <= state.drawer.width_units - orientation.widthUnits; x += 1) {
          if (!canPlaceAt(state, orientation.widthUnits, orientation.depthUnits, height, x, y, z)) continue;

          const score = computePlacementScore(
            state,
            binMeta.groupKey,
            x,
            y,
            z,
            preferUpperLayers,
            maxStartLayer,
            orientation.rotated
          );
          if (!best || score < best.score) {
            best = {
              x,
              y,
              z,
              score,
              widthUnits: orientation.widthUnits,
              depthUnits: orientation.depthUnits,
              rotated: orientation.rotated,
            };
          }
        }
      }
    }
  }

  if (!best) return null;

  return {
    drawerId: state.drawer.drawer_id,
    drawerName: state.drawer.name,
    layerId: state.orderedLayers[best.z].layer_id,
    layerIndex: best.z,
    x: best.x,
    y: best.y,
    z: best.z,
    widthUnits: best.widthUnits,
    depthUnits: best.depthUnits,
    rotated: best.rotated,
  };
};

const flattenBins = (
  drawers: Drawer[],
  categoriesById: Record<string, Category>
): BinMeta[] => {
  const binMetas: BinMeta[] = [];

  drawers.forEach((drawer) => {
    const orderedLayers = [...drawer.layers].sort((a, b) => a.z_index - b.z_index);
    orderedLayers.forEach((layer, layerIndex) => {
      layer.bins.forEach((bin) => {
        const categoryName = bin.category_id ? categoriesById[bin.category_id]?.name : undefined;
        const tokens = buildBinTokens(bin, categoryName);
        const sizeSignature = parseSizeSignature(bin);
        const groupKey = buildGroupKey(bin, sizeSignature, tokens);

        binMetas.push({
          bin,
          sourceDrawerId: drawer.drawer_id,
          sourceDrawerName: drawer.name,
          sourceLayerId: layer.layer_id,
          sourceLayerIndex: layerIndex,
          groupKey,
          tokens,
          sizeSignature,
          canPlaceOnTop: canSupportOtherBins(bin),
          canRotate: canRotateBin(bin),
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
    if (a.canPlaceOnTop !== b.canPlaceOnTop) {
      return a.canPlaceOnTop ? -1 : 1;
    }

    const groupDiff = (groupFrequency.get(b.groupKey) || 0) - (groupFrequency.get(a.groupKey) || 0);
    if (groupDiff !== 0) return groupDiff;

    if (a.groupKey === b.groupKey && a.sizeSignature && b.sizeSignature) {
      if (a.sizeSignature.diameter !== b.sizeSignature.diameter) {
        return a.sizeSignature.diameter - b.sizeSignature.diameter;
      }
      if (a.sizeSignature.length !== b.sizeSignature.length) {
        return a.sizeSignature.length - b.sizeSignature.length;
      }
    }

    const volumeA = a.bin.width_units * a.bin.depth_units * Math.max(1, a.bin.height_units || 1);
    const volumeB = b.bin.width_units * b.bin.depth_units * Math.max(1, b.bin.height_units || 1);
    if (volumeB !== volumeA) return volumeB - volumeA;

    return a.bin.bin_id.localeCompare(b.bin.bin_id);
  });
};

const buildDrawerSummary = (
  targetDrawers: Drawer[],
  moves: PlanBinMove[],
  placements: PlanPlacement[]
): DrawerPlanSummary[] => {
  return targetDrawers.map((drawer) => {
    const placed = placements.filter((entry) => entry.toDrawerId === drawer.drawer_id).length;
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

const buildReason = (
  binMeta: BinMeta,
  placement: PlacementCandidate,
  mode: ReorganizationMode,
  profiles: Map<string, DrawerProfile>,
  categoriesById: Record<string, Category>
): string => {
  const targetProfile = profiles.get(placement.drawerId);
  const groupCount = targetProfile ? (targetProfile.groupCounts.get(binMeta.groupKey) || 0) : 0;
  const excludesSelf = placement.drawerId === binMeta.sourceDrawerId ? 1 : 0;
  const similarCount = Math.max(0, groupCount - excludesSelf);
  const coherenceHint =
    similarCount > 0
      ? `${similarCount} boîte${similarCount > 1 ? 's' : ''} voisine${similarCount > 1 ? 's' : ''}`
      : "creation d'un regroupement coherent";

  const modePrefix = mode === 'by_layer' ? 'Intra-couche' : 'Optimisation';
  const rotationSuffix = placement.rotated ? ' + rotation 90°' : '';

  if (mode === 'smart' && !binMeta.canPlaceOnTop) {
    return `${modePrefix} non empilable: priorisee sur couche haute${rotationSuffix}`;
  }

  if (binMeta.sizeSignature) {
    return `${modePrefix} dimensionnelle ${binMeta.sizeSignature.raw} (${coherenceHint})${rotationSuffix}`;
  }

  if (binMeta.groupKey.startsWith('cat:')) {
    const categoryId = binMeta.groupKey.slice(4);
    const categoryName = categoriesById[categoryId]?.name || 'Catégorie';
    return `${modePrefix} par catégorie ${categoryName} (${coherenceHint})${rotationSuffix}`;
  }

  const uniqueTokens = Array.from(new Set(binMeta.tokens));
  if (uniqueTokens.length > 0) {
    return `${modePrefix} thématique: ${uniqueTokens.slice(0, 3).join(', ')}${rotationSuffix}`;
  }

  return `${modePrefix} de l’espace et cohérence locale${rotationSuffix}`;
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
      mode: options.mode,
      generatedAt: new Date().toISOString(),
      totalBins: 0,
      unchanged: 0,
      moves: [],
      placements: [],
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
  const placements: PlanPlacement[] = [];
  const unplaced: PlanUnplacedBin[] = [];
  let unchanged = 0;

  for (const binMeta of binMetas) {
    const candidateDrawers = targetDrawers
      .filter((drawer) => {
        const maxLayers = drawer.layers.length;
        if (options.mode === 'by_layer' && drawer.drawer_id !== binMeta.sourceDrawerId) {
          return false;
        }

        const canFitDirect =
          binMeta.bin.width_units <= drawer.width_units &&
          binMeta.bin.depth_units <= drawer.depth_units;
        const canFitRotated =
          binMeta.canRotate &&
          binMeta.bin.depth_units <= drawer.width_units &&
          binMeta.bin.width_units <= drawer.depth_units;

        return (
          (canFitDirect || canFitRotated) &&
          Math.max(1, binMeta.bin.height_units || 1) <= maxLayers
        );
      })
      .map((drawer) => ({
        drawer,
        score: drawerCandidateScore(binMeta, drawer.drawer_id, profiles, options.mode),
      }))
      .filter((entry) => Number.isFinite(entry.score))
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

      const placement = findPlacementInDrawer(state, binMeta, options.mode);
      if (!placement) continue;

      markPlacement(
        state,
        placement.widthUnits,
        placement.depthUnits,
        Math.max(1, binMeta.bin.height_units || 1),
        placement.x,
        placement.y,
        placement.z,
        binMeta.groupKey,
        binMeta.canPlaceOnTop
      );

      const hasChanged =
        placement.drawerId !== binMeta.sourceDrawerId ||
        placement.layerId !== binMeta.sourceLayerId ||
        placement.x !== binMeta.bin.x_grid ||
        placement.y !== binMeta.bin.y_grid ||
        placement.widthUnits !== binMeta.bin.width_units ||
        placement.depthUnits !== binMeta.bin.depth_units;

      const reason = buildReason(binMeta, placement, options.mode, profiles, categoriesById);

      placements.push({
        binId: binMeta.bin.bin_id,
        title: binMeta.bin.content.title || 'Sans titre',
        widthUnits: placement.widthUnits,
        depthUnits: placement.depthUnits,
        heightUnits: Math.max(1, binMeta.bin.height_units || 1),
        rotated: placement.rotated,
        fromDrawerId: binMeta.sourceDrawerId,
        fromDrawerName: binMeta.sourceDrawerName,
        fromLayerId: binMeta.sourceLayerId,
        fromLayerIndex: binMeta.sourceLayerIndex,
        fromX: binMeta.bin.x_grid,
        fromY: binMeta.bin.y_grid,
        fromWidthUnits: binMeta.bin.width_units,
        fromDepthUnits: binMeta.bin.depth_units,
        toDrawerId: placement.drawerId,
        toDrawerName: placement.drawerName,
        toLayerId: placement.layerId,
        toLayerIndex: placement.layerIndex,
        toX: placement.x,
        toY: placement.y,
        changed: hasChanged,
        reason,
      });

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
          fromWidthUnits: binMeta.bin.width_units,
          fromDepthUnits: binMeta.bin.depth_units,
          toDrawerId: placement.drawerId,
          toDrawerName: placement.drawerName,
          toLayerId: placement.layerId,
          toLayerIndex: placement.layerIndex,
          toX: placement.x,
          toY: placement.y,
          toWidthUnits: placement.widthUnits,
          toDepthUnits: placement.depthUnits,
          rotated: placement.rotated,
          reason,
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

  const drawerSummaries = buildDrawerSummary(targetDrawers, moves, placements);

  return {
    scope: options.scope,
    mode: options.mode,
    generatedAt: new Date().toISOString(),
    totalBins: binMetas.length,
    unchanged,
    moves,
    placements,
    unplaced,
    drawerSummaries,
  };
};
