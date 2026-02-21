import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import GridLayout, { Layout } from 'react-grid-layout';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useStore } from '../store/useStore';
import LayerSelector from './LayerSelector';
import UnplacedDock from './UnplacedDock';
import type { Bin } from '../types/api';

import { apiClient } from '../services/api';

const PASTEL_COLORS = [
  '#F87171', '#FBBF24', '#34D399', '#60A5FA', '#818CF8', '#A78BFA', '#F472B6', '#FB923C', '#A3E635', '#2DD4BF', '#F43F5E',
];
const AVAILABLE_ICONS = [
  'ri-tools-line', 'ri-file-list-line', 'ri-image-line', 'ri-camera-line', 'ri-music-line', 'ri-video-line', 'ri-mail-line', 'ri-phone-line', 'ri-map-pin-line', 'ri-gift-line', 'ri-trophy-line', 'ri-briefcase-line', 'ri-cup-line', 'ri-leaf-line', 'ri-seedling-line', 'ri-edit-line', 'ri-delete-bin-line', 'ri-lock-line', 'ri-shield-line', 'ri-key-line', 'ri-eye-line', 'ri-search-line', 'ri-share-line', 'ri-upload-cloud-line', 'ri-download-cloud-line', 'ri-cpu-line', 'ri-database-2-line', 'ri-server-line', 'ri-smartphone-line', 'ri-macbook-line', 'ri-hard-drive-line',
];

const getRandomColor = () => PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
const getRandomIcon = () => AVAILABLE_ICONS[Math.floor(Math.random() * AVAILABLE_ICONS.length)];

interface GridEditor3Props {
  onBinClick: (bin: Bin) => void;
  onBinDoubleClick: (bin: Bin) => void;
}

const BASE_CELL_SIZE = 80; // 80px par unité Gridfinity (strict!)

