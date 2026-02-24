import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';

const LayerSelector = () => {
  const {
    currentDrawer,
    currentLayerIndex,
    setCurrentLayerIndex,
    setCurrentDrawer,
  } = useStore();

  if (!currentDrawer) return null;

  const handleAddLayer = async () => {
    // 1. Calculate new Z-index
    const z_index = currentDrawer.layers.length;
    
    // 2. Generate Temp ID
    const tempId = crypto.randomUUID();
    
    // 3. Create Optimistic Layer
    const newLayer = {
      layer_id: tempId,
      drawer_id: currentDrawer.drawer_id, // Ensure this property is present
      z_index: z_index,
      bins: [],
    };

    // 4. Update Store Optimistically
    const updatedDrawer = {
      ...currentDrawer,
      layers: [...currentDrawer.layers, newLayer],
    };
    setCurrentDrawer(updatedDrawer, true);
    
    // 5. Switch to New Layer IMMEDIATELY
    setCurrentLayerIndex(z_index);

    try {
      // 6. Call API
      const createdLayer = await apiClient.createLayer(currentDrawer.drawer_id, z_index);
      
      // 7. Update Store with Real ID but KEEP focus on new layer
      // We must re-read state to ensure we don't overwrite other changes
      const latestState = useStore.getState();
      const latestDrawer = latestState.currentDrawer;
      
      if (latestDrawer && latestDrawer.drawer_id === currentDrawer.drawer_id) {
         // Replace temp layer with real layer in the list
         const finalLayers = latestDrawer.layers.map(l => 
            l.layer_id === tempId ? { ...l, layer_id: createdLayer.layer_id } : l
         );
         
         // Update drawer
         useStore.getState().setCurrentDrawer({
           ...latestDrawer,
           layers: finalLayers
         }, true);
         
         // Vital: Ensure we are still on the correct index
         // No need to set index again usually, but good for safety
         useStore.getState().setCurrentLayerIndex(z_index);
      }
    } catch (error) {
       console.error("Failed to create layer", error);
       alert("Erreur lors de la création de la couche");
       
       // Revert on failure
       const latestState = useStore.getState();
       if (latestState.currentDrawer) {
          const revertedLayers = latestState.currentDrawer.layers.filter(l => l.layer_id !== tempId);
          useStore.getState().setCurrentDrawer({
            ...latestState.currentDrawer,
            layers: revertedLayers
          }, true);
          // Switch back to previous layer
          useStore.getState().setCurrentLayerIndex(Math.max(0, z_index - 1));
       }
    }
  };

  const handleDeleteLayer = () => {
    if (currentDrawer.layers.length <= 1) {
      alert('Impossible de supprimer la dernière couche');
      return;
    }

    if (!confirm('Supprimer cette couche ?')) return;

    const updatedLayers = currentDrawer.layers.filter(
      (_, idx) => idx !== currentLayerIndex
    );

    setCurrentDrawer({
      ...currentDrawer,
      layers: updatedLayers.map((layer, idx) => ({
        ...layer,
        z_index: idx,
      })),
    }, true);

    setCurrentLayerIndex(Math.max(0, currentLayerIndex - 1));
  };

  return (
    <div className="w-full min-[901px]:w-auto">
      <div className="hidden min-[901px]:flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md rounded-xl border border-[var(--color-border)] shadow-lg pointer-events-auto w-full sm:w-auto">
        {/* Layer Tabs Container */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-full px-1">
          <AnimatePresence mode='popLayout'>
          {currentDrawer.layers.map((layer, idx) => {
             const isActive = idx === currentLayerIndex;
             return (
              <motion.button
                key={layer.layer_id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setCurrentLayerIndex(idx)}
                className={`
                  h-9 relative px-2.5 sm:px-3 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2
                  ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }
                `}
              > 
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span className={`hidden md:inline ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  Couche
                </span>
                {layer.bins.length > 0 && (
                   <span className={`text-[10px] px-1 rounded-full shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'}`}>
                     {layer.bins.length}
                   </span>
                )}
              </motion.button>
            )
          })}
          </AnimatePresence>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 shrink-0"></div>

        {/* Actions */}
        <div className="flex items-center gap-1 bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)] shrink-0 h-11">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddLayer}
                className="h-9 w-9 rounded-md flex items-center justify-center text-green-500 hover:text-green-600 hover:bg-green-500/10 transition-colors"
                title="Ajouter une couche"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </motion.button>

            {currentDrawer.layers.length > 1 && (
                <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDeleteLayer}
                className="h-9 w-9 rounded-md flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                title="Supprimer la couche"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                </motion.button>
            )}
        </div>
      </div>

      {/* Mobile layout (<900px): dropdown for layers + compact actions */}
      <div className="flex min-[901px]:hidden items-center gap-1 max-[430px]:gap-0.5 p-1 max-[430px]:p-0.5 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md rounded-xl border border-[var(--color-border)] shadow-lg pointer-events-auto w-full">
        <select
          value={currentLayerIndex}
          onChange={(e) => setCurrentLayerIndex(parseInt(e.target.value, 10))}
          className="h-9 max-[430px]:h-8 min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-xs text-[var(--color-text)] outline-none"
        >
          {currentDrawer.layers.map((layer, idx) => (
            <option key={layer.layer_id} value={idx}>
              Couche {idx + 1} ({layer.bins.length})
            </option>
          ))}
        </select>

        <button
          onClick={handleAddLayer}
          className="h-9 w-9 max-[430px]:h-8 max-[430px]:w-8 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-green-500 hover:text-green-600 hover:bg-green-500/10 transition-colors flex items-center justify-center"
          title="Ajouter une couche"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {currentDrawer.layers.length > 1 && (
          <button
            onClick={handleDeleteLayer}
            className="h-9 w-9 max-[430px]:h-8 max-[430px]:w-8 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors flex items-center justify-center"
            title="Supprimer la couche"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default LayerSelector;
