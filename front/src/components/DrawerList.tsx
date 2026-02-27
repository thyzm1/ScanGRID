import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import type { DrawerCreateRequest } from '../types/api';

export default function DrawerList() {
  const { drawers, currentDrawer, setCurrentDrawer, addDrawer, removeDrawer } =
    useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState('');
  const [gridWidth, setGridWidth] = useState(5);
  const [gridDepth, setGridDepth] = useState(4);
  const [loading, setLoading] = useState(false);
  const clampUnits = (value: number) => Math.min(24, Math.max(1, value));

  const handleCreate = async () => {
    if (!newDrawerName.trim()) return;

    setLoading(true);
    try {
      const request: DrawerCreateRequest = {
        name: newDrawerName,
        width_units: clampUnits(gridWidth),
        depth_units: clampUnits(gridDepth),
        layers: [
          {
            z_index: 0,
            bins: [],
          },
        ],
      };

      const drawer = await apiClient.createDrawer(request);
      addDrawer(drawer);
      setCurrentDrawer(drawer);
      setNewDrawerName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create drawer:', error);
      alert('Erreur lors de la création du tiroir');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (drawerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce tiroir ?')) return;

    try {
      await apiClient.deleteDrawer(drawerId);
      removeDrawer(drawerId);
    } catch (error) {
      console.error('Failed to delete drawer:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="bg-[var(--color-bg)]/95 backdrop-blur-xl rounded-xl shadow-sm border border-[var(--color-border)] h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm">
        <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Mes Tiroirs
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`p-1.5 rounded-lg transition-colors shadow-sm ${isCreating
              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          title={isCreating ? "Annuler" : "Nouveau tiroir"}
        >
          {isCreating ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[var(--color-border)] bg-blue-50/30 dark:bg-blue-900/20 backdrop-blur-sm"
          >
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom</label>
                <input
                  type="text"
                  placeholder="Ex: Atelier Électronique"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  value={newDrawerName}
                  onChange={(e) => setNewDrawerName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Largeur (U)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={gridWidth}
                      onChange={(e) => setGridWidth(clampUnits(parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prof. (U)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={gridDepth}
                      onChange={(e) => setGridDepth(clampUnits(parseInt(e.target.value, 10) || 1))}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !newDrawerName.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Créer le tiroir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {drawers.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center opacity-60">
            <i className="ri-inbox-line text-4xl mb-2"></i>
            <p className="text-sm">Aucun tiroir configuré</p>
          </div>
        )}

        {drawers.map((drawer) => {
          const isActive = currentDrawer?.drawer_id === drawer.drawer_id;
          return (
            <motion.div
              layout
              key={drawer.drawer_id}
              onClick={() => setCurrentDrawer(drawer)}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none
                ${isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500/20'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
                }
              `}
            >
              <div className={`
                p-2.5 rounded-lg flex-shrink-0 transition-colors
                ${isActive
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 group-hover:text-gray-600'
                }
              `}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-200'}`}>
                  {drawer.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1" title="Dimensions">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2" />
                    </svg>
                    {drawer.width_units}x{drawer.depth_units}
                  </span>
                  <span className="flex items-center gap-1" title="Couches">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4L2 9l10 5 10-5-10-5zM2 15l10 5 10-5M2 11l10 5 10-5" />
                    </svg>
                    {drawer.layers.length}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => handleDelete(drawer.drawer_id, e)}
                className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
