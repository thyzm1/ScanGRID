import React, { useState, useMemo } from 'react';
import iconList from '../utils/materialSymbols.json';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const filteredIcons = useMemo(() => {
    const list = searchTerm 
      ? iconList.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()))
      : iconList;
    return list.slice(0, 240);
  }, [searchTerm]);

  const selectedIcon = value && iconList.includes(value) ? value : '';
  const previewIcon = filteredIcons[0] || selectedIcon || 'category';

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Icône (Google Material)
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Retirer
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full h-11 px-3 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="material-symbols-outlined text-xl text-gray-700 dark:text-gray-200">
          {selectedIcon || 'category'}
        </span>
        <span className={`text-sm ${selectedIcon ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
          {selectedIcon || 'Choisir une icône'}
        </span>
        <span className="material-symbols-outlined ml-auto text-gray-500">expand_more</span>
      </button>

      {showPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full sm:w-80">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
            <input
              type="text"
              placeholder="Rechercher une icône..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />

            <div className="h-10 px-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-blue-600 dark:text-blue-400">
                {previewIcon}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                Aperçu: {previewIcon}
              </span>
            </div>
          </div>
          
          <div className="h-72 overflow-y-auto p-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5 custom-scrollbar">
            {filteredIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => {
                  onChange(icon);
                  setShowPicker(false);
                }}
                className={`
                  p-2 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${value === icon ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
                `}
                title={icon}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
                <span className="text-[10px] leading-tight text-center line-clamp-2 break-all">
                  {icon}
                </span>
              </button>
            ))}
            {filteredIcons.length === 0 && (
              <div className="col-span-4 text-center py-4 text-gray-400 text-sm">
                Aucune icône trouvée
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Click outside closer could be added here or handled by parent */}
      {showPicker && (
        <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowPicker(false)} 
        />
      )}
    </div>
  );
};
