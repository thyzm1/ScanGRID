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
    <div className="absolute right-4 top-20 bottom-20 w-48 z-10 flex flex-col gap-2 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col pointer-events-auto h-full max-h-[70vh]">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            En attente ({unplacedBins.length})
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
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
                  relative p-3 rounded-lg border transition-all cursor-move group
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                  }
                `}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: bin.color || '#3b82f6' }}
                />
                <div className="pl-2">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
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
                      {bin.width_units}x{bin.depth_units}
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
