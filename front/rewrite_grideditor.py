import re

file_path = "/Users/mathisdupont/ScanGRID/front/src/components/GridEditor3.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add subLayerOffset to state
content = re.sub(
    r"const \[draggedDockBin, setDraggedDockBin\] = useState<Bin \| null>\(null\);",
    "const [draggedDockBin, setDraggedDockBin] = useState<Bin | null>(null);\n  const [subLayerOffset, setSubLayerOffset] = useState<number>(0);",
    content
)

# 2. Modify visibleBinsOnCurrentLayer
old_visible_bins_logic = """  const visibleBinsOnCurrentLayer: VisiblePlacedBin[] = currentDrawer.layers.flatMap((layer, layerIdx) =>
    layer.bins
      .filter((bin) => {
        if (!doesBinMatchFilters(bin)) return false;
        const binHeight = Math.max(1, bin.height_units || 1);
        return currentLayerIndex >= layerIdx && currentLayerIndex <= layerIdx + binHeight - 1;
      })
      .map((bin) => ({
        bin,
        layerIndex: layerIdx,
        isFromCurrentLayer: layerIdx === currentLayerIndex,
      }))
  );"""

new_visible_bins_logic = """  const visibleBinsOnCurrentLayer: VisiblePlacedBin[] = currentDrawer.layers.flatMap((layer, layerIdx) =>
    layer.bins
      .filter((bin) => {
        if (!doesBinMatchFilters(bin)) return false;
        
        const binHeight = Math.max(0.5, bin.height_units || 1);
        const zOffset = bin.z_offset || 0;
        
        const currentViewZ = currentLayerIndex + subLayerOffset;
        const binStartZ = layerIdx + zOffset;
        const binEndZ = binStartZ + binHeight;
        
        // Un bin est visible si la vue actuelle (de hauteur 0.5) est à l'intérieur de son étendue
        // et qu'il n'est pas bloqué uniquement par des questions de transparence
        return currentViewZ >= binStartZ && currentViewZ < binEndZ;
      })
      .map((bin) => {
          // On marque 'isFromCurrentLayer' en fonction du zOffset exact
          // Un bin appartient à la (sous-)couche si layerIdx == currentLayer && zOffset == subLayerOffset
          const isFromCurrentLayer = layerIdx === currentLayerIndex && (bin.z_offset || 0) === subLayerOffset;
          return {
            bin,
            layerIndex: layerIdx,
            isFromCurrentLayer,
          };
      })
  );"""
content = content.replace(old_visible_bins_logic, new_visible_bins_logic)


# 3. Modify validatePlacement3D
old_validate_func_sig = """  const validatePlacement3D = (
    x: number,
    y: number,
    w: number,
    d: number,
    heightUnits: number,
    excludeBinId?: string
  ): { valid: boolean; reason?: string } => {"""

new_validate_func_sig = """  const validatePlacement3D = (
    x: number,
    y: number,
    w: number,
    d: number,
    heightUnits: number,
    zOffset: number = 0,
    excludeBinId?: string
  ): { valid: boolean; reason?: string } => {"""
content = content.replace(old_validate_func_sig, new_validate_func_sig)


old_validate_target = """    const targetHeight = Math.max(1, heightUnits || 1);
    const targetLayerStart = currentLayerIndex;
    const targetLayerEnd = targetLayerStart + targetHeight - 1;"""

new_validate_target = """    const targetHeight = Math.max(0.5, heightUnits || 1);
    const targetLayerStart = currentLayerIndex + zOffset;
    const targetLayerEnd = targetLayerStart + targetHeight;"""
content = content.replace(old_validate_target, new_validate_target)


old_validate_overlap = """    for (const { bin: otherBin, layerIndex: otherLayerStart } of placedBinsAllLayers) {
      if (otherBin.bin_id === excludeBinId) continue;

      const otherHeight = Math.max(1, otherBin.height_units || 1);
      const otherLayerEnd = otherLayerStart + otherHeight - 1;

      if (!overlapsRange(targetLayerStart, targetLayerEnd, otherLayerStart, otherLayerEnd)) continue;
      if (!overlaps2D(x, y, w, d, otherBin.x_grid, otherBin.y_grid, otherBin.width_units, otherBin.depth_units)) continue;"""

