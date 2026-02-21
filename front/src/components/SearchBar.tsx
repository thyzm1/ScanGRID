import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Bin, Drawer } from '../types/api';

interface SearchResult {
  drawer: Drawer;
  layerIndex: number;
  bin?: Bin;
  type: 'drawer' | 'bin';
}

export default function SearchBar() {
  const { drawers, setCurrentDrawer, setCurrentLayerIndex, setSearchedBinId, setSelectedBin } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    drawers.forEach((drawer) => {
      // Search in drawer name
      if (drawer.name.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          drawer,
          layerIndex: 0,
          type: 'drawer',
        });
      }

      // Search in bins
      drawer.layers.forEach((layer, layerIndex) => {
        layer.bins.forEach((bin) => {
          const matchLabel = bin.content.title?.toLowerCase().includes(lowerQuery);
          const matchDesc = bin.content.description?.toLowerCase().includes(lowerQuery);
          const matchContent = bin.content.items?.some(item => item.toLowerCase().includes(lowerQuery));

          if (matchLabel || matchDesc || matchContent) {
            searchResults.push({
              drawer,
              layerIndex,
              bin,
              type: 'bin',
            });
          }
        });
      });
    });

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
  }, [query, drawers]);

  // Open drawer and layer
  const handleSelectResult = (result: SearchResult) => {
    // 1. Set context (this clears selectedBin in store logic)
    setCurrentDrawer(result.drawer);
    setCurrentLayerIndex(result.layerIndex);
    
    // 2. Clear search query/modal
    setIsOpen(false);
    setQuery('');

    // 3. Set selection (must be done AFTER context change)
    if (result.type === 'bin' && result.bin) {
      // Use setTimeout to ensure this runs after any side-effects from drawer change
      // and to ensure the store has settled if there were async issues (though Zustand is sync)
      // Also helps if the mounting of GridEditor triggers something.
      setTimeout(() => {
        setSearchedBinId(result.bin!.bin_id);
        // Do NOT open the modal automatically as per user request
        // setSelectedBin(result.bin!); 
      }, 50);
    } else {
      setSearchedBinId(null);
      setSelectedBin(null);
    }
  };

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Search trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors border border-[var(--color-border)]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden md:inline">Rechercher...</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-[var(--color-bg-secondary)] rounded">
          ⌘K
        </kbd>
      </motion.button>

      {/* Search modal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-start justify-center z-[9999] p-4 pt-20"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: -20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-[var(--color-bg)] rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Search input */}
                <div className="p-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-[var(--color-text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher des tiroirs, boîtes, contenus..."
                      className="flex-1 bg-transparent outline-none text-lg text-[var(--color-text)]"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {results.length === 0 && query.trim() && (
                    <div className="p-8 text-center text-[var(--color-text-secondary)]">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 opacity-30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p>Aucun résultat trouvé</p>
                    </div>
                  )}

                  {results.length === 0 && !query.trim() && (
                    <div className="p-8 text-center text-[var(--color-text-secondary)]">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 opacity-30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <p>Tapez pour rechercher</p>
                    </div>
                  )}

                  {results.map((result, idx) => (
                    <motion.button
                      key={`${result.drawer.drawer_id}-${result.layerIndex}-${result.bin?.bin_id || 'drawer'}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSelectResult(result)}
                      className="w-full p-4 hover:bg-[var(--color-bg-secondary)] transition-colors border-b border-[var(--color-border)] last:border-0 text-left flex items-start gap-3"
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === 'drawer'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-blue-500/20 text-blue-500'
                        }`}
                      >
                        {result.type === 'drawer' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                            />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 text-[var(--color-text)]">
                          {result.type === 'drawer' ? result.drawer.name : result.bin?.content.title}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                          <span>{result.drawer.name}</span>
                          {result.type === 'bin' && (
                            <>
                              <span>•</span>
                              <span>Couche {result.layerIndex}</span>
                            </>
                          )}
                        </div>
                        {result.bin?.content.description && (
                          <div className="text-xs text-[var(--color-text-secondary)] line-clamp-1 mt-1">
                            {result.bin.content.description}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg
                        className="w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </motion.button>
                  ))}
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
