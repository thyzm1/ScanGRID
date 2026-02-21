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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl pointer-events-auto transition-all hover:scale-[1.02]">
        
        {/* Layer Tabs Container */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-[200px] sm:max-w-none px-1">
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
                  relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              > 
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px]">
                  {idx + 1}
                </span>
                <span className={`${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  Couche
                </span>
                {layer.bins.length > 0 && (
                   <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-800'} ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                     {layer.bins.length}
                   </span>
                )}
              </motion.button>
            )
          })}
          </AnimatePresence>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        {/* Actions */}
        <div className="flex items-center gap-1">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddLayer}
                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
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
                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                title="Supprimer la couche"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                </motion.button>
            )}
        </div>
      </div>
    </div>
  );
};

export default LayerSelector;