new_validate_overlap = """    for (const { bin: otherBin, layerIndex: otherLayerStart } of placedBinsAllLayers) {
      if (otherBin.bin_id === excludeBinId) continue;

      const otherHeight = Math.max(0.5, otherBin.height_units || 1);
      const otherLayerStartAbsolute = otherLayerStart + (otherBin.z_offset || 0);
      const otherLayerEndAbsolute = otherLayerStartAbsolute + otherHeight;

      const overlapsZ = targetLayerStart < otherLayerEndAbsolute && targetLayerEnd > otherLayerStartAbsolute;
      if (!overlapsZ) continue;
      
      if (!overlaps2D(x, y, w, d, otherBin.x_grid, otherBin.y_grid, otherBin.width_units, otherBin.depth_units)) continue;"""
content = content.replace(old_validate_overlap, new_validate_overlap)


old_validate_support = """    if (targetLayerStart > 0) {
      const layerBelowTop = targetLayerStart - 1;
      const hasTopCoverage = Array.from({ length: currentDrawer.width_units }, () =>
        Array.from({ length: currentDrawer.depth_units }, () => false)
      );
      const hasSupport = Array.from({ length: currentDrawer.width_units }, () =>
        Array.from({ length: currentDrawer.depth_units }, () => false)
      );

      for (const { bin: belowBin, layerIndex: belowLayerStart } of placedBinsAllLayers) {
        if (belowBin.bin_id === excludeBinId) continue;

        const belowTop = belowLayerStart + Math.max(1, belowBin.height_units || 1) - 1;
        if (belowTop !== layerBelowTop) continue;"""

new_validate_support = """    if (targetLayerStart > 0) {
      const layerBelowEnd = targetLayerStart;
      const hasTopCoverage = Array.from({ length: currentDrawer.width_units }, () =>
        Array.from({ length: currentDrawer.depth_units }, () => false)
      );
      const hasSupport = Array.from({ length: currentDrawer.width_units }, () =>
        Array.from({ length: currentDrawer.depth_units }, () => false)
      );

      for (const { bin: belowBin, layerIndex: belowLayerStart } of placedBinsAllLayers) {
        if (belowBin.bin_id === excludeBinId) continue;

        const belowTop = belowLayerStart + (belowBin.z_offset || 0) + Math.max(0.5, belowBin.height_units || 1);
        if (belowTop !== layerBelowEnd) continue;"""

content = content.replace(old_validate_support, new_validate_support)


# Fix the other calls to validatePlacement3D inside the file 
content = re.sub(
    r"validatePlacement3D\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*Math\.max\(1, (rest\.height_units.*?) \|\| 1\)\)",
    r"validatePlacement3D(\1, \2, \3, \4, \5 || 1, rest.z_offset || 0)",
    content
)

content = re.sub(
    r"validatePlacement3D\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*Math\.max\(1, (binData\.height_units.*?) \|\| 1\)\)",
    r"validatePlacement3D(\1, \2, \3, \4, \5 || 1, binData.z_offset || 0)",
    content
)

content = re.sub(
    r"validatePlacement3D\(\s*newX,\s*newY,\s*bin\.width_units,\s*bin\.depth_units,\s*Math\.max\(1, bin\.height_units \|\| 1\),\s*binId\s*\)",
    r"validatePlacement3D(newX, newY, bin.width_units, bin.depth_units, bin.height_units || 1, bin.z_offset || 0, binId)",
    content
)

content = content.replace("validatePlacement3D(i, j, 1, 1, 1)", "validatePlacement3D(i, j, 1, 1, 1, subLayerOffset)")

# 4. Replace handleLayoutChange with handleItemChange

