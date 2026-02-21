import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Bin, BinContent } from '../types/api';

interface BinEditorModalProps {
  bin: Bin | null;
  onClose: () => void;
  onSave: (updatedBin: Bin) => void;
}

export default function BinEditorModal({ bin, onClose, onSave }: BinEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhoto, setNewPhoto] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    if (bin) {
      setTitle(bin.content.title || '');
      setDescription(bin.content.description || '');
      setItems(bin.content.items || []);
      setPhotos(bin.content.photos || []);
      setColor(bin.color || '#3b82f6');
    }
  }, [bin]);

  if (!bin) return null;

  const handleSave = () => {
    const updatedContent: BinContent = {
      title,
      description,
      items,
      photos,
    };

    onSave({
      ...bin,
      content: updatedContent,
      color,
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg)] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
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
                Position ({bin.x_grid}, {bin.y_grid}) • {bin.width_units}×{bin.depth_units} unités
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
          {/* Title */}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              className="input w-full min-h-20 resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cartes de développement avec Wi-Fi/BLE pour projets IoT..."
            />
          </div>

          {/* Items List */}
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

          {/* Photos */}
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
