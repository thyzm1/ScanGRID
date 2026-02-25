import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import type { Category } from '../types/api';
import {
  generateReorganizationPlan,
  type ReorganizationPlan,
  type ReorganizationScope,
} from '../utils/reorganization';

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ReorganizationPlanner() {
  const {
    drawers,
    currentDrawer,
    categories,
    setCategories,
    setDrawers,
    setCurrentDrawer,
  } = useStore();

  const [scope, setScope] = useState<ReorganizationScope>('drawer');
  const [plan, setPlan] = useState<ReorganizationPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scope === 'drawer' && !currentDrawer) {
      setScope('global');
    }
  }, [scope, currentDrawer]);

  useEffect(() => {
    if (categories.length > 0) return;
    apiClient
      .listCategories()
      .then((data) => setCategories(data))
      .catch(() => {
        // Non bloquant: l'algorithme fonctionne sans catégories explicites.
      });
  }, [categories.length, setCategories]);

  const categoriesById = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((category) => {
      map[category.id] = category;
    });
    return map;
  }, [categories]);

  const handleGeneratePlan = () => {
    setError(null);
    setMessage(null);

    if (drawers.length === 0) {
      setError('Aucun tiroir disponible.');
      return;
    }

    if (scope === 'drawer' && !currentDrawer) {
      setError('Sélectionnez un tiroir pour générer un plan local.');
      return;
    }

    setIsGenerating(true);
    try {
      const nextPlan = generateReorganizationPlan(drawers, {
        scope,
        currentDrawerId: currentDrawer?.drawer_id,
        categoriesById,
      });

      setPlan(nextPlan);
      if (nextPlan.totalBins === 0) {
        setMessage('Aucune boîte à réorganiser dans ce périmètre.');
      } else if (nextPlan.moves.length === 0) {
        setMessage('Le rangement actuel est déjà optimisé selon les contraintes.');
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(`Impossible de générer le plan: ${detail}`);
      setPlan(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!plan) {
      setError('Générez un plan avant de l’appliquer.');
      return;
    }

    if (plan.moves.length === 0) {
      setMessage('Aucun changement à appliquer.');
      return;
    }

    setIsApplying(true);
    setApplyProgress(0);
    setError(null);
    setMessage(null);

    const failedMoves: string[] = [];

    try {
      for (let i = 0; i < plan.moves.length; i += 1) {
        const move = plan.moves[i];

        try {
          await apiClient.updateBin(move.binId, {
            x_grid: move.toX,
            y_grid: move.toY,
            layer_id: move.toLayerId,
          });
        } catch {
          failedMoves.push(move.title);
        }

        setApplyProgress((i + 1) / plan.moves.length);
      }

      const refreshedDrawers = await apiClient.listDrawers();
      setDrawers(refreshedDrawers);

      if (currentDrawer) {
        const refreshedCurrent =
          refreshedDrawers.find((drawer) => drawer.drawer_id === currentDrawer.drawer_id) || null;
        setCurrentDrawer(refreshedCurrent, true);
      }

      if (failedMoves.length > 0) {
        setError(
          `Réorganisation partielle: ${failedMoves.length} boîte(s) non mises à jour (${failedMoves
            .slice(0, 3)
            .join(', ')}${failedMoves.length > 3 ? '…' : ''}).`
        );
      } else {
        setMessage('Réorganisation appliquée avec succès.');
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(`Erreur pendant l’application: ${detail}`);
    } finally {
      setIsApplying(false);
      setApplyProgress(0);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-bg-secondary)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
          <h2 className="text-xl sm:text-2xl font-bold">Réorganisation intelligente</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Génère une proposition de rangement en respectant les dimensions, les couches et le support vertical.
          </p>

          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border)] w-full lg:w-auto">
              <button
                onClick={() => setScope('drawer')}
                disabled={!currentDrawer || isGenerating || isApplying}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                  scope === 'drawer'
                    ? 'bg-blue-500 text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Tiroir courant
              </button>
              <button
                onClick={() => setScope('global')}
                disabled={isGenerating || isApplying}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                  scope === 'global'
                    ? 'bg-indigo-500 text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Global (tous les tiroirs)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating || isApplying}
                className="h-10 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Génération...' : 'Générer un plan'}
              </button>
              <button
                onClick={handleApplyPlan}
                disabled={!plan || isGenerating || isApplying}
                className="h-10 px-4 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? 'Application...' : 'Appliquer'}
              </button>
            </div>
          </div>

          {isApplying && (
            <div className="mt-3">
              <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden border border-[var(--color-border)]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-200"
                  style={{ width: `${Math.round(applyProgress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Progression: {Math.round(applyProgress * 100)}%
              </p>
            </div>
          )}

          {message && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-lg font-semibold">Proposition générée</h3>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {formatDateTime(plan.generatedAt)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                  <div className="text-xs text-[var(--color-text-secondary)]">Boîtes analysées</div>
                  <div className="text-xl font-bold">{plan.totalBins}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                  <div className="text-xs text-[var(--color-text-secondary)]">Déplacements</div>
                  <div className="text-xl font-bold text-blue-500">{plan.moves.length}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                  <div className="text-xs text-[var(--color-text-secondary)]">Inchangées</div>
                  <div className="text-xl font-bold text-emerald-500">{plan.unchanged}</div>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                  <div className="text-xs text-[var(--color-text-secondary)]">Non placées</div>
                  <div className="text-xl font-bold text-amber-500">{plan.unplaced.length}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.drawerSummaries.map((summary) => (
                  <div
                    key={summary.drawerId}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3"
                  >
                    <div className="font-semibold text-sm">{summary.drawerName}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Placées: {summary.placed} • Entrées: {summary.movedIn} • Sorties: {summary.movedOut}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
              <h3 className="text-lg font-semibold mb-3">Changements proposés</h3>
              {plan.moves.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Aucun déplacement proposé.
                </p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                  {plan.moves.map((move) => (
                    <div
                      key={`${move.binId}-${move.toDrawerId}-${move.toLayerId}-${move.toX}-${move.toY}`}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="font-medium">{move.title}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{move.reason}</div>
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {move.fromDrawerName} • Couche {move.fromLayerIndex + 1} ({move.fromX}, {move.fromY})
                        {'  '}→{'  '}
                        {move.toDrawerName} • Couche {move.toLayerIndex + 1} ({move.toX}, {move.toY})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {plan.unplaced.length > 0 && (
              <div className="rounded-2xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 shadow-sm p-5">
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300 mb-2">
                  Boîtes non placées
                </h3>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {plan.unplaced.map((item) => (
                    <div
                      key={item.binId}
                      className="text-sm text-amber-800 dark:text-amber-200 border border-amber-300/50 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs ml-2 opacity-90">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