old_handle_layout_change = """  // Handle layout change (only in edit mode)
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (editMode === 'view') return; // Locked in view mode

      const sanitizedById = new Map<string, { x: number; y: number; w: number; h: number }>();

      newLayout.forEach((item) => {
        if (item.i === '__dropping-elem__') return;

        const existingBin = currentLayer.bins.find((b) => b.bin_id === item.i);
        if (!existingBin) return;

        const snappedX = Math.round(item.x);
        const snappedY = Math.round(item.y);
        const snappedW = Math.round(item.w);
        const snappedH = Math.round(item.h);

        const placementCheck = validatePlacement3D(
          snappedX,
          snappedY,
          snappedW,
          snappedH,
          Math.max(1, existingBin.height_units || 1),
          item.i
        );

        if (!placementCheck.valid) {
          sanitizedById.set(item.i, {
            x: existingBin.x_grid,
            y: existingBin.y_grid,
            w: existingBin.width_units,
            h: existingBin.depth_units,
          });
          return;
        }

        sanitizedById.set(item.i, { x: snappedX, y: snappedY, w: snappedW, h: snappedH });

        const hasChanged =
          existingBin.x_grid !== snappedX ||
          existingBin.y_grid !== snappedY ||
          existingBin.width_units !== snappedW ||
          existingBin.depth_units !== snappedH;

        if (hasChanged) {
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
        const sanitized = sanitizedById.get(bin.bin_id);
        if (!sanitized) return bin;

        return {
          ...bin,
          x_grid: sanitized.x,
          y_grid: sanitized.y,
          width_units: sanitized.w,
          depth_units: sanitized.h
        };
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
  );"""

new_handle_layout_change = """  // Specific item change applied after drag/resize finishes
  const handleItemChange = useCallback((item: Layout) => {
    if (editMode === 'view') return;

    const existingBin = currentLayer.bins.find((b) => b.bin_id === item.i);
    if (!existingBin) return;

    const snappedX = Math.max(0, Math.round(item.x));
    const snappedY = Math.max(0, Math.round(item.y));
    const snappedW = Math.max(1, Math.round(item.w));
    const snappedH = Math.max(1, Math.round(item.h));

    const placementCheck = validatePlacement3D(
      snappedX,
      snappedY,
      snappedW,
      snappedH,
      Math.max(0.5, existingBin.height_units || 1),
      existingBin.z_offset || 0,
      item.i
    );

    if (!placementCheck.valid) {
      alert(placementCheck.reason || 'Placement impossible');
      // Forcer un re-render pour nettoyer l'état de Grid Layout
      setCurrentDrawer({ ...currentDrawer }, true);
      return;
    }

    const hasChanged =
      existingBin.x_grid !== snappedX ||
      existingBin.y_grid !== snappedY ||
      existingBin.width_units !== snappedW ||
      existingBin.depth_units !== snappedH;

    if (hasChanged) {
      const updatedBins = currentLayer.bins.map(b => 
        b.bin_id === existingBin.bin_id ? { ...b, x_grid: snappedX, y_grid: snappedY, width_units: snappedW, depth_units: snappedH } : b
      );

      const updatedLayers = currentDrawer.layers.map((layer, idx) =>
        idx === currentLayerIndex ? { ...layer, bins: updatedBins } : layer
      );

      setCurrentDrawer({ ...currentDrawer, layers: updatedLayers }, true);

      apiClient.updateBin(existingBin.bin_id, {
        x_grid: snappedX,
        y_grid: snappedY,
        width_units: snappedW,
        depth_units: snappedH,
      }).catch(console.error);
    }
  }, [currentDrawer, currentLayerIndex, setCurrentDrawer, editMode]);"""
content = content.replace(old_handle_layout_change, new_handle_layout_change)


# 5. Fix Layout config
old_grid_layout = """              <GridLayout
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
                resizeHandles={['se']}"""

