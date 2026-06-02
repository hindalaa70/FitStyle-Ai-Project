import React from 'react';
import { X, Check } from 'lucide-react';

/**
 * Slide-out drawer component for product swaps
 * @param {boolean} isOpen - Whether drawer is open
 * @param {string} category - Category being swapped (Top, Bottom, etc.)
 * @param {Array<object>} items - List of matching product options
 * @param {object} selectedItem - Currently active garment in the outfit
 * @param {function} onSelect - Action when an alternative garment is selected
 * @param {function} onClose - Close drawer callback
 */
const SwapDrawer = ({ isOpen, category, items, selectedItem, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
      ></div>

      {/* Sliding Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-[#0e1013] border-l border-dark-border z-50 shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
        {/* Header */}
        <div className="p-5 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-outfit font-bold text-white">
            Swap {category} Alternatives
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white glass-panel border-dark-border hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-dark-muted font-inter text-sm">
              No alternative items found in this category.
            </div>
          ) : (
            items.map((item) => {
              const isCurrent = selectedItem && selectedItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !isCurrent && onSelect(item)}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-gold bg-gold-light/10 pointer-events-none'
                      : 'border-dark-border bg-[#131518]/50 hover:bg-[#131518]/85 hover:border-white/10'
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded-lg border border-dark-border shrink-0 bg-dark-bg"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-outfit font-semibold text-white text-sm truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-xs text-gold font-semibold font-inter mt-1">
                      ${parseFloat(item.price).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-dark-muted font-inter mt-1 truncate">
                      Sizes: {Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="bg-gold-light border border-gold/25 text-gold text-[10px] uppercase font-bold tracking-wider py-1 px-2.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default SwapDrawer;