export default function GridEditor3({ onBinClick, onBinDoubleClick }: GridEditor3Props) {
  const {
    currentDrawer,
    currentLayerIndex,
    setCurrentDrawer,
    editMode,
    setEditMode,
    selectedBin,
    setSelectedBin,
    searchedBinId,
    setSearchedBinId,
  } = useStore();

  const [scale, setScale] = useState(1);
  const transformWrapperRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const [draggedDockBin, setDraggedDockBin] = useState<Bin | null>(null);

  // Center grid logic
  useEffect(() => {
    // Only center if we have a valid ref and drawer
    if (transformWrapperRef.current && currentDrawer) {
       const wrapper = transformWrapperRef.current;
       // Simply center viewing dynamic fit logic
       wrapper.centerView(1, 300, "easeOut");
    }
  }, [currentDrawer?.drawer_id, currentLayerIndex]); // Re-center when drawer or layer changes

  const handleRecenter = () => {
    if (transformWrapperRef.current) {
      const wrapper = transformWrapperRef.current;
      wrapper.centerView(1, 300, 'easeOut');
    }
  };

  if (!currentDrawer) return null;

  const currentLayer = currentDrawer.layers[currentLayerIndex];
  if (!currentLayer) return null;
  
  const placedBins = currentLayer.bins.filter(b => b.x_grid >= 0 && b.y_grid >= 0);
  const unplacedBins = currentLayer.bins.filter(b => b.x_grid < 0 || b.y_grid < 0);

  const GRID_WIDTH = currentDrawer.width_units * BASE_CELL_SIZE;
  const GRID_HEIGHT = currentDrawer.depth_units * BASE_CELL_SIZE;

  // Convert bins to react-grid-layout format
  const layout: Layout[] = placedBins.map((bin) => ({
    i: bin.bin_id,
    x: bin.x_grid,
    y: bin.y_grid,
    w: bin.width_units,
    h: bin.depth_units,
    minW: 1,
    minH: 1,
    maxW: currentDrawer.width_units,
    maxH: currentDrawer.depth_units,
    static: editMode === 'view', // Static in view mode
  }));

  // Check collision
  const isPositionOccupied = (
    x: number,
    y: number,
    w: number,
    h: number,
    excludeBinId?: string
  ): boolean => {
    return placedBins.some((bin) => {
      if (bin.bin_id === excludeBinId) return false;
      const overlapX = x < bin.x_grid + bin.width_units && x + w > bin.x_grid;
      const overlapY = y < bin.y_grid + bin.depth_units && y + h > bin.y_grid;
      return overlapX && overlapY;
    });
  };

  // Handle move to dock
  const handleMoveToDock = async (binId: string) => {
      // Optimistic update
      const updatedBins = currentLayer.bins.map(b => 
          b.bin_id === binId ? { ...b, x_grid: -1, y_grid: -1 } : b
      );
      
      const updatedLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: updatedBins } : layer
      );

      setCurrentDrawer({
        ...currentDrawer,
        layers: updatedLayers,
      }, true);

      try {
          await apiClient.updateBin(binId, { x_grid: -1, y_grid: -1 });
      } catch (e) {
          console.error("Failed to move bin to dock", e);
      }
  };

  const handleDrop = async (_: Layout[], item: Layout, e: any) => {
      // e might be wrapped
      const event = e.nativeEvent || e; 
      const binId = event.dataTransfer ? event.dataTransfer.getData("text/plain") : draggedDockBin?.bin_id;
      
      if (!binId) return;

      const bin = unplacedBins.find(b => b.bin_id === binId) || currentLayer.bins.find(b => b.bin_id === binId);
      if (!bin) return;
      
      // Calculate dropped position
      const newX = Math.min(Math.max(0, Math.round(item.x)), currentDrawer.width_units - bin.width_units);
      const newY = Math.min(Math.max(0, Math.round(item.y)), currentDrawer.depth_units - bin.depth_units);

      // Check collision
      if (isPositionOccupied(newX, newY, bin.width_units, bin.depth_units, binId)) {
          alert('Position occupée');
          return;
      }

      const updatedBins = currentLayer.bins.map(b => 
          b.bin_id === binId ? { ...b, x_grid: newX, y_grid: newY } : b
      );

       const updatedLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: updatedBins } : layer
      );

      setCurrentDrawer({
        ...currentDrawer,
        layers: updatedLayers,
      }, true);
      
      setDraggedDockBin(null);

      try {
          await apiClient.updateBin(binId, { x_grid: newX, y_grid: newY });
      } catch (err) {
          console.error(err);
      }
  };

  // Handle layout change (only in edit mode)
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (editMode === 'view') return; // Locked in view mode

      const updatedBins = newLayout
        .map((item) => {
          // Check if it's the placeholder or a real bin
          if (item.i === '__dropping-elem__') return null;

          const existingBin = currentLayer.bins.find((b) => b.bin_id === item.i);
          if (!existingBin) return null;

          // Snap to grid (strict alignment)
          const snappedX = Math.round(item.x);
          const snappedY = Math.round(item.y);
          const snappedW = Math.round(item.w);
          const snappedH = Math.round(item.h);

          // Check bounds and collision
          if (
            snappedX < 0 ||
            snappedY < 0 ||
            snappedX + snappedW > currentDrawer.width_units ||
            snappedY + snappedH > currentDrawer.depth_units ||
            isPositionOccupied(snappedX, snappedY, snappedW, snappedH, item.i)
          ) {
            return existingBin; // Revert to original
          }
          
          // Check if changed
          const hasChanged = 
            existingBin.x_grid !== snappedX ||
            existingBin.y_grid !== snappedY ||
            existingBin.width_units !== snappedW ||
            existingBin.depth_units !== snappedH;

          if (hasChanged) {
            console.log(`[AutoSave] Updating bin ${existingBin.bin_id} to (${snappedX},${snappedY})`);
            // Update Backend (Auto-save) with debounce or direct call?
            // Direct call for now, but ensure we handle errors
            apiClient.updateBin(existingBin.bin_id, {
              x_grid: snappedX,
              y_grid: snappedY,
              width_units: snappedW,
              depth_units: snappedH,
            }).catch(err => {
                console.error("Failed to auto-save bin position:", err);
                alert("Erreur de sauvegarde de la position !");
            });
          }

          return {
            ...existingBin,
            x_grid: snappedX,
            y_grid: snappedY,
            width_units: snappedW,
            depth_units: snappedH,
          };
        })
        .filter((bin): bin is Bin => bin !== null);
      
      const finalBins = currentLayer.bins.map(bin => {
           const layoutItem = newLayout.find(l => l.i === bin.bin_id);
           if (layoutItem) {
               return {
                   ...bin,
                   x_grid: Math.round(layoutItem.x),
                   y_grid: Math.round(layoutItem.y),
                   width_units: Math.round(layoutItem.w),
                   depth_units: Math.round(layoutItem.h)
               };
           }
           return bin;
      });

      const updatedLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: finalBins } : layer
      );

      setCurrentDrawer({
        ...currentDrawer,
        layers: updatedLayers,
      }, true); // Preserve layer index
    },
    [currentDrawer, currentLayerIndex, setCurrentDrawer, editMode] // Deps updated
  );

  // Add new bin (only in edit mode)
  const handleAddBin = async () => {
    // Check if we are in view mode, if so switch to edit mode
    if (editMode === 'view') {
      setEditMode('edit');
    }

    let foundPosition = false;
    let x = 0;
    let y = 0;
    
    // Find first empty spot
    // ... search logic ...
    for (let j = 0; j < currentDrawer.depth_units; j++) {
      for (let i = 0; i < currentDrawer.width_units; i++) {
        if (!isPositionOccupied(i, j, 1, 1)) {
          x = i;
          y = j;
          foundPosition = true;
          break;
        }
      }
      if (foundPosition) break;
    }

    if (!foundPosition) {
      alert('Pas de place disponible pour une nouvelle boîte (1x1)');
      return;
    }

    const tempId = uuidv4();
    // Ensure strict 1x1 size
    const newBinData = {
      x_grid: x,
      y_grid: y,
      width_units: 1, // Explicit 1
      depth_units: 1, // Explicit 1
      color: getRandomColor(),
      content: {
        title: 'Nouvelle boîte',
        description: '',
        icon: getRandomIcon(),
        items: [],
        photos: [],
      },
    };
    console.log("Creating new bin with data:", newBinData);

    // Optimistic Update
    const optimisticBin: Bin = {
      bin_id: tempId,
      ...newBinData,
    };

    // Use functional update or refetch needed?
    // Current pattern relies on component re-render for fresh state, but async function captures old state.
    // Ideally use useStore.getState()
    const latestStateBefore = useStore.getState();
    const updatedLayersOptimistic = latestStateBefore.currentDrawer?.layers.map((layer, idx) =>
      idx === currentLayerIndex
        ? { ...layer, bins: [...layer.bins, optimisticBin] }
        : layer
    ) || [];

    if (latestStateBefore.currentDrawer) {
        setCurrentDrawer({
          ...latestStateBefore.currentDrawer,
          layers: updatedLayersOptimistic,
        }, true); // Preserve layer index
    }

    try {
      // API Call
      const createdBin = await apiClient.createBin(currentLayer.layer_id, newBinData);
      
      // Get FRESH state
      const latestStateAfter = useStore.getState();
      const latestDrawer = latestStateAfter.currentDrawer;
      
      if (!latestDrawer) return;

      // Update with real ID but preserve current position/dimensions if user moved/resized it while waiting
      const updatedLayersFinal = latestDrawer.layers.map((layer, idx) => {
        if (idx !== currentLayerIndex) return layer;
        
        return {
          ...layer,
          bins: layer.bins.map(b => {
            if (b.bin_id === tempId) {
              // Merge API response with current local state (position/content might have changed)
               return {
                 ...createdBin,
                 x_grid: b.x_grid,
                 y_grid: b.y_grid,
                 width_units: b.width_units,
                 depth_units: b.depth_units,
                 content: b.content
               };
            }
            return b;
          })
        };
      });

      setCurrentDrawer({
        ...latestDrawer,
        layers: updatedLayersFinal,
      }, true); // Preserve layer index
      
      // If position/size changed locally vs initial creation, sync again
      const currentBin = updatedLayersFinal[currentLayerIndex].bins.find(b => b.bin_id === createdBin.bin_id);
      if (currentBin && (
          currentBin.x_grid !== newBinData.x_grid || 
          currentBin.y_grid !== newBinData.y_grid ||
          currentBin.width_units !== newBinData.width_units ||
          currentBin.depth_units !== newBinData.depth_units
      )) {
          apiClient.updateBin(createdBin.bin_id, {
              x_grid: currentBin.x_grid,
              y_grid: currentBin.y_grid,
              width_units: currentBin.width_units,
              depth_units: currentBin.depth_units,
          }).catch(console.error);
      }
    } catch (error) {
      console.error("Failed to create bin", error);
      // Revert optimism if failed? Or assume user will refresh.
      // Revert: remove temp bin
      const revertedApiLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex
          ? { ...layer, bins: layer.bins.filter(b => b.bin_id !== tempId) }
          : layer
      );
       setCurrentDrawer({
        ...currentDrawer,
        layers: revertedApiLayers,
      }, true); // Preserve layer index
      alert("Erreur lors de la création de la boîte");
    }
  };

  // Delete bin (only in edit mode)
  const handleDeleteBin = async (binId: string) => {
    if (editMode === 'view') return;

    // Optimistic Update
    const updatedLayers = currentDrawer.layers.map((layer, idx) =>
      idx === currentLayerIndex
        ? { ...layer, bins: layer.bins.filter((b) => b.bin_id !== binId) }
        : layer
    );

    setCurrentDrawer({
      ...currentDrawer,
      layers: updatedLayers,
    }, true); // Preserve layer index

    if (selectedBin?.bin_id === binId) {
      setSelectedBin(null);
    }
    
    try {
      await apiClient.deleteBin(binId);
    } catch (error) {
      console.error("Failed to delete bin", error);
      // Revert impossible without keeping deleted bin state somewhere or fetching drawer again.
      // Easiest is to reload drawer.
      const drawer = await apiClient.getDrawer(currentDrawer.drawer_id);
      setCurrentDrawer(drawer);
    }
  };

  // Handle bin single click
  const handleBinSingleClick = (e: React.MouseEvent, bin: Bin) => {
    e.stopPropagation();
    
    // Prevent click if dragging just finished
    if (isDraggingRef.current) {
      return;
    }

    setSelectedBin(bin);
    setSearchedBinId(null); // Clear search highlight on click
    onBinClick(bin);
  };

  // Render bin card
  const renderBin = (bin: Bin) => {
    const isSelected = selectedBin?.bin_id === bin.bin_id;
    const isSearched = searchedBinId === bin.bin_id;
    const isDimmed = searchedBinId !== null && !isSearched;
    const isHeight1 = bin.depth_units === 1;
    const is1x1 = bin.width_units === 1 && bin.depth_units === 1;

    return (
      <motion.div
        key={bin.bin_id}
        onClick={(e) => handleBinSingleClick(e, bin)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onBinDoubleClick(bin);
        }}
        className={`
          relative h-full rounded-xl overflow-hidden transition-all duration-300
          ${isSelected || isSearched ? 'ring-4 ring-blue-500 ring-opacity-70 shadow-2xl z-10' : 'shadow-lg'}
          ${editMode === 'view' ? 'cursor-pointer' : 'cursor-move'}
          ${isDimmed ? 'opacity-20 grayscale-[50%]' : 'opacity-100'}
        `}
        style={{
          backgroundColor: bin.color || '#3b82f6',
        }}
        whileHover={{ scale: editMode === 'view' && !isDimmed ? 1.02 : 1 }}
      >
        {/* Content */}
        <div className="p-2 sm:p-3 h-full flex flex-col text-white overflow-hidden relative" style={{ backgroundColor: bin.color || '#3b82f6' }}>
            {/* Icon - visible as a watermark/background element or alongside title */}
            {bin.content.icon && !is1x1 && (
               <div className="absolute top-1 right-1 opacity-20 pointer-events-none">
                 <i className={`${bin.content.icon} text-4xl`}></i>
               </div>
            )}
          <div className={`font-semibold ${isHeight1 ? 'text-xs line-clamp-1' : 'text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-1 sm:line-clamp-2'} leading-tight z-10 flex items-center gap-1`}>
             {bin.content.icon && isHeight1 && !is1x1 && <i className={`${bin.content.icon} text-lg`}></i>}
            {bin.content.title}
          </div>
          {!isHeight1 && bin.content.description && (
            <div className="text-[10px] sm:text-xs opacity-90 line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 leading-tight hidden sm:block">
              {bin.content.description}
            </div>
          )}
          {!isHeight1 && bin.content.items && bin.content.items.length > 0 && (
            <div className="text-[10px] sm:text-xs opacity-80 mt-auto truncate">
              {bin.content.items.length} item{bin.content.items.length > 1 ? 's' : ''}
            </div>
          )}
          {bin.content.photos && bin.content.photos.length > 0 && (
            <div className={`absolute ${isHeight1 ? 'top-1 right-1' : 'top-1.5 right-1.5 sm:top-2 sm:right-2'}`}>
              <svg className={`w-3 h-3 ${isHeight1 ? '' : 'sm:w-4 sm:h-4'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
          )}
        </div>

        {/* Delete button (edit mode only) */}
        {editMode === 'edit' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteBin(bin.bin_id);
              }}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity z-20 shadow-md transform hover:scale-110"
              title="Supprimer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToDock(bin.bin_id);
              }}
              className="absolute top-1 right-8 p-1 bg-yellow-500 text-white rounded-full transition-opacity z-20 shadow-md transform hover:scale-110"
              title="Déplacer vers la zone d'attente"
            >
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)] relative">
      {/* Floating Controls - Top Left */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto">
          <LayerSelector />
        </div>
      </div>

      {/* Unplaced Dock - Right Side */}
      <div className="absolute top-20 right-4 bottom-20 z-10 pointer-events-none flex flex-col items-end justify-start">
         <div className="pointer-events-auto">
            <UnplacedDock 
                unplacedBins={unplacedBins}
                onBinClick={(bin) => {
                    setSelectedBin(bin);
                    onBinClick(bin);
                }}
                onBinDoubleClick={onBinDoubleClick}
                onDragStart={setDraggedDockBin}
            />
         </div>
      </div>

      {/* Floating Controls - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-[var(--color-border)]">
        <div className="flex items-center bg-[var(--color-bg)] rounded-lg p-1">
          <button
            onClick={() => setEditMode('view')}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${editMode === 'view' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400'}
            `}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Consultation
          </button>
          <button
            onClick={() => setEditMode('edit')}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${editMode === 'edit' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-400'}
            `}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Édition
          </button>
        </div>

        {editMode === 'edit' && (
          <button
            onClick={handleAddBin}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-md flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Boîte
          </button>
        )}
      </div>

      {/* Floating Stats - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="bg-[var(--color-bg-secondary)]/80 backdrop-blur-md p-2 rounded-lg shadow-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-all"
          title="Recentrer la vue"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-[var(--color-border)]">
            <span className="font-medium">{currentLayer.bins.length} boîte{currentLayer.bins.length > 1 ? 's' : ''}</span>
            <span>Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Grid Canvas with Pan & Zoom */}
      <div 
        className="flex-1 relative bg-gray-100 dark:bg-gray-900" 
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        onClick={() => {
          setSelectedBin(null);
          setSearchedBinId(null);
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <TransformWrapper
            ref={transformWrapperRef}
            initialScale={1.2}
            minScale={0.3}
            maxScale={3}
            centerOnInit={true}
            centerZoomedOut={true}
            limitToBounds={false}
            alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            panning={{
              disabled: editMode === 'edit', // Only pan in view mode
              velocityDisabled: false,
            }}
            onTransformed={(ref) => {
              setScale(ref.state.scale);
            }}
          >
            {() => (
              <>
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full !flex !items-center !justify-center"
                >
                  <div 
                    className="relative bg-white dark:bg-gray-800 shadow-2xl rounded-xl overflow-hidden" 
                    style={{ 
                      width: GRID_WIDTH, 
                      height: GRID_HEIGHT,
                      minWidth: GRID_WIDTH,
                      minHeight: GRID_HEIGHT,
                      maxWidth: GRID_WIDTH,
                      maxHeight: GRID_HEIGHT
                    }}
                  >
              {/* Background Grid Lines */}
              <div className="absolute inset-0 pointer-events-none">
                <svg width={GRID_WIDTH} height={GRID_HEIGHT} className="absolute inset-0">
                  <defs>
                    <pattern
                      id="grid-pattern"
                      width={BASE_CELL_SIZE}
                      height={BASE_CELL_SIZE}
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width={BASE_CELL_SIZE} height={BASE_CELL_SIZE} fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-700" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
              </div>

              {/* React Grid Layout */}
              <GridLayout
                key={currentLayer.layer_id} // Force remount on layer change to ensure drag handlers are attached correctly
                className="layout"
                layout={layout}
                onLayoutChange={handleLayoutChange}
                onDragStart={() => {
                  isDraggingRef.current = true;
                }}
                onDragStop={() => {
                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 100);
                }}
                cols={currentDrawer.width_units}
                rowHeight={BASE_CELL_SIZE}
                width={GRID_WIDTH}
                maxRows={currentDrawer.depth_units}
                compactType={null}
                preventCollision={true}
                isDraggable={editMode === 'edit'}
                isResizable={editMode === 'edit'}
                isDroppable={editMode === 'edit'}
                onDrop={handleDrop}
                droppingItem={draggedDockBin ? { 
                    i: draggedDockBin.bin_id, 
                    w: draggedDockBin.width_units, 
                    h: draggedDockBin.depth_units 
                } : undefined}
                margin={[0, 0]}
                containerPadding={[0, 0]}
                useCSSTransforms={true}
                style={{ 
                  width: GRID_WIDTH, 
                  height: GRID_HEIGHT, 
                  minWidth: GRID_WIDTH, 
                  minHeight: GRID_HEIGHT,
                  maxWidth: GRID_WIDTH,
                  maxHeight: GRID_HEIGHT
                }}
              >
                {placedBins.map((bin) => (
                  <div key={bin.bin_id}>
                    {renderBin(bin)}
                  </div>
                ))}
              </GridLayout>
            </div>
          </TransformComponent>
              </>
            )}
        </TransformWrapper>
        </div>
      </div>
    </div>
  );
}
