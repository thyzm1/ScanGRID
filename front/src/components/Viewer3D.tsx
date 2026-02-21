import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, RoundedBox } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import type { Bin } from '../types/api';

const GRID_CELL_SIZE = 0.42; // 42mm per Gridfinity unit in 3D space
const BIN_HEIGHT = 0.42; // 42mm height (blocks are 42x42x42)

interface BinMeshProps {
  bin: Bin;
  layerIndex: number;
  color: string;
  onClick: (bin: Bin) => void;
}

function BinMesh({ bin, layerIndex, color, onClick }: BinMeshProps) {
  return (
    <group>
      {/* Main bin body with rounded edges */}
      <group
        position={[
          bin.x_grid * GRID_CELL_SIZE + (bin.width_units * GRID_CELL_SIZE) / 2,
          layerIndex * BIN_HEIGHT + BIN_HEIGHT / 2,
          bin.y_grid * GRID_CELL_SIZE + (bin.depth_units * GRID_CELL_SIZE) / 2,
        ]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(bin);
        }}
      >
        <RoundedBox
          args={[
            bin.width_units * GRID_CELL_SIZE - 0.01,
            BIN_HEIGHT - 0.01,
            bin.depth_units * GRID_CELL_SIZE - 0.01,
          ]}
          radius={0.02}
          smoothness={4}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={bin.color || color}
            metalness={0.2}
            roughness={0.3}
            opacity={0.95}
            transparent
          />
        </RoundedBox>
      </group>
      
      {/* Label text on top */}
      <Text
        position={[
          bin.x_grid * GRID_CELL_SIZE + (bin.width_units * GRID_CELL_SIZE) / 2,
          layerIndex * BIN_HEIGHT + BIN_HEIGHT + 0.01,
          bin.y_grid * GRID_CELL_SIZE + (bin.depth_units * GRID_CELL_SIZE) / 2,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={bin.width_units * GRID_CELL_SIZE * 0.9}
      >
        {bin.content.title}
      </Text>
    </group>
  );
}

interface Viewer3DProps {
  onBinClick: (bin: Bin) => void;
}

export default function Viewer3D({ onBinClick }: Viewer3DProps) {
  const { currentDrawer, currentLayerIndex } = useStore();
  const [selectedLayer, setSelectedLayer] = useState<number | 'all'>('all');

  if (!currentDrawer) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        Aucun tiroir sélectionné
      </div>
    );
  }

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  const visibleLayers = selectedLayer === 'all' 
    ? currentDrawer.layers 
    : currentDrawer.layers.filter((_, idx) => idx === selectedLayer);

  return (
    <div className="h-full w-full bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 6, 5]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.3} />

        {/* Drawer Base (floor) - Simple plane without grid */}
        <mesh
          position={[
            (currentDrawer.width_units * GRID_CELL_SIZE) / 2,
            -0.01,
            (currentDrawer.depth_units * GRID_CELL_SIZE) / 2,
          ]}
          receiveShadow
        >
          <boxGeometry
            args={[
              currentDrawer.width_units * GRID_CELL_SIZE,
              0.02,
              currentDrawer.depth_units * GRID_CELL_SIZE,
            ]}
          />
          <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Bins from visible layers */}
        {visibleLayers.map((layer) => {
          // Find original index
          const originalIdx = currentDrawer.layers.findIndex(l => l.layer_id === layer.layer_id);
          return layer.bins.map((bin) => (
            <BinMesh
              key={bin.bin_id}
              bin={bin}
              layerIndex={originalIdx} // Use original index for correct height stacking
              color={
                originalIdx === currentLayerIndex
                  ? colors[originalIdx % colors.length]
                  : '#888888' // Dim other layers if desired, or keep color
              }
              onClick={onBinClick}
            />
          ));
        })}

        {/* Layer labels for visible layers */}
        {visibleLayers.map((layer) => {
           const idx = currentDrawer.layers.findIndex(l => l.layer_id === layer.layer_id);
           return (
            <Text
              key={`label-${layer.layer_id}`}
              position={[-0.3, idx * BIN_HEIGHT + BIN_HEIGHT / 2, 0]}
              rotation={[0, Math.PI / 2, 0]}
              fontSize={0.2}
              color={idx === currentLayerIndex ? '#3b82f6' : '#888888'}
              anchorX="left"
            >
              L{idx + 1}
            </Text>
          );
        })}
      </Canvas>

      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
        <div className="font-semibold">{currentDrawer.name}</div>
        <div className="text-xs opacity-80">
          {currentDrawer.width_units}x{currentDrawer.depth_units} • {currentDrawer.layers.length} couche(s)
        </div>
        <div className="text-xs opacity-60 mt-1">
          Molette: Zoom • Drag: Rotation
        </div>
      </div>

       {/* Layer Selector Tool */}
       <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md p-2 rounded-full flex gap-2">
          <button
            onClick={() => setSelectedLayer('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              selectedLayer === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            Tout
          </button>
          {currentDrawer.layers.map((_, index) => (
             <button
                key={index}
                onClick={() => setSelectedLayer(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  selectedLayer === index
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-300 hover:bg-white/10'
                }`}
             >
                {index + 1}
             </button>
          ))}
       </div>
    </div>
  );
}
