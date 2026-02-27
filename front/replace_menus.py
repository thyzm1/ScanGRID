import os

file_path = "/Users/mathisdupont/ScanGRID/front/src/components/GridEditor3.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update LayerSelector container top position to fix responsive overlap
old_layer_container = "className={`absolute ${editMode === 'edit' ? 'top-[6.2rem]' : 'top-[4.8rem]'} left-1/2 -translate-x-1/2 min-[1024px]:top-4 min-[1024px]:left-4 min-[1024px]:translate-x-0 z-20 flex flex-col gap-2 max-[430px]:gap-1.5 pointer-events-none w-[calc(100%-0.75rem)] max-w-[calc(100%-0.75rem)] min-[431px]:w-[calc(100%-1rem)] min-[431px]:max-w-[calc(100%-1rem)] min-[1024px]:w-auto min-[1024px]:max-w-none`}"
new_layer_container = "className={`absolute bottom-[5rem] left-1/2 -translate-x-1/2 min-[1024px]:bottom-auto min-[1024px]:top-4 min-[1024px]:left-4 min-[1024px]:translate-x-0 z-20 flex flex-col gap-2 max-[430px]:gap-1.5 pointer-events-none w-[calc(100%-0.75rem)] max-w-[calc(100%-0.75rem)] min-[431px]:w-[calc(100%-1rem)] min-[431px]:max-w-[calc(100%-1rem)] min-[1024px]:w-auto min-[1024px]:max-w-none`}"

content = content.replace(old_layer_container, new_layer_container)


# 2. Update renderBin Edit Controls to be a beautiful overlay

edit_controls_old = """          {/* Edit Controls */}
          {editMode === 'edit' && isFromCurrentLayer && (
            <>
              {/* Delete - Top Right */}
              <div className="absolute top-0 right-0 p-1 z-50">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer cette boîte ?')) {
                      handleDeleteBin(bin.bin_id);
                    }
                  }}
                  className="cancel-drag p-1 bg-red-500 text-white rounded-bl-lg rounded-tr-sm shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                  title="Supprimer (Del)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Copy & Dock - Bottom Left */}
              <div className="absolute bottom-0 left-0 flex gap-1 p-1 z-50">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(bin);
                  }}
                  className="cancel-drag p-1 bg-blue-500 text-white rounded-full transition-opacity shadow-md transform hover:scale-110 cursor-pointer"
                  title="Copier (Ctrl+C)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToDock(bin.bin_id);
                  }}
                  className="cancel-drag p-1 bg-yellow-500 text-white rounded-full transition-opacity shadow-md transform hover:scale-110 cursor-pointer"
                  title="Déplacer vers la zone d'attente"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>
            </>
          )}"""

edit_controls_new = """          {/* Edit Controls (Menus temporaires) */}
          {editMode === 'edit' && isFromCurrentLayer && isSelected && (
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center gap-3">
                 {/* Delete */}
                 <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer cette boîte ?')) {
                      handleDeleteBin(bin.bin_id);
                    }
                  }}
                  className="cancel-drag p-2 sm:p-2.5 bg-red-500 text-white rounded-full shadow hover:scale-110 hover:bg-red-600 transition-all cursor-pointer"
                  title="Supprimer (Del)"
                 >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 </button>
                 
                 {/* Copy */}
                 <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(bin);
                    setSelectedBin(null); // Optional: deselect after copy to remove overlay
                  }}
                  className="cancel-drag p-2 sm:p-2.5 bg-blue-500 text-white rounded-full shadow hover:scale-110 hover:bg-blue-600 transition-all cursor-pointer"
                  title="Copier (Ctrl+C)"
                 >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                 </button>
                 
                 {/* Dock */}
                 <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToDock(bin.bin_id);
                  }}
                  className="cancel-drag p-2 sm:p-2.5 bg-yellow-500 text-white rounded-full shadow hover:scale-110 hover:bg-yellow-600 transition-all cursor-pointer"
                  title="Mettre en zone d'attente (Unplaced Dock)"
                 >
                   <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                   </svg>
                 </button>
             </div>
          )}"""

content = content.replace(edit_controls_old, edit_controls_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
