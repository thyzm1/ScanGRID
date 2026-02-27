import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import DrawerList from './components/DrawerList';
import GridEditor3 from './components/GridEditor3';
import Viewer3D from './components/Viewer3D';
import { Settings } from './components/Settings';
import SearchBar from './components/SearchBar';
import BinEditorModal from './components/BinEditorModal';
import ReorganizationPlanner from './components/ReorganizationPlanner';
import BOMGenerator from './components/BOMGenerator';
import BOMImport from './components/BOMImport';
import ProjectManager from './components/ProjectManager';
import { apiClient } from './services/api';
import type { Bin } from './types/api';
import { recordBinOpen } from './utils/analytics';

// ─── NavBtn helper ────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-400/40',
  teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-400/40',
  violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-400/40',
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/40',
  indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-400/40',
};

function NavBtn({
  icon, label, title, active, color, onClick,
}: {
  icon: string; label: string; title: string;
  active: boolean; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={onClick} title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${active
        ? `${COLOR_MAP[color] ?? COLOR_MAP.blue} shadow-sm`
        : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
        }`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const lastOpenedBinRef = useRef<string | null>(null);
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
    aiImportStatus,
  } = useStore();

  // Sync dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Load drawers & restore last state
  useEffect(() => {
    const lastDrawerId = localStorage.getItem('scangrid_last_drawer_id');
    const lastLayerIndex = localStorage.getItem('scangrid_last_layer_index');
    apiClient.listDrawers().then((data) => {
      setDrawers(data);
      if (lastDrawerId) {
        const saved = data.find(d => d.drawer_id === lastDrawerId);
        if (saved) {
          setCurrentDrawer(saved);
          if (lastLayerIndex) {
            const idx = parseInt(lastLayerIndex, 10);
            if (!isNaN(idx) && idx < saved.layers.length) {
              useStore.setState({ currentLayerIndex: idx });
            }
          }
        }
      }
    }).catch((err) => console.error('Failed to load drawers:', err));
  }, [setDrawers, setCurrentDrawer]);

  // Auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768) setSidebarOpen(false); };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Track opened bins
  useEffect(() => {
    if (!selectedBin) { lastOpenedBinRef.current = null; return; }
    if (lastOpenedBinRef.current !== selectedBin.bin_id) {
      recordBinOpen(selectedBin, currentDrawer || undefined);
      lastOpenedBinRef.current = selectedBin.bin_id;
    }
  }, [selectedBin, currentDrawer]);

  const handleBinClick = (bin: Bin) => setSelectedBin(bin);
  const handleBinDoubleClick = (bin: Bin) => setSelectedBin(bin);

  const handleSaveBin = (updatedBin: Bin) => {
    if (!currentDrawer) { console.error('No current drawer!'); return; }
    const sourceLayer = currentDrawer.layers.find(l => l.bins.some(b => b.bin_id === updatedBin.bin_id));
    const sourceLayerId = sourceLayer?.layer_id || updatedBin.layer_id || currentDrawer.layers[currentLayerIndex]?.layer_id;
    const targetLayerId = updatedBin.layer_id || sourceLayerId;
    if (!targetLayerId) { console.error('No target layer for bin update'); return; }

    const moving = Boolean(sourceLayerId && sourceLayerId !== targetLayerId);
    const updatedLayers = currentDrawer.layers.map(layer => {
      const without = layer.bins.filter(b => b.bin_id !== updatedBin.bin_id);
      if (layer.layer_id !== targetLayerId)
        return without.length === layer.bins.length ? layer : { ...layer, bins: without };
      const binForLayer = moving
        ? { ...updatedBin, x_grid: -1, y_grid: -1, layer_id: targetLayerId }
        : { ...updatedBin, layer_id: targetLayerId };
      return { ...layer, bins: [...without, binForLayer] };
    });
    setCurrentDrawer({ ...currentDrawer, layers: updatedLayers }, true);
    const { bin_id, ...updateData } = updatedBin;
    if (moving) {
      apiClient.updateBin(bin_id, { ...updateData, x_grid: -1, y_grid: -1, layer_id: targetLayerId })
        .catch(err => console.error('Failed to update bin API:', err));
    } else {
      apiClient.updateBin(bin_id, { ...updateData, layer_id: targetLayerId })
        .catch(err => console.error('Failed to update bin API:', err));
    }
  };

  const handleDeleteBin = async (binId: string) => {
    if (!currentDrawer) return;

    // Optimistic Update
    const updatedLayers = currentDrawer.layers.map((layer) =>
      ({ ...layer, bins: layer.bins.filter((b) => b.bin_id !== binId) })
    );

    setCurrentDrawer({
      ...currentDrawer,
      layers: updatedLayers,
    }, true);

    if (selectedBin?.bin_id === binId) {
      setSelectedBin(null);
    }

    try {
      await apiClient.deleteBin(binId);
    } catch (error) {
      console.error("Failed to delete bin", error);
      // Fallback reload
      apiClient.getDrawer(currentDrawer.drawer_id).then(drawer => setCurrentDrawer(drawer));
    }
  };

  const isStock = viewMode === '2D' || viewMode === '3D';

  return (
    <div className="h-[100vh] w-screen overflow-hidden text-[var(--color-text)] flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -80 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="h-14 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90 backdrop-blur-xl flex items-center justify-between px-3 relative z-20 shadow-sm gap-2"
      >
        {/* Left: menu + logo + drawer badge */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-[var(--color-bg)] rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>

          <div className="flex items-center gap-1.5 select-none">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <span className="text-base font-bold hidden sm:block tracking-tight">ScanGRID</span>
          </div>

          {currentDrawer && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg)] rounded-lg text-xs border border-[var(--color-border)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-semibold max-w-[120px] truncate">{currentDrawer.name}</span>
              <span className="text-[var(--color-text-secondary)]">{currentDrawer.width_units}×{currentDrawer.depth_units}</span>
            </div>
          )}
        </div>

        {/* Centre: grouped nav */}
        <nav className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
          {/* 📦 STOCK */}
          <NavBtn icon="📦" label="Stock" title="Grille des Tiroirs (page d'accueil)"
            active={isStock} color="blue" onClick={() => setViewMode('2D')} />

          <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />

          {/* 📁 PROJETS */}
          <NavBtn icon="📁" label="Projets" title="Gestion de Projets"
            active={viewMode === 'projects'} color="teal"
            onClick={() => setViewMode(viewMode === 'projects' ? '2D' : 'projects')} />

          <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />

          {/* BOM CENTER pill group */}
          <div className="flex items-center gap-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-1 py-0.5">
            <span className="text-[9px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.15em] px-1.5 hidden sm:block">BOM</span>
            <div className="relative">
              <NavBtn icon="🤖" label="Import IA" title="Import BOM via Ollama llama3.2:3b"
                active={viewMode === 'bom-import'} color="violet"
                onClick={() => setViewMode(viewMode === 'bom-import' ? '2D' : 'bom-import')} />
              {aiImportStatus === 'success' && viewMode !== 'bom-import' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-[var(--color-bg-secondary)]" />
              )}
            </div>
            <NavBtn icon="📋" label="Générateur" title="Générateur BOM + Export PDF"
              active={viewMode === 'bom'} color="emerald"
              onClick={() => setViewMode(viewMode === 'bom' ? '2D' : 'bom')} />
          </div>

          <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />

          {/* ⚡ PLANNER */}
          <NavBtn icon="⚡" label="Planner" title="Réorganisation intelligente"
            active={viewMode === 'organizer'} color="indigo"
            onClick={() => setViewMode(viewMode === 'organizer' ? '2D' : 'organizer')} />
        </nav>

        {/* Right: search + 2D/3D + settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SearchBar />

          {isStock && currentDrawer && (
            <div className="flex items-center gap-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-0.5">
              {(['2D', '3D'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${viewMode === m
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
                  {m}
                </button>
              ))}
            </div>
          )}

          <motion.button
            whileHover={{ rotate: 45 }} whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode(viewMode === 'settings' ? '2D' : 'settings')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'settings'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'}`}
            title="Paramètres"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>
        </div>
      </motion.header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
              />
              <motion.aside
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-14 bottom-0 w-80 border-r border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl overflow-y-auto z-40 shadow-2xl"
              >
                <div className="p-4"><DrawerList /></div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main editor */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {viewMode === 'settings' ? (
            <Settings />
          ) : viewMode === 'organizer' ? (
            <ReorganizationPlanner />
          ) : viewMode === 'bom' ? (
            <BOMGenerator />
          ) : viewMode === 'bom-import' ? (
            <BOMImport />
          ) : viewMode === 'projects' ? (
            <ProjectManager />
          ) : currentDrawer ? (
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {viewMode === '2D' ? (
                  <motion.div key="2d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} className="h-full">
                    <GridEditor3 onBinClick={handleBinClick} onBinDoubleClick={handleBinDoubleClick} />
                  </motion.div>
                ) : (
                  <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} className="h-full relative">
                    <Viewer3D onBinClick={handleBinDoubleClick} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center px-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center"
              >
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Aucun tiroir sélectionné</h2>
              <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
                Créez un nouveau tiroir ou sélectionnez-en un existant pour commencer
              </p>
              <button onClick={() => setSidebarOpen(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all">
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
            onDelete={handleDeleteBin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
