import { Bin } from '../types/api';
import { useStore } from '../store/useStore';
import { IconDisplay } from './IconDisplay';

interface UnplacedDockProps {
  unplacedBins: Bin[];
  onBinClick: (bin: Bin) => void;
  onBinDoubleClick: (bin: Bin) => void;
  onDragStart: (bin: Bin) => void;
}

export default function UnplacedDock({ 
  unplacedBins, 
  onBinClick,
  onBinDoubleClick,
  onDragStart
}: UnplacedDockProps) {
  const { selectedBin, editMode } = useStore();

  if (unplacedBins.length === 0) return null;

  return (
    <div className="w-32 min-[901px]:w-44 lg:w-48 h-full z-10 flex flex-col gap-2">
      <div className="bg-[var(--color-bg)]/95 backdrop-blur-xl rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden flex flex-col pointer-events-auto h-full max-h-[52vh] min-[901px]:max-h-none">
        <div className="p-2.5 min-[901px]:p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xs min-[901px]:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            En attente ({unplacedBins.length})
          </h3>
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
            {editMode === 'edit' ? 'Glisser vers la grille' : 'Passez en mode édition'}
          </p>
        </div>
        
        <div
          className="flex-1 overflow-y-auto p-1.5 min-[901px]:p-2 space-y-1.5 min-[901px]:space-y-2 custom-scrollbar touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {unplacedBins.map((bin) => {
            const isSelected = selectedBin?.bin_id === bin.bin_id;
            
            return (
              <div
                key={bin.bin_id}
                draggable={editMode === 'edit'}
                onDragStart={(e) => {
                  if (editMode !== 'edit') {
                    e.preventDefault();
                    return;
                  }
                  // Set drag data for react-grid-layout dropping
                  e.dataTransfer.setData("text/plain", bin.bin_id);
                  e.dataTransfer.effectAllowed = 'move';
                  onDragStart(bin);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onBinClick(bin);
                }}
                 onDoubleClick={(e) => {
                    e.stopPropagation();
                    onBinDoubleClick(bin);
                }}
                className={`
                  relative p-2.5 min-[901px]:p-3 rounded-lg border transition-all group
                  ${editMode === 'edit' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 ring-1 ring-blue-500 backdrop-blur-sm' 
                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-700 hover:bg-[var(--color-bg-secondary)]/80'
                  }
                `}
              >
                {editMode === 'edit' && (
                  <div className="absolute top-1.5 right-1.5 opacity-70 text-gray-400 pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6h.01M10 12h.01M10 18h.01M14 6h.01M14 12h.01M14 18h.01" />
                    </svg>
                  </div>
                )}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: bin.color || '#3b82f6' }}
                />
                <div className="pl-2">
                  <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                    {bin.content.title}
                  </div>
                  {bin.content.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {bin.content.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <IconDisplay icon={bin.content.icon || 'ri-box-3-line'} />
                      {bin.width_units}×{bin.depth_units}{bin.height_units > 1 ? `×${bin.height_units}` : ''}
                    </span>
                    {bin.content.items && bin.content.items.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {bin.content.items.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
