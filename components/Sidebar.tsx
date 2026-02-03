import React from 'react';
import { LayoutList, CheckSquare, Plus, Search } from 'lucide-react';

interface Props {
  activeTab: 'pending' | 'completed';
  setActiveTab: (tab: 'pending' | 'completed') => void;
  onNewTask: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isOffline?: boolean;
}

const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, onNewTask, searchTerm, setSearchTerm, isOffline }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-zinc-950/90 border-t border-zinc-800 flex flex-row items-center justify-around z-40 backdrop-blur-xl md:w-64 md:h-screen md:bg-black/50 md:border-t-0 md:border-r md:flex-col md:justify-start md:items-stretch md:static md:z-20">

      {/* Brand - Hidden on Mobile, Visible Desktop */}
      <div className="hidden md:flex h-16 items-center justify-start px-6 border-b border-zinc-800 relative">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/50">
          <span className="font-bold text-white text-lg">T</span>
        </div>
        <span className="ml-3 font-bold text-zinc-100 tracking-tight">THUG TASKS</span>
        {isOffline && (
          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Modo Offline (Sem Sincronização)" />
        )}
      </div>

      {/* New Task Button - Central FAB on Mobile, Top Button on Desktop */}
      <div className="order-2 md:order-none md:p-4 -mt-8 md:mt-0">
        <button
          onClick={onNewTask}
          aria-label="Nova Tarefa"
          className="w-14 h-14 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-900/40 flex items-center justify-center transition-transform active:scale-95 md:w-full md:h-auto md:bg-sky-600 md:hover:bg-sky-500 md:p-3 md:rounded-xl md:shadow-sky-900/20 md:justify-start md:gap-3"
        >
          <Plus size={24} className="md:w-5 md:h-5" />
          <span className="hidden md:block font-semibold">Nova Tarefa</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-row items-center justify-around md:flex-col md:justify-start md:px-2 md:py-4 md:space-y-2 order-1 md:order-none w-full md:w-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors md:flex-row md:justify-start md:gap-3 md:p-3 md:w-full ${activeTab === 'pending' ? 'text-sky-500 md:bg-zinc-800 md:text-white' : 'text-zinc-500 hover:text-zinc-300 md:hover:bg-zinc-900'
            }`}
        >
          <LayoutList size={22} className="md:w-5 md:h-5" />
          <span className="text-[10px] md:text-base font-medium md:font-medium">Pendentes</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors md:flex-row md:justify-start md:gap-3 md:p-3 md:w-full ${activeTab === 'completed' ? 'text-sky-500 md:bg-zinc-800 md:text-white' : 'text-zinc-500 hover:text-zinc-300 md:hover:bg-zinc-900'
            }`}
        >
          <CheckSquare size={22} className="md:w-5 md:h-5" />
          <span className="text-[10px] md:text-base font-medium md:font-medium">Concluídas</span>
        </button>
      </nav>

      {/* Search - Only visible on desktop here */}
      <div className="hidden md:block p-4 border-t border-zinc-800 mt-auto">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
        {isOffline && (
          <div className="text-xs text-orange-500 font-medium text-center bg-orange-500/10 py-1 px-2 rounded border border-orange-500/20">
            ⚠️ Offline / Não Sincronizado
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;