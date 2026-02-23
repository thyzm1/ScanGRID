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
import { IconDisplay } from './IconDisplay';
import type { Bin } from '../types/api';

import { apiClient } from '../services/api';

const PASTEL_COLORS = [
  '#F87171', '#FBBF24', '#34D399', '#60A5FA', '#818CF8', '#A78BFA', '#F472B6', '#FB923C', '#A3E635', '#2DD4BF', '#F43F5E',
];
const AVAILABLE_ICONS = [
  'home', 'search', 'settings', 'favorite', 'star', 'check_circle', 'add', 'delete', 'edit', 'close',
  'menu', 'arrow_back', 'arrow_forward', 'folder', 'description', 'group', 'person', 'lock', 'visibility',
  'build', 'hardware', 'construction', 'inventory_2', 'category', 'palette', 'light_mode', 'dark_mode',
  'qr_code', 'print', 'share', 'save', 'download', 'upload', 'extension', 'grid_view', 'list'
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
    filterText,
    selectedCategoryId
  } = useStore();

  const [scale, setScale] = useState(1);
  const transformWrapperRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const [draggedDockBin, setDraggedDockBin] = useState<Bin | null>(null);
  const [viewFormat, setViewFormat] = useState<'grid' | 'list'>('grid'); // New state for list view

  // --- New Feature States ---
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>([]); // Multi-select
  
  // Undo/Redo History (simple stack for current layer bins)
  const [history, setHistory] = useState<Bin[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Prevent native browser pinch-to-zoom on the grid container
  useEffect(() => {
    const preventPinchZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    
    const container = document.getElementById('grid-editor-container');
    if (container) {
      container.addEventListener('wheel', preventPinchZoom, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', preventPinchZoom);
      }
    };
  }, []);
  
  // Clipboard (use localStorage for persistence across reloads/layer switches)
  const copyToClipboard = (bin: Bin) => {
    localStorage.setItem('scangrid_clipboard', JSON.stringify(bin));
    alert('Boîte copiée !'); // Simple feedback
  };

  const pasteFromClipboard = async () => {
    if (!currentDrawer) return;
    const data = localStorage.getItem('scangrid_clipboard');
    if (!data) return;
    try {
      const templateBin = JSON.parse(data) as Bin;
      // Remove ID and position to create new
      const { bin_id, x_grid, y_grid, ...rest } = templateBin;
      
      // Find position
      let foundPosition = false;
      let x = 0;
      let y = 0;
      for (let j = 0; j < currentDrawer.depth_units; j++) {
        for (let i = 0; i < currentDrawer.width_units; i++) {
          if (!isPositionOccupied(i, j, rest.width_units, rest.depth_units)) {
            x = i;
            y = j;
            foundPosition = true;
            break;
          }
        }
        if (foundPosition) break;
      }

      if (!foundPosition) {
        alert('Pas de place disponible pour coller cette boîte');
        return;
      }

      const newBinData = {
        ...rest,
        x_grid: x,
        y_grid: y,
      };
      
      await createNewBin(newBinData);
    } catch (e) {
      console.error("Paste failed", e);
    }
  };

  // History Management
  const addToHistory = (bins: Bin[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(bins);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const handleUndo = async () => {
    if (!currentDrawer || historyIndex <= 0) return;
    const prevBins = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1);
    
    const updatedLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: prevBins } : layer
    );
    setCurrentDrawer({ ...currentDrawer, layers: updatedLayers }, true);
  };

  const handleRedo = () => {
    if (!currentDrawer || historyIndex >= history.length - 1) return;
    const nextBins = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1);
    
    const updatedLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: nextBins } : layer
    );
    setCurrentDrawer({ ...currentDrawer, layers: updatedLayers }, true);
  };
  
  // Sync history on layer change or initial load
  useEffect(() => {
    if (currentDrawer?.layers[currentLayerIndex]) {
        // Only add if different from last history
        const currentBins = currentDrawer.layers[currentLayerIndex].bins;
        if (history.length === 0 || JSON.stringify(history[historyIndex]) !== JSON.stringify(currentBins)) {
             // Initial load or external change
             if (history.length === 0) {
                 setHistory([currentBins]);
                 setHistoryIndex(0);
             }
        }
    }
  }, [currentDrawer?.layers[currentLayerIndex], currentLayerIndex]);
  
  // Helper to create bin (shared logic)
  const createNewBin = async (binData: any) => {
      if (!currentDrawer) return;

      const tempId = uuidv4();
      const optimisticBin: Bin = { bin_id: tempId, ...binData };
      
      const latestStateBefore = useStore.getState();
      const currentBins = latestStateBefore.currentDrawer?.layers[currentLayerIndex].bins || [];
      addToHistory([...currentBins, optimisticBin]);

      const updatedLayers = latestStateBefore.currentDrawer?.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: [...layer.bins, optimisticBin] } : layer
      ) || [];
      
      if (latestStateBefore.currentDrawer) {
        setCurrentDrawer({ ...latestStateBefore.currentDrawer, layers: updatedLayers }, true);
      }

      try {
        const createdBin = await apiClient.createBin(currentDrawer.layers[currentLayerIndex].layer_id, binData);
        // Update with real ID ... (similar to handleAddBin)
        const stateAfter = useStore.getState();
         const finalLayers = stateAfter.currentDrawer?.layers.map((layer, idx) => {
            if (idx !== currentLayerIndex) return layer;
            return {
                ...layer,
                bins: layer.bins.map(b => b.bin_id === tempId ? { ...createdBin, ...b, bin_id: createdBin.bin_id } : b)
            };
         });
         if(stateAfter.currentDrawer && finalLayers) {
             setCurrentDrawer({ ...stateAfter.currentDrawer, layers: finalLayers }, true);
         }
      } catch (e) {
          console.error(e);
          alert("Erreur creation");
      }
  };
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (editMode !== 'edit') return;
        
        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedBinIds.length > 0) {
                if (confirm(`Supprimer ${selectedBinIds.length} boîte(s) ?`)) {
                    selectedBinIds.forEach(id => handleDeleteBin(id));
                    setSelectedBinIds([]);
                    setSelectedBin(null);
                }
            } else if (selectedBin) {
                if (confirm('Supprimer cette boîte ?')) {
                    handleDeleteBin(selectedBin.bin_id);
                }
            }
        }
        
        // Toggle specific bin selection with arrows is hard in grid, skipping for now.
        
        // Copy/Paste
        if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
            if (selectedBin) {
                copyToClipboard(selectedBin);
                e.preventDefault();
            }
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
            pasteFromClipboard();
            e.preventDefault();
        }
        
        // Undo/Redo
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            if (e.shiftKey) handleRedo();
            else handleUndo();
            e.preventDefault();
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, selectedBin, selectedBinIds, historyIndex, history]); // Dependencies

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
  
  const visibleBins = currentLayer.bins.filter(b => {
      // Category Filter
      if (selectedCategoryId && b.category_id !== selectedCategoryId) return false;
      
      // Text Filter
      if (filterText) {
          const lower = filterText.toLowerCase();
          const matchLabel = b.content.title?.toLowerCase().includes(lower);
          const matchDesc = b.content.description?.toLowerCase().includes(lower);
          const matchContent = b.content.items?.some(item => {
             const val = typeof item === 'string' ? item : (item as any).name || '';
             return val.toLowerCase().includes(lower);
          });
          
          if (!matchLabel && !matchDesc && !matchContent) return false;
      }
      return true;
  });
  
  const placedBins = visibleBins.filter(b => b.x_grid >= 0 && b.y_grid >= 0);
  const unplacedBins = visibleBins.filter(b => b.x_grid < 0 || b.y_grid < 0);

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

      // Process layout changes and trigger updates
      newLayout.forEach((item) => {
          if (item.i === '__dropping-elem__') return;

          const existingBin = currentLayer.bins.find((b) => b.bin_id === item.i);
          if (!existingBin) return;

          // Snap to grid
          const snappedX = Math.round(item.x);
          const snappedY = Math.round(item.y);
          const snappedW = Math.round(item.w);
          const snappedH = Math.round(item.h);
          
          // Check if changed
          const hasChanged = 
            existingBin.x_grid !== snappedX ||
            existingBin.y_grid !== snappedY ||
            existingBin.width_units !== snappedW ||
            existingBin.depth_units !== snappedH;

          if (hasChanged) {
            // Check bounds and collision before saving
            if (
                snappedX < 0 ||
                snappedY < 0 ||
                snappedX + snappedW > currentDrawer.width_units ||
                snappedY + snappedH > currentDrawer.depth_units ||
                isPositionOccupied(snappedX, snappedY, snappedW, snappedH, item.i)
            ) {
                // If invalid, we don't save. Ideally we should revert the UI state too,
                // but since finalBins below uses newLayout, the UI will update to the invalid state temporarily.
                // However, RGL usually prevents dropping on occupied spots if preventCollision is true.
                console.warn("Invalid position detected, skipping save");
                return;
            }

            console.log(`[AutoSave] Updating bin ${existingBin.bin_id} to (${snappedX},${snappedY})`);
            apiClient.updateBin(existingBin.bin_id, {
              x_grid: snappedX,
              y_grid: snappedY,
              width_units: snappedW,
              depth_units: snappedH,
            }).catch(err => {
                console.error("Failed to auto-save bin position:", err);
            });
          }
      });
      
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

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
        // Multi-select toggle
        const isSelected = selectedBinIds.includes(bin.bin_id);
        let newIds;
        if (isSelected) {
            newIds = selectedBinIds.filter(id => id !== bin.bin_id);
        } else {
            newIds = [...selectedBinIds, bin.bin_id];
        }
        setSelectedBinIds(newIds);
        
        // Update primary selection to the most recent one (or null)
        if (newIds.length > 0) {
            const lastId = newIds[newIds.length - 1];
            const lastBin = currentLayer.bins.find(b => b.bin_id === lastId);
            setSelectedBin(lastBin || null);
        } else {
            setSelectedBin(null);
        }
    } else {
        // Single select
        setSelectedBin(bin);
        setSelectedBinIds([bin.bin_id]);
        setSearchedBinId(null); // Clear search highlight on click
        onBinClick(bin);
    }
  };

  // Render bin card
  const renderBin = (bin: Bin) => {
    // Check if bin is selected either as primary or in multi-select list
    const isSelected = selectedBin?.bin_id === bin.bin_id || selectedBinIds.includes(bin.bin_id);
    const isSearched = searchedBinId === bin.bin_id;
    const isDimmed = searchedBinId !== null && !isSearched;
    const isHeight1 = bin.depth_units === 1;
    const is1x1 = bin.width_units === 1 && bin.depth_units === 1;
    const isEditing = useStore.getState().selectedBin?.bin_id === bin.bin_id && editMode === 'view';

    return (
      <motion.div
        key={bin.bin_id}
        onClick={(e) => !isEditing && handleBinSingleClick(e, bin)}
        onDoubleClick={(e) => {
          if (!isEditing) {
            e.stopPropagation();
            onBinDoubleClick(bin);
          }
        }}
        className={`
          relative h-full rounded-2xl overflow-hidden transition-all duration-300
          ${isSelected || isSearched ? 'ring-4 ring-blue-500 ring-opacity-70 shadow-2xl z-10' : 'shadow-lg'}
          ${editMode === 'view' && !isEditing ? 'cursor-pointer' : editMode === 'edit' ? 'cursor-move' : 'cursor-default'}
          ${isDimmed ? 'opacity-20 grayscale-[50%]' : 'opacity-100'}
          ${isEditing ? 'pointer-events-none' : ''}
          border border-white/10
        `}
        style={{
          backgroundColor: bin.color || '#3b82f6',
        }}
        whileHover={{ scale: editMode === 'view' && !isDimmed ? 1.02 : 1 }}
      >
        {/* Render bin card */}
        <div className={`
            p-2 sm:p-3 h-full flex flex-col text-white overflow-hidden relative
            
        `} style={{ backgroundColor: bin.color || '#3b82f6' }}>
            {/* Icon - visible as a watermark/background element or alongside title */}
            {bin.content.icon && !is1x1 && (
               <div className={`absolute top-1 right-1 opacity-20 pointer-events-none text-4xl`}>
                 <IconDisplay icon={bin.content.icon} />
               </div>
            )}
          <div className={`font-semibold ${isHeight1 ? 'text-xs line-clamp-1' : 'text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-1 sm:line-clamp-2'} leading-tight z-10 flex items-center gap-1`}>
             {bin.content.icon && isHeight1 && !is1x1 && <IconDisplay icon={bin.content.icon} className="text-lg" />}
            {bin.content.title}
          </div>
          {!isHeight1 && bin.content.description && (
            <div className="text-[10px] sm:text-xs opacity-90 line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 leading-tight hidden sm:block">
              {bin.content.description}
            </div>
          )}

        {/* isHeight1 && bin.content.items && bin.content.items.length > 0 && (
            <div className="text-[10px] sm:text-xs opacity-80 mt-auto truncate mb-6">
              {bin.content.items.length} item{bin.content.items.length > 1 ? 's' : ''}
            </div>
          )*/}
        
        {/*
          {bin.content.photos && bin.content.photos.length > 0 && (
            <div className={`absolute ${isHeight1 ? 'top-1 right-8' : 'top-1.5 right-8 sm:top-2 sm:right-8'}`}>
              <svg className={`w-3 h-3 ${isHeight1 ? '' : 'sm:w-4 sm:h-4'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
          )}
        */}
        
        {/* Edit Controls */}
        {editMode === 'edit' && (
          <>
            {/* Delete - Top Right */}
            <div className="absolute top-0 right-0 p-1 z-50">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer cette boîte ?')) {
                        handleDeleteBin(bin.bin_id);
                    }
                  }}
                  className="cancel-drag p-1 bg-red-500 text-white rounded-bl-lg rounded-tr-sm shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                  title="Supprimer (Del)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            {/* Copy & Dock - Bottom Left */}
            <div className="absolute bottom-0 left-0 flex gap-1 p-1 z-50">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(bin);
                  }}
                  className="cancel-drag p-1 bg-blue-500 text-white rounded-full transition-opacity shadow-md transform hover:scale-110 cursor-pointer"
                  title="Copier (Ctrl+C)"
                >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToDock(bin.bin_id);
                  }}
                  className="cancel-drag p-1 bg-yellow-500 text-white rounded-full transition-opacity shadow-md transform hover:scale-110 cursor-pointer"
                  title="Déplacer vers la zone d'attente"
                >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
            </div>
          </>
        )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)] relative">
      {/* Floating Controls - Top Center (Mobile) / Top Right (Desktop) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-20 flex flex-col items-center sm:items-end gap-2 pointer-events-none w-max">
        <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-[var(--color-border)] pointer-events-auto transition-all">
        
        {/* Undo/Redo */}
        <div className="flex items-center bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)]">
             <button 
                onClick={handleUndo} 
                disabled={historyIndex <= 0}
                className="p-1.5 text-gray-500 hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Annuler (Ctrl+Z)"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
             </button>
             <button 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-gray-500 hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Rétablir (Ctrl+Shift+Z)"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
             </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        {/* View Options */}
        <div className="flex items-center bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)]">
            <button
                onClick={() => setViewFormat('grid')}
                className={`p-1.5 rounded-md transition-all ${viewFormat === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Vue Grille"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            </button>
            <button
                onClick={() => setViewFormat('list')}
                className={`p-1.5 rounded-md transition-all ${viewFormat === 'list' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title="Vue Liste"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

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

      </div>

      {/* Floating Action Buttons (Secondary Row) */}
      <div className="flex gap-2 pointer-events-auto">
        {editMode === 'edit' && (
          <>
          <button
            onClick={handleAddBin}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-md flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Boîte
          </button>
          
          {selectedBin && (
             <>
             <button
                onClick={() => {
                    // Duplicate logic: copy current bin to clipboard and trigger paste immediately
                    localStorage.setItem('scangrid_clipboard', JSON.stringify(selectedBin));
                    pasteFromClipboard();
                }}
                className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-md flex items-center gap-1"
                title="Dupliquer (Ctrl+D)"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Dupliquer
             </button>

             <button
                onClick={() => copyToClipboard(selectedBin)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-md flex items-center gap-1"
                title="Copier (Ctrl+C)"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copier
             </button>
             </>
          )}

           <button
             onClick={pasteFromClipboard}
             className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-md flex items-center gap-1"
             title="Coller une boîte (Ctrl+V)"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Coller
           </button>
          </>
        )}
      </div>
      </div>

      {/* Floating Controls - Layer Selector (Below Top Menu on Mobile, Top Left on Desktop) */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 sm:top-4 sm:left-4 sm:translate-x-0 z-20 flex flex-col gap-2 pointer-events-none w-max">
        <div className="pointer-events-auto">
          <LayerSelector />
        </div>
      </div>

      {/* Unplaced Dock - Right Side */}
      <div className="absolute top-36 sm:top-20 right-4 bottom-20 z-10 pointer-events-none flex flex-col items-end justify-start">
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
        {viewFormat === 'list' ? (
           <div className="w-full h-full overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
             <div className="max-w-5xl mx-auto">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Liste des Boîtes - {currentLayer.layer_id}</h2>
                 <span className="text-sm text-gray-500">{placedBins.length} éléments</span>
               </div>
               
               <div className="grid gap-4">
                 {placedBins.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune boîte dans cette couche.</p>
                        <p className="text-sm text-gray-400 mt-2">Basculez en mode Grille pour ajouter des éléments.</p>
                    </div>
                 ) : (
                    placedBins.map((bin) => (
                      <div 
                        key={bin.bin_id}
                        className={`
                          group relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 
                          hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer
                          ${selectedBin?.bin_id === bin.bin_id ? 'ring-2 ring-indigo-500 border-transparent' : ''}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBin(bin);
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon / Color */}
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-inner shrink-0"
                            style={{ backgroundColor: bin.color || '#e2e8f0' }}
                          >
                            <span>{bin.content?.icon || '📦'}</span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {bin.content?.title || 'Sans titre'}
                                </h3>
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {bin.width_units}x{bin.depth_units} • ({bin.x_grid}, {bin.y_grid})
                                </span>
                             </div>
                             
                             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                               {bin.content?.description || 'Aucune description'}
                             </p>
                             
                             {/* Tags / Items preview */}
                             {(bin.content?.items && bin.content.items.length > 0) && (
                               <div className="mt-3 flex flex-wrap gap-2">
                                  {bin.content.items.slice(0, 3).map((item: any, idx: number) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                      {item.name || item}
                                    </span>
                                  ))}
                                  {bin.content.items.length > 3 && (
                                    <span className="text-xs text-gray-400 flex items-center">+{bin.content.items.length - 3} autres</span>
                                  )}
                               </div>
                             )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Supprimer cette boîte ?')) {
                                    handleDeleteBin(bin.bin_id);
                                  }
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Supprimer"
                             >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                             <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBin(bin);
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Modifier"
                             >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </button>
                          </div>
                        </div>
                      </div>
                    ))
                 )}
               </div>
             </div>
           </div>
        ) : (
        <div id="grid-editor-container" style={{ width: '100%', height: '100%', touchAction: 'none' }}>
          <TransformWrapper
            ref={transformWrapperRef}
            initialScale={window.innerWidth < 768 ? (window.innerWidth - 32) / GRID_WIDTH : 1.2}
            minScale={0.1}
            maxScale={3}
            centerOnInit={true}
            centerZoomedOut={true}
            limitToBounds={false}
            alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
            wheel={{ step: 0.1, disabled: false }}
            pinch={{ step: 5 }}
            panning={{
              disabled: false,
              excluded: editMode === 'edit' ? ['layout', 'react-grid-item', 'react-resizable-handle'] : [],
              velocityDisabled: false,
              wheelPanning: true,
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
                draggableCancel=".cancel-drag"
                resizeHandles={['se']}
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
                margin={[6, 6]}
                containerPadding={[12, 12]}
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
        )}
      </div>
    </div>
  );
}
