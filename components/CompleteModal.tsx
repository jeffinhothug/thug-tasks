import React, { useState } from 'react';
import { Task } from '../types';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, note: string, createFollowUp: boolean) => Promise<void>;
}

const CompleteModal: React.FC<Props> = ({ task, isOpen, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!task) return;
    setLoading(true);
    await onConfirm(task.id, note, createFollowUp);
    setLoading(false);
    setNote('');
    setCreateFollowUp(false);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-sky-500/30 rounded-2xl shadow-2xl p-6 text-center">
        
        <div className="mx-auto w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center mb-4 text-sky-500">
          <CheckCircle size={24} />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Tarefa Concluída!</h3>
        <p className="text-zinc-400 text-sm mb-6 truncate px-4">"{task.title}"</p>

        <div className="text-left space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">Nota de Conclusão</label>
            <input
              type="text"
              placeholder="Como foi?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${createFollowUp ? 'bg-sky-600 border-sky-600' : 'border-zinc-600'}`}>
              {createFollowUp && <CheckCircle size={12} className="text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={createFollowUp} 
              onChange={(e) => setCreateFollowUp(e.target.checked)} 
            />
            <div className="text-left">
              <span className="block text-sm font-medium text-zinc-200">Criar Seguimento</span>
              <span className="block text-[10px] text-zinc-500">Abre novo formulário imediatamente</span>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-zinc-500 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Processando...' : 'Concluir'} <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default CompleteModal;