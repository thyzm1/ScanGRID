import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import { Plus, Trash2, Settings as SettingsIcon, Palette, Database, Shield, BarChart3, RotateCcw } from 'lucide-react';
import { getAnalyticsSnapshot, resetAnalytics, type AnalyticsSnapshot } from '../utils/analytics';

export const Settings: React.FC = () => {
  const { categories, setCategories, addCategory, removeCategory, darkMode, toggleDarkMode } = useStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('ri-folder-line');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'stats' | 'advanced'>('general');
  const [stats, setStats] = useState<AnalyticsSnapshot>(() => getAnalyticsSnapshot());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiClient.listCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, [setCategories]);

  useEffect(() => {
    if (activeTab !== 'stats') return;

    const refresh = () => setStats(getAnalyticsSnapshot());
    refresh();
    const interval = window.setInterval(refresh, 1500);
    return () => window.clearInterval(interval);
  }, [activeTab]);

  const topSearched = [...stats.bins]
    .filter((metric) => metric.searchCount > 0)
    .sort((a, b) => b.searchCount - a.searchCount)
    .slice(0, 10);

  const topOpened = [...stats.bins]
    .filter((metric) => metric.openCount > 0)
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 10);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newCategory = await apiClient.createCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
      });
      addCategory(newCategory);
      setNewCategoryName('');
    } catch (err) {
      setError('Failed to create category');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await apiClient.deleteCategory(id);
      removeCategory(id);
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category. It might be in use by some bins.');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-500" />
            Paramètres
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gérez vos préférences, catégories et paramètres avancés.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'general'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Palette className="w-5 h-5" />
              Général
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'categories'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Database className="w-5 h-5" />
              Catégories
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'advanced'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Shield className="w-5 h-5" />
              Avancé
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'stats'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Statistiques
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Apparence</h2>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Mode Sombre</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Basculer entre le thème clair et sombre</p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
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
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gestion des Catégories</h2>
                
                <form onSubmit={handleCreateCategory} className="flex gap-4 items-end p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom de la catégorie
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ex: Électronique"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Icône (Remix Icon)
                    </label>
                    <input
                      type="text"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="ri-folder-line"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newCategoryName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </form>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Catégories existantes</h3>
                  <div className="space-y-2">
                    {categories.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm italic">Aucune catégorie pour le moment.</p>
                    ) : (
                      categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <i className={category.icon || 'ri-folder-line'}></i>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Supprimer la catégorie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Paramètres Avancés</h2>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h3 className="text-yellow-800 dark:text-yellow-500 font-medium mb-2">Zone de danger</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-600 mb-4">
                    Ces actions sont irréversibles et peuvent affecter le fonctionnement de l'application.
                  </p>
                  <button 
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium"
                    onClick={() => alert('Fonctionnalité en cours de développement')}
                  >
                    Réinitialiser la base de données
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Statistiques d'usage</h2>
                  <button
                    onClick={() => {
                      if (!window.confirm('Réinitialiser les statistiques locales ?')) return;
                      resetAnalytics();
                      setStats(getAnalyticsSnapshot());
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Recherches totales</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.searchesTotal}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Ouvertures totales</div>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.opensTotal}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Boîtes suivies</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.bins.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Boîtes les plus recherchées</h3>
                    {topSearched.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Aucune recherche enregistrée.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {topSearched.map((metric, index) => (
                          <div
                            key={`search-${metric.binId}`}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-900/40"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {index + 1}. {metric.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
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

                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Boîtes les plus ouvertes</h3>
                    {topOpened.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Aucune ouverture enregistrée.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {topOpened.map((metric, index) => (
                          <div
                            key={`open-${metric.binId}`}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-900/40"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {index + 1}. {metric.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
