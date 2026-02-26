import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import {
  BarChart3,
  Database,
  ListChecks,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Shield,
  SkipForward,
  Square,
  Trash2,
} from 'lucide-react';
import { getAnalyticsSnapshot, resetAnalytics, type AnalyticsSnapshot } from '../utils/analytics';
import type { Bin, Drawer } from '../types/api';

type SettingsTab = 'general' | 'categories' | 'completion' | 'stats' | 'advanced';
type MissingField = 'category' | 'description' | 'photos' | 'icon';

interface SuggestedCategory {
  name: string;
  icon: string;
  domain: string;
}

interface BinEntry {
  drawer: Drawer;
  drawerId: string;
  drawerName: string;
  layerIndex: number;
  layerId: string;
  bin: Bin;
  missing: MissingField[];
}

const ALL_MISSING_FIELDS: MissingField[] = ['category', 'description', 'photos', 'icon'];

const MISSING_FIELD_LABELS: Record<MissingField, string> = {
  category: 'Catégorie',
  description: 'Description',
  photos: 'Photos',
  icon: 'Icône',
};

const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
  { name: 'Résistances traversantes', icon: 'settings_input_component', domain: 'Électronique' },
  { name: 'Résistances SMD', icon: 'memory', domain: 'Électronique' },
  { name: 'Condensateurs céramique', icon: 'radio_button_checked', domain: 'Électronique' },
  { name: 'Condensateurs électrolytiques', icon: 'battery_4_bar', domain: 'Électronique' },
  { name: 'Diodes de redressement', icon: 'electrical_services', domain: 'Électronique' },
  { name: 'LEDs 3mm / 5mm', icon: 'lightbulb', domain: 'Électronique' },
  { name: 'Transistors BJT', icon: 'lan', domain: 'Électronique' },
  { name: 'MOSFET de puissance', icon: 'bolt', domain: 'Électronique' },
  { name: 'Régulateurs linéaires 78xx', icon: 'power', domain: 'Électronique' },
  { name: 'Convertisseurs DC-DC', icon: 'swap_horiz', domain: 'Électronique' },
  { name: 'Microcontrôleurs ESP/AVR', icon: 'developer_board', domain: 'Électronique' },
  { name: 'Modules capteurs', icon: 'sensors', domain: 'Électronique' },
  { name: 'Plaques prototypage / PCB', icon: 'view_module', domain: 'Électronique' },
  { name: 'Connecteurs Dupont', icon: 'cable', domain: 'Électronique' },
  { name: 'Borniers à vis', icon: 'power_input', domain: 'Électronique' },
  { name: 'Connectique USB / DC Jack', icon: 'usb', domain: 'Électronique' },
  { name: 'Fusibles', icon: 'shield', domain: 'Électronique' },
  { name: 'Relais', icon: 'toggle_on', domain: 'Électronique' },
  { name: 'Interrupteurs & boutons', icon: 'touch_app', domain: 'Électronique' },
  { name: 'Batteries Li-ion / 18650', icon: 'battery_std', domain: 'Électronique' },
  { name: 'Chargeurs et BMS', icon: 'battery_charging_full', domain: 'Électronique' },
  { name: 'Vis M2', icon: 'hardware', domain: 'Petite mécanique' },
  { name: 'Vis M3', icon: 'hardware', domain: 'Petite mécanique' },
  { name: 'Vis M4', icon: 'hardware', domain: 'Petite mécanique' },
  { name: 'Écrous M3', icon: 'hexagon', domain: 'Petite mécanique' },
  { name: 'Rondelles M3', icon: 'radio_button_unchecked', domain: 'Petite mécanique' },
  { name: 'Entretoises', icon: 'height', domain: 'Petite mécanique' },
  { name: 'Roulements miniatures', icon: 'settings', domain: 'Petite mécanique' },
  { name: 'Ressorts', icon: 'timeline', domain: 'Petite mécanique' },
  { name: 'Joints toriques', icon: 'join_inner', domain: 'Petite mécanique' },
  { name: 'Colliers de serrage', icon: 'sell', domain: 'Bricolage' },
  { name: 'Gaines thermorétractables', icon: 'straighten', domain: 'Bricolage' },
  { name: 'Cosses et sertissage', icon: 'construction', domain: 'Bricolage' },
  { name: 'Forets métal', icon: 'build_circle', domain: 'Bricolage' },
  { name: 'Embouts tournevis', icon: 'build', domain: 'Bricolage' },
  { name: 'Clés Allen', icon: 'handyman', domain: 'Bricolage' },
  { name: 'Lubrifiants / graisse', icon: 'opacity', domain: 'Bricolage' },
  { name: 'Colles techniques', icon: 'science', domain: 'Bricolage' },
  { name: 'Abrasifs / papier de verre', icon: 'texture', domain: 'Bricolage' },
  { name: 'Inserts laiton impression 3D', icon: '3d_rotation', domain: 'Petite mécanique' },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const hasValidPhoto = (value: string) => value.trim().length > 0;