new_grid_layout = """              <GridLayout
                key={`${currentLayer.layer_id}-${subLayerOffset}`} // Force remount on full layer or sublayer change
                className="layout"
                layout={layout}
                onDragStart={() => {
                  isDraggingRef.current = true;
                }}
                onDragStop={(_, oldItem, newItem) => {
                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 100);
                  handleItemChange(newItem);
                }}
                onResizeStop={(_, oldItem, newItem) => {
                  handleItemChange(newItem);
                }}
                draggableCancel=".cancel-drag"
                resizeHandles={['se']}"""
content = content.replace(old_grid_layout, new_grid_layout)

# 6. Make new bins default to subLayerOffset
content = content.replace(
"""    const newBinData = {
      x_grid: x,
      y_grid: y,
      width_units: 1, // Explicit 1
      depth_units: 1, // Explicit 1
      height_units: 1, // Default height""",
"""    const newBinData = {
      x_grid: x,
      y_grid: y,
      width_units: 1,
      depth_units: 1,
      height_units: 1,
      z_offset: subLayerOffset,"""
)


# 7. Add segmented control for subLayerOffset
old_layer_selector_render = """      {/* Floating Controls - Layer Selector (Below Top Menu on Mobile, Top Left on Desktop) */}
      <div className={`absolute ${editMode === 'edit' ? 'top-[6.2rem]' : 'top-[4.8rem]'} left-1/2 -translate-x-1/2 min-[1024px]:top-4 min-[1024px]:left-4 min-[1024px]:translate-x-0 z-20 flex flex-col gap-2 max-[430px]:gap-1.5 pointer-events-none w-[calc(100%-0.75rem)] max-w-[calc(100%-0.75rem)] min-[431px]:w-[calc(100%-1rem)] min-[431px]:max-w-[calc(100%-1rem)] min-[1024px]:w-auto min-[1024px]:max-w-none`}>
        <div className="pointer-events-auto">
          <LayerSelector />
        </div>
      </div>"""

new_layer_selector_render = """      {/* Floating Controls - Layer Selector (Below Top Menu on Mobile, Top Left on Desktop) */}
      <div className={`absolute ${editMode === 'edit' ? 'top-[6.2rem]' : 'top-[4.8rem]'} left-1/2 -translate-x-1/2 min-[1024px]:top-4 min-[1024px]:left-4 min-[1024px]:translate-x-0 z-20 flex flex-col gap-2 max-[430px]:gap-1.5 pointer-events-none w-[calc(100%-0.75rem)] max-w-[calc(100%-0.75rem)] min-[431px]:w-[calc(100%-1rem)] min-[431px]:max-w-[calc(100%-1rem)] min-[1024px]:w-auto min-[1024px]:max-w-none`}>
        <div className="pointer-events-auto flex items-center gap-2">
          <LayerSelector />
          <div className="flex items-center bg-[var(--color-bg-secondary)]/80 backdrop-blur-md rounded-xl shadow-lg border border-[var(--color-border)] h-10 px-1">
             <button
                onClick={() => setSubLayerOffset(0.0)}
                className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${subLayerOffset === 0.0 ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
             >
                Base 0.0
             </button>
             <button
                onClick={() => setSubLayerOffset(0.5)}
                className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${subLayerOffset === 0.5 ? 'bg-indigo-500 text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
             >
                Base 0.5
             </button>
          </div>
        </div>
      </div>"""
content = content.replace(old_layer_selector_render, new_layer_selector_render)


# Add transparency / blocked rendering for items not exactly in current sublayer
old_render_card = """        <div className={`
            p-2 sm:p-3 h-full flex flex-col text-white overflow-hidden relative
            
        `} style={{ backgroundColor: bin.color || '#3b82f6' }}>"""

new_render_card = """        <div className={`
            p-2 sm:p-3 h-full flex flex-col text-white overflow-hidden relative
            ${!isFromCurrentLayer ? 'opacity-50' : ''}
        `} style={{ backgroundColor: bin.color || '#3b82f6' }}>"""
content = content.replace(old_render_card, new_render_card)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
