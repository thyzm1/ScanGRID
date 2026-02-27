import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';
import type { Bin, Drawer, Category } from '../types/api';
import { recordBinSearch } from '../utils/analytics';
import { fuzzyMatch, normalizeString } from '../utils/searchUtils';

interface SearchResult {
  drawer: Drawer;
  layerIndex: number;
  bin?: Bin;
  type: 'drawer' | 'bin';
  matchContext?: {
    field: 'title' | 'description' | 'item';
    text: string;
  };
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const shouldIgnoreDescriptionQuery = (value: string) => value.trim().length <= 2;

const highlightText = (text: string | undefined, query: string) => {
  if (!text || !query.trim()) return text;

  const normalizedText = normalizeString(text, false);
  const normalizedQuery = normalizeString(query, false);
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) return text; // If we can't find a direct substring (likely typos), just return unformatted text

  // Extract a snippet around the match
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + query.length + 40);
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  // Find exact case of the original matched string using the index
  const matchOriginal = text.substring(index, index + query.length);
  if (!matchOriginal) return snippet;

  const safeQuery = escapeRegExp(matchOriginal);
  const parts = snippet.split(new RegExp(`(${safeQuery})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === matchOriginal.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-yellow-100 rounded px-0.5 font-medium">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default function SearchBar() {
  const {
    drawers,
    setCurrentDrawer,
    setCurrentLayerIndex,
    setSearchedBinId,
    setSelectedBin,
    setFilterText,
    selectedCategoryId,
    setSelectedCategoryId
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);

  const resetSearchInputs = () => {
    setQuery('');
    setResults([]);
    setFilterText('');
    setSelectedCategoryId(null);
  };

  const closeAndResetSearch = () => {
    setIsOpen(false);
    resetSearchInputs();
    setSearchedBinId(null);
  };

  // Fetch categories on mount
  useEffect(() => {
    apiClient.listCategories().then(setCategories).catch(console.error);
  }, []);

  // Update global filter
  useEffect(() => {
    setFilterText(isOpen ? query : '');
  }, [isOpen, query, setFilterText]);

  // Search logic
  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      return;
    }

    // If no query and no category, clear results
    if (!query.trim() && !selectedCategoryId) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const allowDescriptionMatch = !shouldIgnoreDescriptionQuery(query);

    drawers.forEach((drawer) => {
      // Drawer search: Name matches and NO category selected (drawers don't have categories)
      if (!selectedCategoryId && fuzzyMatch(query, drawer.name)) {
        searchResults.push({
          drawer,
          layerIndex: 0,
          type: 'drawer',
        });
      }

      // Bin search
      drawer.layers.forEach((layer, layerIndex) => {
        layer.bins.forEach((bin) => {
          // 1. Check Category
          if (selectedCategoryId && bin.category_id !== selectedCategoryId) {
            return;
          }

          // 2. Check Text
          const matchLabel = fuzzyMatch(query, bin.content.title || '');
          const matchDesc = allowDescriptionMatch && fuzzyMatch(query, bin.content.description || '');
          const matchedItem = bin.content.items?.find(item =>
            typeof item === 'string'
              ? fuzzyMatch(query, item)
              : fuzzyMatch(query, (item as any).name || '')
          );

          if (query.trim() === '' || matchLabel || matchDesc || matchedItem) {
            let matchContext;
            if (query.trim() !== '') {
              if (matchLabel) {
                matchContext = { field: 'title' as const, text: bin.content.title };
              } else if (matchDesc) {
                matchContext = { field: 'description' as const, text: bin.content.description! };
              } else if (matchedItem) {
                matchContext = {
                  field: 'item' as const,
                  text: typeof matchedItem === 'string' ? matchedItem : (matchedItem as any).name
                };
              }
            }

            searchResults.push({
              drawer,
              layerIndex,
              bin,
              type: 'bin',
              matchContext,
            });
          }
        });
      });
    });

    setResults(searchResults.slice(0, 50));
  }, [isOpen, query, drawers, selectedCategoryId]);

  const handleSelectResult = (result: SearchResult) => {
    setCurrentDrawer(result.drawer);
    setCurrentLayerIndex(result.layerIndex);

    // Close modal
    setIsOpen(false);

    // Clear filters
    resetSearchInputs();

    if (result.type === 'bin' && result.bin) {
      recordBinSearch(result.bin, result.drawer);
      setTimeout(() => {
        setSearchedBinId(result.bin!.bin_id);
      }, 50);
    } else {
      setSearchedBinId(null);
      setSelectedBin(null);
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeAndResetSearch();
        } else {
          setIsOpen(true);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        closeAndResetSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const hasActiveSearch = query.trim().length > 0 || Boolean(selectedCategoryId);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg)] rounded-lg text-sm transition-colors border ${isOpen
            ? 'text-blue-600 border-blue-500 dark:text-blue-300 dark:border-blue-400'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border-[var(--color-border)]'
          }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden md:inline">Rechercher...</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-[var(--color-bg-secondary)] rounded">
          ⌘K
        </kbd>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm p-4"
              onClick={closeAndResetSearch}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl bg-[var(--color-bg)] rounded-xl shadow-2xl overflow-hidden border border-[var(--color-border)] flex flex-col max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center p-4 border-b border-[var(--color-border)] gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Rechercher une boîte, un article..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--color-text)] placeholder-gray-400"
                  />

                  <select
                    className="bg-[var(--color-bg-secondary)] text-[var(--color-text)] text-sm rounded-md border border-[var(--color-border)] px-2 py-1 outline-none h-8 max-w-[100px] sm:max-w-none"
                    value={selectedCategoryId || ''}
                    onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                  >
                    <option value="">{window.innerWidth < 768 ? 'Cat.' : 'Toutes catégories'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>

                  <button onClick={closeAndResetSearch} className="text-gray-400 hover:text-[var(--color-text)]">
                    <kbd className="text-xs border border-gray-600 rounded px-1">Esc</kbd>
                  </button>
                </div>

                <div className="overflow-y-auto p-2">
                  {!hasActiveSearch ? (
                    <div className="text-center py-10 text-[var(--color-text-secondary)]">
                      <p className="font-medium text-sm">Commencez une recherche</p>
                      <p className="text-xs mt-1">Titre, description, article ou catégorie</p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun résultat trouvé
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {results.map((result, index) => (
                        <button
                          key={`${result.type}-${index}`}
                          onClick={() => handleSelectResult(result)}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors group flex items-center gap-3"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${result.type === 'drawer' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {result.type === 'drawer' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[var(--color-text)] group-hover:text-blue-500 transition-colors truncate">
                              {result.type === 'drawer'
                                ? highlightText(result.drawer.name, query)
                                : highlightText(result.bin?.content.title, query)}
                            </div>
                            {result.matchContext && result.matchContext.field !== 'title' && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5 italic">
                                {result.matchContext.field === 'description' ? 'Description: ' : 'Article: '}
                                {highlightText(result.matchContext.text, query)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap mt-1">
                              <span>{result.drawer.name}</span>
                              <span>•</span>
                              <span>Couche {result.layerIndex + 1}</span>
                              {result.type === 'bin' && result.bin && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                    x:{result.bin.x_grid}, y:{result.bin.y_grid}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
