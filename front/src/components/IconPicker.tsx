import React, { useState, useMemo } from 'react';
import iconList from '../utils/materialSymbols.json';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    const list = searchTerm 
      ? iconList.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()))
      : iconList;
    return list.slice(0, 200); // Limit to 200 for performance
  }, [searchTerm]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Icône</label>
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
      
      <div className="flex gap-2">
        {/* Helper Button to Toggle Picker */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center min-w-[3rem] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {value ? (
            <span className="material-symbols-outlined text-2xl">{value}</span>
          ) : (
            <span className="text-sm text-gray-500">Choisir</span>
          )}
        </button>
        
        {/* Direct Input (optional for quick entry if user knows the name) */}
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="nom de l'icône"
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      {showPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full sm:w-80">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Rechercher une icône..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          
          <div className="h-64 overflow-y-auto p-2 grid grid-cols-5 gap-1 custom-scrollbar">
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
              </button>
            ))}
            {filteredIcons.length === 0 && (
                <div className="col-span-5 text-center py-4 text-gray-400 text-sm">
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
