import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, RoundedBox, Text } from '@react-three/drei';
import type { Drawer } from '../types/api';
import type { ReorganizationPlan } from '../utils/reorganization';

const GRID_CELL = 26;
const PREVIEW_3D_CELL = 0.42;
const PREVIEW_3D_HEIGHT = 0.42;

type PreviewMode = 'grid' | '3d';

interface ReorganizationPlanPreviewProps {
  plan: ReorganizationPlan;
  drawers: Drawer[];
}

interface PreviewBin3DProps {
  title: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  changed: boolean;
}

function PreviewBin3D({ title, x, y, z, w, d, h, changed }: PreviewBin3DProps) {
  const binHeight = h * PREVIEW_3D_HEIGHT;

  return (
    <group>
      <group
        position={[
          x * PREVIEW_3D_CELL + (w * PREVIEW_3D_CELL) / 2,
          z * PREVIEW_3D_HEIGHT + binHeight / 2,
          y * PREVIEW_3D_CELL + (d * PREVIEW_3D_CELL) / 2,
        ]}
      >
        <RoundedBox
          args={[
            w * PREVIEW_3D_CELL - 0.01,
            binHeight - 0.01,
            d * PREVIEW_3D_CELL - 0.01,
          ]}
          radius={0.02}
          smoothness={4}
        >
          <meshStandardMaterial
            color={changed ? '#3b82f6' : '#64748b'}
            opacity={changed ? 0.95 : 0.55}
            transparent
            metalness={0.2}
            roughness={0.35}
          />
        </RoundedBox>
      </group>

      <Text
        position={[
          x * PREVIEW_3D_CELL + (w * PREVIEW_3D_CELL) / 2,
          z * PREVIEW_3D_HEIGHT + binHeight + 0.01,
          y * PREVIEW_3D_CELL + (d * PREVIEW_3D_CELL) / 2,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.07}
        color={changed ? '#e0f2fe' : '#e2e8f0'}
        maxWidth={w * PREVIEW_3D_CELL * 0.9}
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
    </group>
  );
}

export default function ReorganizationPlanPreview({ plan, drawers }: ReorganizationPlanPreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('grid');
  const [selectedDrawerId, setSelectedDrawerId] = useState<string>('');
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');

  const drawersById = useMemo(() => {
    const map = new Map<string, Drawer>();
    drawers.forEach((drawer) => map.set(drawer.drawer_id, drawer));
    return map;
  }, [drawers]);

  useEffect(() => {
    if (plan.drawerSummaries.length === 0) {
      setSelectedDrawerId('');
      return;
    }

    if (!selectedDrawerId || !plan.drawerSummaries.some((summary) => summary.drawerId === selectedDrawerId)) {
      setSelectedDrawerId(plan.drawerSummaries[0].drawerId);
      setSelectedLayer('all');
    }
  }, [plan, selectedDrawerId]);

  const selectedDrawer = selectedDrawerId ? drawersById.get(selectedDrawerId) || null : null;

  const selectedPlacements = useMemo(() => {
    if (!selectedDrawerId) return [];
    const base = plan.placements.filter((placement) => placement.toDrawerId === selectedDrawerId);

    if (selectedLayer === 'all') return base;
    return base.filter((placement) => placement.toLayerIndex === selectedLayer);
  }, [plan.placements, selectedDrawerId, selectedLayer]);

  const gridLayerIndex = selectedLayer === 'all' ? 0 : selectedLayer;
  const gridBins = useMemo(
    () => selectedPlacements.filter((placement) => placement.toLayerIndex === gridLayerIndex),
    [selectedPlacements, gridLayerIndex]
  );

  if (!selectedDrawer) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
        <p className="text-sm text-[var(--color-text-secondary)]">Aucun aperçu disponible.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <h3 className="text-lg font-semibold">Aperçu des changements</h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setPreviewMode('grid')}
              className={`h-8 px-3 rounded-md text-xs font-medium ${
                previewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setPreviewMode('3d')}
              className={`h-8 px-3 rounded-md text-xs font-medium ${
                previewMode === '3d' ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              3D
            </button>
          </div>

          <select
            className="h-8 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs"
            value={selectedDrawerId}
            onChange={(e) => {
              setSelectedDrawerId(e.target.value);
              setSelectedLayer('all');
            }}
          >
            {plan.drawerSummaries.map((summary) => (
              <option key={summary.drawerId} value={summary.drawerId}>
                {summary.drawerName}
              </option>
            ))}
          </select>

          <select
            className="h-8 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs"
            value={selectedLayer}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedLayer(value === 'all' ? 'all' : parseInt(value, 10));
            }}
          >
            <option value="all">Toutes couches</option>
            {selectedDrawer.layers.map((_, idx) => (
              <option key={idx} value={idx}>
                Couche {idx + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500" /> Déplacée
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-500" /> Inchangée
        </span>
        <span>{selectedPlacements.length} boîte(s) affichée(s)</span>
      </div>

      {previewMode === 'grid' ? (
        <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
          <div
            className="relative rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]"
            style={{
              width: selectedDrawer.width_units * GRID_CELL,
              height: selectedDrawer.depth_units * GRID_CELL,
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)',
              backgroundSize: `${GRID_CELL}px ${GRID_CELL}px`,
            }}
          >
            {gridBins.map((placement) => (
              <div
                key={`${placement.binId}-${placement.toLayerIndex}`}
                className={`absolute rounded-md border overflow-hidden ${
                  placement.changed
                    ? 'bg-blue-500/80 border-blue-300'
                    : 'bg-slate-500/60 border-slate-300'
                }`}
                title={`${placement.title} — ${placement.reason}`}
                style={{
                  left: placement.toX * GRID_CELL,
                  top: placement.toY * GRID_CELL,
                  width: placement.widthUnits * GRID_CELL,
                  height: placement.depthUnits * GRID_CELL,
                }}
              >
                <div className="text-[10px] leading-tight text-white px-1 py-0.5 line-clamp-2">
                  {placement.title}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Vue grille de la couche {gridLayerIndex + 1}. Utilisez le menu couche pour comparer les étages.
          </p>
        </div>
      ) : (
        <div className="h-[360px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[5, 6, 5]} fov={48} />
            <OrbitControls enablePan enableRotate enableZoom minDistance={1} maxDistance={22} />

            <ambientLight intensity={0.45} />
            <directionalLight position={[6, 10, 6]} intensity={0.9} castShadow />
            <pointLight position={[-5, 6, -4]} intensity={0.25} />

            <mesh
              position={[
                (selectedDrawer.width_units * PREVIEW_3D_CELL) / 2,
                -0.01,
                (selectedDrawer.depth_units * PREVIEW_3D_CELL) / 2,
              ]}
              receiveShadow
            >
              <boxGeometry
                args={[
                  selectedDrawer.width_units * PREVIEW_3D_CELL,
                  0.02,
                  selectedDrawer.depth_units * PREVIEW_3D_CELL,
                ]}
              />
              <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.85} />
            </mesh>

            {selectedPlacements.map((placement) => (
              <PreviewBin3D
                key={`${placement.binId}-${placement.toDrawerId}-${placement.toLayerId}`}
                title={placement.title}
                x={placement.toX}
                y={placement.toY}
                z={placement.toLayerIndex}
                w={placement.widthUnits}
                d={placement.depthUnits}
                h={placement.heightUnits}
                changed={placement.changed}
              />
            ))}
          </Canvas>
        </div>
      )}
    </div>
  );
}
