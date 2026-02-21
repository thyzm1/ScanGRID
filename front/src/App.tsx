import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import DrawerList from './components/DrawerList';
import GridEditor3 from './components/GridEditor3';
import Viewer3D from './components/Viewer3D';
import { Settings } from './components/Settings';
import ThemeToggle from './components/ThemeToggle';
import SearchBar from './components/SearchBar';
import BinEditorModal from './components/BinEditorModal';
import { apiClient } from './services/api';
import type { Bin } from './types/api';

function App() {
  const {
    darkMode,
    currentDrawer,
    currentLayerIndex,
    setDrawers,
    setCurrentDrawer,
    viewMode,
    setViewMode,
    sidebarOpen,
    setSidebarOpen,
    selectedBin,
    setSelectedBin,
  } = useStore();

  // Sync dark mode with document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Load drawers AND restore state on mount
  useEffect(() => {
    const lastDrawerId = localStorage.getItem('scangrid_last_drawer_id');
    const lastLayerIndex = localStorage.getItem('scangrid_last_layer_index');

    apiClient
      .listDrawers()
      .then((data) => {
        setDrawers(data);
        
        // Restore last state if available
        if (lastDrawerId) {
            const savedDrawer = data.find(d => d.drawer_id === lastDrawerId);
            if (savedDrawer) {

                setCurrentDrawer(savedDrawer);
                
                // Override layer index if valid
                if (lastLayerIndex) {
                    const idx = parseInt(lastLayerIndex, 10);
                    if (!isNaN(idx) && idx < savedDrawer.layers.length) {
                         useStore.setState({ currentLayerIndex: idx });
                    }
                }
            }
        }
      })
      .catch((err) => console.error('Failed to load drawers:', err));
  }, [setDrawers, setCurrentDrawer]);

  // Auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const handleBinClick = (bin: Bin) => {
    setSelectedBin(bin);
  };

  const handleBinDoubleClick = (bin: Bin) => {
    setSelectedBin(bin);
  };

  const handleSaveBin = (updatedBin: Bin) => {
    console.log('handleSaveBin called with:', updatedBin); // DEBUG LOG

    if (!currentDrawer) {
      console.error('No current drawer!');
      return;
    }

    const currentLayer = currentDrawer.layers[currentLayerIndex];
    const targetLayerId = updatedBin.layer_id || currentLayer.layer_id;
    
    let updatedLayers;

    if (targetLayerId === currentLayer.layer_id) {
        // Standard update (same layer)
        updatedLayers = currentDrawer.layers.map((layer) =>
          layer.layer_id === currentLayer.layer_id
            ? {
                ...layer,
                bins: layer.bins.map((b) =>
                  b.bin_id === updatedBin.bin_id ? updatedBin : b
                ),
              }
            : layer
        );
    } else {
        // Move to different layer
        updatedLayers = currentDrawer.layers.map((layer) => {
            if (layer.layer_id === currentLayer.layer_id) {
                // Remove from source
                return { ...layer, bins: layer.bins.filter(b => b.bin_id !== updatedBin.bin_id) };
            }
            if (layer.layer_id === targetLayerId) {
                // Add to destination (set to Unplaced to avoid collisions)
                // We must ensure the layer_id is updated in the object itself for consistency
                const movedBin = { 
                    ...updatedBin, 
                    x_grid: -1, 
                    y_grid: -1,
                    layer_id: targetLayerId 
                };
                return { ...layer, bins: [...layer.bins, movedBin] };
            }
            return layer;
        });
    }

    setCurrentDrawer({
      ...currentDrawer,
      layers: updatedLayers,
    });

    // Send update to API
    const { bin_id, ...updateData } = updatedBin;
    
    // If we moved layers, we must ensure coordinates are updated todock (-1, -1) in the API call too, 
    // AND layer_id is sent.
    if (targetLayerId !== currentLayer.layer_id) {
        // Override coords for move
        const moveData = { ...updateData, x_grid: -1, y_grid: -1, layer_id: targetLayerId };
        console.log('Sending API update for bin move:', bin_id, moveData);
        apiClient.updateBin(bin_id, moveData)
          .then((res) => console.log('API update success:', res))
          .catch((err) => console.error('Failed to update bin API:', err));
    } else {
        console.log('Sending API update for bin:', bin_id, updateData);
        apiClient.updateBin(bin_id, updateData)
          .then((res) => console.log('API update success:', res))
          .catch((err) => console.error('Failed to update bin API:', err));
    }

    setSelectedBin(null); // Close after save
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      {/* Compact Header - Only 3.5rem tall */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="h-14 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl flex items-center justify-between px-4 relative z-20 shadow-sm"
      >
        <div className="flex items-center gap-3">
          {/* Menu Toggle (Icon Only) */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--color-bg)] rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </motion.button>

          {/* Compact Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-bold hidden sm:block">ScanGRID</h1>
          </div>

          {/* Current Drawer Info (Compact) */}
          {currentDrawer && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[var(--color-bg)] rounded-md text-xs">
              <span className="font-semibold">{currentDrawer.name}</span>
              <span className="text-[var(--color-text-secondary)]">
                {currentDrawer.width_units}×{currentDrawer.depth_units}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar (Compact) */}
          <SearchBar />

          {/* 2D/3D/Settings Toggle (Compact) */}
          {currentDrawer && (
            <div className="flex items-center gap-0.5 bg-[var(--color-bg)] rounded-md p-0.5">
              <button
                onClick={() => setViewMode('2D')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  viewMode === '2D'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3D')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  viewMode === '3D'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                3D
              </button>
            </div>
          )}

          <button
            onClick={() => setViewMode(viewMode === 'settings' ? '2D' : 'settings')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'settings'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
            }`}
            title="Paramètres"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <ThemeToggle />
        </div>
      </motion.header>

      {/* Main Content - Full Height minus compact header */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Overlay (Glassmorphism) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
              />
              
              {/* Sidebar Panel */}
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-14 bottom-0 w-80 border-r border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl overflow-y-auto z-40 shadow-2xl"
              >
                <div className="p-4">
                  <DrawerList />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Editor Area - MAXIMUM SPACE (>85% viewport) */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {viewMode === 'settings' ? (
            <Settings />
          ) : currentDrawer ? (
            <>
              {/* View Area */}
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {viewMode === '2D' ? (
                    <motion.div
                      key="2d-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <GridEditor3 
                        onBinClick={handleBinClick} 
                        onBinDoubleClick={handleBinDoubleClick}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="3d-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full relative"
                    >
                      <Viewer3D onBinClick={handleBinDoubleClick} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center px-6"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center"
              >
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Aucun tiroir sélectionné</h2>
              <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
                Créez un nouveau tiroir ou sélectionnez-en un existant pour commencer
              </p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all"
              >
                Ouvrir la liste des tiroirs
              </button>
            </motion.div>
          )}
        </main>
      </div>

      {/* Bin Editor Modal */}
      <AnimatePresence>
        {selectedBin && (
          <BinEditorModal
            bin={selectedBin}
            onClose={() => setSelectedBin(null)}
            onSave={handleSaveBin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
