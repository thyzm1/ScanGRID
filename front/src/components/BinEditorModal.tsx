import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Bin, BinContent } from '../types/api';
import { useStore } from '../store/useStore';
import { apiClient } from '../services/api';

import { IconPicker } from './IconPicker';

interface BinEditorModalProps {
  bin: Bin | null;
  onClose: () => void;
  onSave: (updatedBin: Bin) => void;
}

export default function BinEditorModal({ bin, onClose, onSave }: BinEditorModalProps) {
  const { currentDrawer, currentLayerIndex, categories, setCategories } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhoto, setNewPhoto] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [icon, setIcon] = useState('');
  const [widthUnits, setWidthUnits] = useState(1);
  const [depthUnits, setDepthUnits] = useState(1);
  const [heightUnits, setHeightUnits] = useState(1);
  const [isImproving, setIsImproving] = useState(false);
  const [improvementProgress, setImprovementProgress] = useState(0);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Ensure categories are refreshed whenever the bin editor opens.
  useEffect(() => {
    if (!bin) return;

    let cancelled = false;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await apiClient.listCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories for bin editor:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [bin?.bin_id, setCategories]);

  useEffect(() => {
    if (bin) {
      setTitle(bin.content.title || '');
      setDescription(bin.content.description || '');
      setItems(bin.content.items || []);
      setPhotos(bin.content.photos || []);
      setColor(bin.color || '#3b82f6');
      setCategoryId(bin.category_id || null);
      setWidthUnits(bin.width_units || 1);
      setDepthUnits(bin.depth_units || 1);
      setHeightUnits(bin.height_units || 1);
      // If bin.content.icon exists, use it.
      // Note: we need to update types/api.ts to include icon in BinContent if not already there.
      // But assuming it is or allows extra props.
      setIcon((bin.content as any).icon || '');

      if (currentDrawer && currentDrawer.layers[currentLayerIndex]) {
          // If the bin belongs to a specific layer (from bin.layer_id), use that.
          // Otherwise default to current layer.
          // The modal receives 'bin', which might be from 'unplacedBins' or 'currentLayer.bins'.
          // 'unplacedBins' don't have a layer_id usually, or it's not relevant until placed.
          // But here we are editing an existing bin.
          // If we are editing a bin in the dock, we might want to assign it to a layer explicitly?
          // Or just move it.
          // For now, respect the bin's layer if it has one, else current layer.
          setSelectedLayerId(bin.layer_id || currentDrawer.layers[currentLayerIndex].layer_id);
      }
    }
  }, [bin, currentDrawer, currentLayerIndex]);

  if (!bin) return null;

  const handleSave = () => {
    const updatedContent: BinContent = {
      ...bin.content,
      title,
      description,
      items,
      photos,
      icon, 
    };

    onSave({
      ...bin,
      content: updatedContent,
      category_id: categoryId || undefined,
      color,
      width_units: widthUnits,
      depth_units: depthUnits,
      height_units: heightUnits,
      layer_id: selectedLayerId || undefined
    });
    onClose();
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddPhoto = () => {
    if (newPhoto.trim()) {
      setPhotos([...photos, newPhoto.trim()]);
      setNewPhoto('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleImproveDescription = async () => {
    if (!title.trim()) {
      alert('Veuillez d\'abord entrer un titre');
      return;
    }

    setIsImproving(true);
    setImprovementProgress(0);

    // Simuler la progression pendant que l'IA travaille
    const progressInterval = setInterval(() => {
      setImprovementProgress((prev) => {
        if (prev >= 90) return prev; // Ne jamais dépasser 90% avant la vraie réponse
        return prev + Math.random() * 15; // Progression aléatoire réaliste
      });
    }, 300);

    try {
      const itemsText = items.join(', ');
      const result = await apiClient.improveDescription(
        title,
        description || itemsText,
        'Description pour un inventaire de composants électroniques'
      );
      
      // Animation finale jusqu'à 100%
      clearInterval(progressInterval);
      setImprovementProgress(100);
      
      // Attendre un peu pour montrer le 100% avant de masquer
      setTimeout(() => {
        setDescription(result.improved_description);
        setIsImproving(false);
        setImprovementProgress(0);
      }, 400);
      
    } catch (error) {
      clearInterval(progressInterval);
      setImprovementProgress(0);
      console.error('Erreur lors de l\'amélioration:', error);
      alert('Impossible d\'améliorer la description. Vérifiez qu\'Ollama est en cours d\'exécution avec le modèle llama3.2:1b');
      setIsImproving(false);
    }
  };

  const colorPresets = [
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Gris', value: '#6b7280' },
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-100/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[var(--color-border)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: color }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Éditer la boîte</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Position ({bin.x_grid}, {bin.y_grid}) • {widthUnits}×{depthUnits}×{heightUnits} unités
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Title - First */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input w-full text-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ESP32 Dev Boards"
              required
            />
          </div>

          {/* Description - Second */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold">Description</label>
              <button
                type="button"
                onClick={handleImproveDescription}
                disabled={isImproving || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                  bg-gradient-to-r from-purple-500 to-pink-500 text-white
                  hover:from-purple-600 hover:to-pink-600 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-sm hover:shadow-md"
                title="Améliorer la description avec IA (Ollama)"
              >
                {isImproving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Amélioration...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Améliorer avec IA</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Barre de progression */}
            {isImproving && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    🤖 Intelligence artificielle en cours...
                  </span>
                  <span className="text-xs font-mono text-purple-600 dark:text-purple-400">
                    {Math.round(improvementProgress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${improvementProgress}%` }}
                  >
                    <div className="h-full w-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            
            <textarea
              className="input w-full min-h-20 resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cartes de développement avec Wi-Fi/BLE pour projets IoT..."
              disabled={isImproving}
            />
          </div>

          {/* Dimensions - New Section */}
          <div>
            <label className="block text-sm font-semibold mb-3">Dimensions (unités Gridfinity)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Largeur</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="input w-full text-center font-mono"
                  value={widthUnits}
                  onChange={(e) => setWidthUnits(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Profondeur</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="input w-full text-center font-mono"
                  value={depthUnits}
                  onChange={(e) => setDepthUnits(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-1">Hauteur (couches)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="input w-full text-center font-mono"
                  value={heightUnits}
                  onChange={(e) => setHeightUnits(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              💡 Une boîte de hauteur 2 occupera 2 couches verticalement
            </p>
          </div>

           {/* Category & Icon - Third */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-2">Catégorie</label>
              <select
                className="input w-full"
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                disabled={isLoadingCategories}
              >
                <option value="">
                  {isLoadingCategories ? 'Chargement des catégories...' : 'Aucune'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon Picker */}
            <div className="flex-1">
              <IconPicker value={icon} onChange={setIcon} />
            </div>
          </div>

          {/* Items List - Fourth */}
          <div>
            <label className="block text-sm font-semibold mb-2">Articles contenus</label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 bg-[var(--color-bg-secondary)] rounded-lg p-3"
                >
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="flex-1">{item}</span>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  placeholder="3x ESP32-WROOM, 1x ESP32-S3..."
                />
                <button
                  onClick={handleAddItem}
                  className="btn-primary px-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Layer Selection - Fifth (Moved down) */}
          {currentDrawer && (
              <div>
                  <label className="block text-sm font-semibold mb-2">Couche</label>
                  <select
                      className="input w-full"
                      value={selectedLayerId || ''}
                      onChange={(e) => setSelectedLayerId(e.target.value)}
                  >
                      {currentDrawer.layers.map((layer, idx) => (
                          <option key={layer.layer_id} value={layer.layer_id}>
                              Couche {idx + 1} (z-index: {layer.z_index})
                          </option>
                      ))}
                  </select>
              </div>
          )}

          {/* Photos - Sixth */}
          <div>
            <label className="block text-sm font-semibold mb-2">Photos (URLs)</label>
            <div className="space-y-3">
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] p-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="flex-1 text-sm break-all text-[var(--color-text-secondary)]">
                      {photo}
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
              <div className="flex gap-2">
                <input
                  type="url"
                  className="input flex-1"
                  value={newPhoto}
                  onChange={(e) => setNewPhoto(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPhoto()}
                  placeholder="https://example.com/photo.jpg"
                />
                <button
                  onClick={handleAddPhoto}
                  className="btn-primary px-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold mb-2">Couleur</label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setColor(preset.value)}
                  className={`
                    h-12 rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105
                    ${color === preset.value ? 'ring-4 ring-offset-2 ring-blue-500' : ''}
                  `}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="input flex-1 font-mono"
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3 bg-[var(--color-bg-secondary)]/30 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-secondary)] transition-all shadow-sm hover:shadow-md"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className={`
              px-5 py-2.5 rounded-xl font-medium text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2
              ${!title.trim() ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
