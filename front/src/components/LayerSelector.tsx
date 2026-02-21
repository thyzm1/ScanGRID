import { motion } from 'framer-motion';
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
    <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-secondary)]/50 rounded-lg backdrop-blur-sm pointer-events-auto">
      {/* Layer Tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {currentDrawer.layers.map((layer, idx) => (
          <motion.button
            key={layer.layer_id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentLayerIndex(idx)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all
              ${
                idx === currentLayerIndex
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
              }
            `}
          >
            Couche {idx}
            <span className="ml-1.5 opacity-70">
              ({layer.bins.length})
            </span>
          </motion.button>
        ))}
      </div>

      {/* Add Layer Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddLayer}
        className="px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md"
        title="Ajouter une couche"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </motion.button>

      {/* Delete Layer Button */}
      {currentDrawer.layers.length > 1 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDeleteLayer}
          className="px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
          title="Supprimer la couche actuelle"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </motion.button>
      )}
    </div>
  );
};

export default LayerSelector;
