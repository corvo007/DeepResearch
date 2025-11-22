import React from 'react';
import { HistoryItem } from '../types';
import { X, Trash2, Clock, MessageSquare, ImageIcon, Search } from './Icons';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClear: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  historyItems,
  onSelect,
  onDelete,
  onClear
}) => {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Research History
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <Search size={48} className="opacity-20" />
                <p className="text-sm">No research history yet.</p>
              </div>
            ) : (
              historyItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {item.topic}
                    </h3>
                    <button
                      onClick={(e) => onDelete(item.id, e)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      {item.timelineImage && (
                        <span className="flex items-center gap-1 text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">
                          <ImageIcon size={10} /> Image
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                        <MessageSquare size={10} /> {item.result.articles.length}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {historyItems.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={onClear}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-200 text-slate-500 text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};