const getMissingFields = (bin: Bin): MissingField[] => {
  const missing: MissingField[] = [];
  const content = (bin.content || {}) as Bin['content'];
  const description = content.description?.trim() || '';
  const icon = content.icon?.trim() || '';
  const photos = Array.isArray(content.photos) ? content.photos : [];
  const hasPhoto = photos.some((photo) => hasValidPhoto(photo));

  if (!bin.category_id) missing.push('category');
  if (!description) missing.push('description');
  if (!hasPhoto) missing.push('photos');
  if (!icon) missing.push('icon');

  return missing;
};

export const Settings: React.FC = () => {
  const {
    categories,
    setCategories,
    addCategory,
    removeCategory,
    darkMode,
    toggleDarkMode,
    drawers,
    setCurrentDrawer,
    setCurrentLayerIndex,
    setSelectedBin,
  } = useStore();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('category');
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingSuggestionName, setAddingSuggestionName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [stats, setStats] = useState<AnalyticsSnapshot>(() => getAnalyticsSnapshot());

  const [missingFilters, setMissingFilters] = useState<MissingField[]>([...ALL_MISSING_FIELDS]);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [guidedQueue, setGuidedQueue] = useState<string[]>([]);
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [guidedRequiredFields, setGuidedRequiredFields] = useState<MissingField[]>([]);
  const [guidedMessage, setGuidedMessage] = useState<string | null>(null);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await apiClient.listCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [setCategories]);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    if (activeTab !== 'stats') return;

    const refresh = () => setStats(getAnalyticsSnapshot());
    refresh();
    const interval = window.setInterval(refresh, 1500);
    return () => window.clearInterval(interval);
  }, [activeTab]);

  const topSearched = useMemo(
    () =>
      [...stats.bins]
        .filter((metric) => metric.searchCount > 0)
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, 10),
    [stats.bins]
  );

  const topOpened = useMemo(
    () =>
      [...stats.bins]
        .filter((metric) => metric.openCount > 0)
        .sort((a, b) => b.openCount - a.openCount)
        .slice(0, 10),
    [stats.bins]
  );

  const normalizedCategorySearch = useMemo(() => normalize(categorySearch), [categorySearch]);

  const existingCategoryNames = useMemo(
    () => new Set(categories.map((category) => normalize(category.name))),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    if (!normalizedCategorySearch) return categories;
    return categories.filter((category) => {
      const categoryName = normalize(category.name);
      const icon = normalize(category.icon || '');
      return categoryName.includes(normalizedCategorySearch) || icon.includes(normalizedCategorySearch);
    });
  }, [categories, normalizedCategorySearch]);

  const filteredSuggestedCategories = useMemo(() => {
    return SUGGESTED_CATEGORIES.filter((suggested) => {
      if (existingCategoryNames.has(normalize(suggested.name))) return false;
      if (!normalizedCategorySearch) return true;

      return (
        normalize(suggested.name).includes(normalizedCategorySearch) ||
        normalize(suggested.domain).includes(normalizedCategorySearch) ||
        normalize(suggested.icon).includes(normalizedCategorySearch)
      );
    });
  }, [existingCategoryNames, normalizedCategorySearch]);

  const allBinEntries = useMemo<BinEntry[]>(() => {
    const entries: BinEntry[] = [];

    drawers.forEach((drawer) => {
      drawer.layers.forEach((layer, layerIndex) => {
        layer.bins.forEach((bin) => {
          entries.push({
            drawer,
            drawerId: drawer.drawer_id,
            drawerName: drawer.name,
            layerIndex,
            layerId: layer.layer_id,
            bin,
            missing: getMissingFields(bin),
          });
        });
      });
    });

    entries.sort((a, b) => {
      if (a.drawerName !== b.drawerName) return a.drawerName.localeCompare(b.drawerName);
      if (a.layerIndex !== b.layerIndex) return a.layerIndex - b.layerIndex;
      if (a.bin.y_grid !== b.bin.y_grid) return a.bin.y_grid - b.bin.y_grid;
      return a.bin.x_grid - b.bin.x_grid;
    });

    return entries;
  }, [drawers]);

  const incompleteEntries = useMemo(
    () => allBinEntries.filter((entry) => entry.missing.length > 0),
    [allBinEntries]
  );

  const allEntriesById = useMemo(() => {
    const entries = new Map<string, BinEntry>();
    allBinEntries.forEach((entry) => entries.set(entry.bin.bin_id, entry));
    return entries;
  }, [allBinEntries]);

  const incompleteById = useMemo(() => {
    const entries = new Map<string, BinEntry>();
    incompleteEntries.forEach((entry) => entries.set(entry.bin.bin_id, entry));
    return entries;
  }, [incompleteEntries]);

  const missingCounts = useMemo(() => {
    const counts: Record<MissingField, number> = {
      category: 0,
      description: 0,
      photos: 0,
      icon: 0,
    };

    incompleteEntries.forEach((entry) => {
      entry.missing.forEach((field) => {
        counts[field] += 1;
      });
    });

    return counts;
  }, [incompleteEntries]);

  const filteredIncompleteEntries = useMemo(() => {
    return incompleteEntries.filter((entry) =>
      entry.missing.some((field) => missingFilters.includes(field))
    );
  }, [incompleteEntries, missingFilters]);

  const resolveEntryFromStoreByBinId = useCallback((binId: string): BinEntry | null => {
    const latestDrawers = useStore.getState().drawers;

    for (const drawer of latestDrawers) {
      for (let layerIndex = 0; layerIndex < drawer.layers.length; layerIndex += 1) {
        const layer = drawer.layers[layerIndex];
        const bin = layer.bins.find((candidate) => candidate.bin_id === binId);
        if (!bin) continue;

        return {
          drawer,
          drawerId: drawer.drawer_id,
          drawerName: drawer.name,
          layerIndex,
          layerId: layer.layer_id,
          bin,
          missing: getMissingFields(bin),
        };
      }
    }

    return null;
  }, []);

  const openEntryForEdit = useCallback(
    (entry: BinEntry): boolean => {
      const latestEntry = resolveEntryFromStoreByBinId(entry.bin.bin_id) || entry;
      const maxLayerIndex = latestEntry.drawer.layers.length - 1;
      if (maxLayerIndex < 0) return false;

      const safeLayerIndex = Math.min(Math.max(0, latestEntry.layerIndex), maxLayerIndex);
      const safeLayerId =
        latestEntry.layerId || latestEntry.drawer.layers[safeLayerIndex]?.layer_id || latestEntry.bin.layer_id;

      if (!safeLayerId) return false;

      setCurrentDrawer(latestEntry.drawer);
      setCurrentLayerIndex(safeLayerIndex);
      setSelectedBin({
        ...latestEntry.bin,
        layer_id: safeLayerId,
      });
      return true;
    },
    [resolveEntryFromStoreByBinId, setCurrentDrawer, setCurrentLayerIndex, setSelectedBin]
  );

  const stopGuidedSession = useCallback(
    (message?: string, closeEditor = false) => {
      setIsGuidedMode(false);
      setGuidedQueue([]);
      setGuidedIndex(0);
      setGuidedRequiredFields([]);
      if (message) setGuidedMessage(message);
      if (closeEditor) setSelectedBin(null);
    },
    [setSelectedBin]
  );

  const findNextGuidedIndex = useCallback(
    (startIndex: number) => {
      const requiredFields =
        guidedRequiredFields.length > 0 ? guidedRequiredFields : ALL_MISSING_FIELDS;

      for (let i = startIndex; i < guidedQueue.length; i += 1) {
        const entry = incompleteById.get(guidedQueue[i]);
        if (!entry) continue;
        if (entry.missing.some((field) => requiredFields.includes(field))) {
          return i;
        }
      }
      return -1;
    },
    [guidedQueue, incompleteById, guidedRequiredFields]
  );

  const openGuidedAtIndex = useCallback(
    (targetIndex: number) => {
      const binId = guidedQueue[targetIndex];
      if (!binId) return false;

      const entry = resolveEntryFromStoreByBinId(binId) || allEntriesById.get(binId);
      if (!entry) return false;

      setGuidedIndex(targetIndex);
      return openEntryForEdit(entry);
    },
    [guidedQueue, allEntriesById, openEntryForEdit, resolveEntryFromStoreByBinId]
  );

  const toggleMissingFilter = (field: MissingField) => {
    setMissingFilters((prev) => {
      if (prev.includes(field)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== field);
      }
      return [...prev, field];
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = normalize(newCategoryName);
    if (!normalizedName) return;

    if (existingCategoryNames.has(normalizedName)) {
      setError('Cette catégorie existe déjà.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await apiClient.createCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon.trim() || 'category',
      });
      addCategory(created);
      setNewCategoryName('');
      setNewCategoryIcon('category');
    } catch (err) {
      setError('Impossible de créer la catégorie.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestedCategory = async (suggested: SuggestedCategory) => {
    if (existingCategoryNames.has(normalize(suggested.name))) return;

    setAddingSuggestionName(suggested.name);
    setError(null);

    try {
      const created = await apiClient.createCategory({
        name: suggested.name,
        icon: suggested.icon,
      });
      addCategory(created);
    } catch (err) {
      setError(`Impossible d'ajouter la catégorie "${suggested.name}".`);
      console.error(err);
    } finally {
      setAddingSuggestionName(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;

    try {
      await apiClient.deleteCategory(id);
      removeCategory(id);
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Suppression impossible. La catégorie est peut-être utilisée.');
    }
  };

  const startGuidedSession = () => {
    const required = missingFilters.length > 0 ? [...missingFilters] : [...ALL_MISSING_FIELDS];
    const queue = filteredIncompleteEntries.map((entry) => entry.bin.bin_id);

    if (queue.length === 0) {
      setGuidedMessage('Aucune bin à compléter avec les filtres actuels.');
      return;
    }

    setGuidedRequiredFields(required);
    setGuidedQueue(queue);
    setGuidedIndex(0);
    setIsGuidedMode(true);
    setGuidedMessage(null);

    const firstEntry = resolveEntryFromStoreByBinId(queue[0]) || allEntriesById.get(queue[0]);
    if (firstEntry) {
      if (!openEntryForEdit(firstEntry)) {
        stopGuidedSession("Impossible d'ouvrir la première bin de la session.", true);
      }
    }
  };

  const skipCurrentGuidedBin = () => {
    if (!isGuidedMode) return;

    const nextIndex = findNextGuidedIndex(guidedIndex + 1);
    if (nextIndex === -1) {
      stopGuidedSession('Session guidée terminée.', true);
      return;
    }

    if (!openGuidedAtIndex(nextIndex)) {
      stopGuidedSession('La bin suivante est introuvable, session arrêtée.', true);
    }
  };

  useEffect(() => {
    if (!isGuidedMode) return;

    if (guidedQueue.length === 0) {
      stopGuidedSession('Session guidée vide.', true);
      return;
    }

    const currentId = guidedQueue[guidedIndex];
    if (!currentId) {
      const nextIndex = findNextGuidedIndex(guidedIndex + 1);
      if (nextIndex === -1) {
        stopGuidedSession('Toutes les bins de la session sont complétées.', true);
      } else {
        openGuidedAtIndex(nextIndex);
      }
      return;
    }

    const requiredFields =
      guidedRequiredFields.length > 0 ? guidedRequiredFields : ALL_MISSING_FIELDS;
    const currentEntry = incompleteById.get(currentId);
    const stillMissingRequired = currentEntry
      ? currentEntry.missing.some((field) => requiredFields.includes(field))
      : false;

    if (stillMissingRequired) return;

    const nextIndex = findNextGuidedIndex(guidedIndex + 1);
    if (nextIndex === -1) {
      stopGuidedSession('Toutes les bins filtrées sont complétées.', true);
      return;
    }

    openGuidedAtIndex(nextIndex);
  }, [
    isGuidedMode,
    guidedQueue,
    guidedIndex,
    guidedRequiredFields,
    incompleteById,
    findNextGuidedIndex,
    openGuidedAtIndex,
    stopGuidedSession,
  ]);

  const guidedCurrentBinId = isGuidedMode ? guidedQueue[guidedIndex] : null;
  const guidedCurrentEntry = guidedCurrentBinId ? allEntriesById.get(guidedCurrentBinId) : null;

  const guidedRemaining = useMemo(() => {
    if (!isGuidedMode) return 0;
    const required = guidedRequiredFields.length > 0 ? guidedRequiredFields : ALL_MISSING_FIELDS;

    let remaining = 0;
    for (let i = guidedIndex; i < guidedQueue.length; i += 1) {
      const entry = incompleteById.get(guidedQueue[i]);
      if (entry && entry.missing.some((field) => required.includes(field))) {
        remaining += 1;
      }
    }
    return remaining;
  }, [isGuidedMode, guidedRequiredFields, guidedIndex, guidedQueue, incompleteById]);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-24">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
            Paramètres
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Catégories, complétion de données des bins, statistiques et options avancées.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="w-full lg:w-72 shrink-0">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'general'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <Palette className="w-4 h-4" />
                Général
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <Database className="w-4 h-4" />
                Catégories
              </button>
              <button
                onClick={() => setActiveTab('completion')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'completion'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Complétion des bins
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'advanced'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <Shield className="w-4 h-4" />
                Avancé
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Statistiques
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 sm:p-6">
            {activeTab === 'general' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold">Apparence</h2>
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <div>
                    <h3 className="font-medium">Mode sombre</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Basculer entre le thème clair et sombre.
                    </p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-semibold">Gestion des catégories</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Suggestions précises bricolage/électronique/mécanique + recherche rapide.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshCategories}
                    className="px-3 h-9 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    Rafraîchir
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Recherche catégorie</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="input pl-10 h-11"
                      placeholder="Ex: vis M3, capteur, connecteur..."
                    />
                  </div>
                </div>

                <form
                  onSubmit={handleCreateCategory}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px_auto] gap-3 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom</label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="input h-11"
                        placeholder="Ex: Vis M3 inox"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Icône Material</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newCategoryIcon}
                          onChange={(e) => setNewCategoryIcon(e.target.value)}
                          className="input h-11 pr-12"
                          placeholder="category"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                          {newCategoryIcon.trim() || 'category'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !newCategoryName.trim()}
                      className="h-11 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      Suggestions ({filteredSuggestedCategories.length})
                    </h3>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      Non encore créées
                    </span>
                  </div>
                  {filteredSuggestedCategories.length === 0 ? (
                    <div className="text-sm text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border)] p-3">
                      Aucune suggestion restante pour ce filtre.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {filteredSuggestedCategories.map((suggested) => (
                        <div
                          key={suggested.name}
                          className="rounded-lg border border-[var(--color-border)] p-3 bg-[var(--color-bg-secondary)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{suggested.name}</div>
                              <div className="text-xs text-[var(--color-text-secondary)]">
                                {suggested.domain}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-[20px] text-[var(--color-text-secondary)] shrink-0">
                              {suggested.icon}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSuggestedCategory(suggested)}
                            disabled={addingSuggestionName === suggested.name}
                            className="mt-3 w-full h-8 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50"
                          >
                            {addingSuggestionName === suggested.name ? 'Ajout...' : 'Ajouter'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Catégories existantes ({filteredCategories.length})</h3>
                  {filteredCategories.length === 0 ? (
                    <div className="text-sm text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border)] p-3">
                      Aucune catégorie correspondante.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                      {filteredCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[18px]">
                                {category.icon || 'category'}
                              </span>
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{category.name}</div>
                              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                                {category.icon || 'category'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 rounded-md text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Supprimer la catégorie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'completion' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Complétion des bins</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Vue carte des bins incomplètes et remplissage guidé automatique.
                  </p>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-5 gap-2">
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                    <div className="text-xs text-[var(--color-text-secondary)]">Bins totales</div>
                    <div className="text-xl font-bold">{allBinEntries.length}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                    <div className="text-xs text-[var(--color-text-secondary)]">Sans catégorie</div>
                    <div className="text-xl font-bold text-amber-600">{missingCounts.category}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                    <div className="text-xs text-[var(--color-text-secondary)]">Sans description</div>
                    <div className="text-xl font-bold text-blue-600">{missingCounts.description}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                    <div className="text-xs text-[var(--color-text-secondary)]">Sans photo</div>
                    <div className="text-xl font-bold text-emerald-600">{missingCounts.photos}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                    <div className="text-xs text-[var(--color-text-secondary)]">Sans icône</div>
                    <div className="text-xl font-bold text-violet-600">{missingCounts.icon}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-bg-secondary)]">
                  <div>
                    <div className="text-sm font-medium mb-2">Filtrer les champs manquants</div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_MISSING_FIELDS.map((field) => {
                        const active = missingFilters.includes(field);
                        return (
                          <button
                            key={field}
                            type="button"
                            onClick={() => toggleMissingFilter(field)}
                            className={`h-9 px-3 rounded-lg border text-sm transition-colors ${
                              active
                                ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
                            }`}
                          >
                            {MISSING_FIELD_LABELS[field]} ({missingCounts[field]})
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setMissingFilters([...ALL_MISSING_FIELDS])}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)] transition-colors"
                      >
                        Tout sélectionner
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={startGuidedSession}
                      disabled={filteredIncompleteEntries.length === 0}
                      className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Démarrer le remplissage guidé
                    </button>
                    {isGuidedMode && (
                      <>
                        <button
                          type="button"
                          onClick={skipCurrentGuidedBin}
                          className="h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)] transition-colors inline-flex items-center gap-2"
                        >
                          <SkipForward className="w-4 h-4" />
                          Passer
                        </button>
                        <button
                          type="button"
                          onClick={() => stopGuidedSession('Session guidée arrêtée.')}
                          className="h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)] transition-colors inline-flex items-center gap-2"
                        >
                          <Square className="w-4 h-4" />
                          Arrêter
                        </button>
                      </>
                    )}
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {isGuidedMode ? (
                        <>
                          Bin {Math.min(guidedIndex + 1, guidedQueue.length)} / {guidedQueue.length}
                          {' • '}
                          restantes: {guidedRemaining}
                          {guidedCurrentEntry ? ` • ${guidedCurrentEntry.bin.content?.title || 'Sans titre'}` : ''}
                        </>
                      ) : (
                        <>Résultats filtrés: {filteredIncompleteEntries.length}</>
                      )}
                    </div>
                  </div>
                </div>

                {guidedMessage && (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 text-sm">
                    {guidedMessage}
                  </div>
                )}

                {filteredIncompleteEntries.length === 0 ? (
                  <div className="rounded-xl border border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]">
                    Aucune bin ne correspond au filtre actuel.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {filteredIncompleteEntries.map((entry) => {
                      const isActiveGuided = isGuidedMode && guidedCurrentBinId === entry.bin.bin_id;
                      return (
                        <div
                          key={`${entry.drawerId}-${entry.bin.bin_id}`}
                          className={`rounded-xl border p-4 ${
                            isActiveGuided
                              ? 'border-blue-500 bg-blue-500/5'
                              : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">
                                {entry.bin.content?.title || 'Sans titre'}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                {entry.drawerName} • Couche {entry.layerIndex + 1} • ({entry.bin.x_grid},{' '}
                                {entry.bin.y_grid}) • {entry.bin.width_units}×{entry.bin.depth_units}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openEntryForEdit(entry)}
                              className="h-9 px-3 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg)] transition-colors shrink-0"
                            >
                              Éditer
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {entry.missing.map((field) => (
                              <span
                                key={`${entry.bin.bin_id}-${field}`}
                                className="px-2 py-1 rounded-md text-xs border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              >
                                Manque: {MISSING_FIELD_LABELS[field]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold">Paramètres avancés</h2>
                <div className="p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">Zone sensible</h3>
                  <p className="text-sm text-yellow-700/90 dark:text-yellow-400/90 mt-1 mb-3">
                    Ces actions sont irréversibles.
                  </p>
                  <button
                    className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                    onClick={() => alert('Fonction en cours de développement')}
                  >
                    Réinitialiser la base de données
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">Statistiques d'usage</h2>
                  <button
                    onClick={() => {
                      if (!window.confirm('Réinitialiser les statistiques locales ?')) return;
                      resetAnalytics();
                      setStats(getAnalyticsSnapshot());
                    }}
                    className="inline-flex items-center gap-2 px-3 h-9 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div className="text-xs text-[var(--color-text-secondary)]">Recherches totales</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.searchesTotal}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div className="text-xs text-[var(--color-text-secondary)]">Ouvertures totales</div>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.opensTotal}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div className="text-xs text-[var(--color-text-secondary)]">Bins suivies</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.bins.length}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[var(--color-border)] p-4">
                    <h3 className="font-semibold mb-3">Bins les plus recherchées</h3>
                    {topSearched.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Aucune recherche enregistrée.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {topSearched.map((metric, index) => (
                          <div
                            key={`search-${metric.binId}`}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-[var(--color-bg-secondary)]"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {index + 1}. {metric.title}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                                {metric.drawerName || 'Tiroir inconnu'}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                              {metric.searchCount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-[var(--color-border)] p-4">
                    <h3 className="font-semibold mb-3">Bins les plus ouvertes</h3>
                    {topOpened.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Aucune ouverture enregistrée.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {topOpened.map((metric, index) => (
                          <div
                            key={`open-${metric.binId}`}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-[var(--color-bg-secondary)]"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {index + 1}. {metric.title}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                                {metric.drawerName || 'Tiroir inconnu'}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                              {metric.openCount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
