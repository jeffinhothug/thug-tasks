import React, { useState, useEffect } from 'react';
import { NewTaskInput } from '../types';
import { X, Calendar, Pin, Clock } from 'lucide-react';
import dayjs from 'dayjs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskInput) => Promise<void>;
  initialData?: Partial<NewTaskInput>;
}

const TaskForm: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [hasTime, setHasTime] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      // Default due date: tomorrow
      setDueDate(initialData?.dueDate ? dayjs(initialData.dueDate).format('YYYY-MM-DD') : dayjs().add(1, 'day').format('YYYY-MM-DD'));
      setIsPinned(initialData?.isPinned || false);

      if (initialData?.reminderTime) {
        setHasTime(true);
        setReminderTime(dayjs(initialData.reminderTime).format('HH:mm'));
      } else {
        setHasTime(false);
        setReminderTime('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    setLoading(true);
    try {
      let finalReminder = undefined;
      if (hasTime && reminderTime) {
        // Combine due date with reminder time
        finalReminder = dayjs(`${dueDate}T${reminderTime}`).toISOString();
      }

      await onSubmit({
        title,
        description,
        dueDate: dayjs(dueDate).toISOString(), // Keep due date pure
        reminderTime: finalReminder,
        isPinned
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <form onSubmit={handleSubmit}>

          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-100">
              {initialData?.title ? 'Editar Tarefa' : 'Nova Missão'}
            </h2>
            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Título</label>
              <input
                type="text"
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors placeholder-zinc-700"
                placeholder="O que precisa ser feito?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Detalhes (Opcional)</label>
              <textarea
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors placeholder-zinc-700 resize-none"
                placeholder="Adicione contexto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Prazo
                </label>
                <input
                  type="date"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors [color-scheme:dark]"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              {/* Time / Reminder */}
              <div>
                <div className="flex items-center justify-between mb-1 h-4">
                  <label className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
                    <Clock size={12} /> Hora
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasTime(!hasTime)}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded transition-colors ${hasTime ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {hasTime ? 'ON' : 'OFF'}
                  </button>
                </div>
                {hasTime ? (
                  <input
                    type="time"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors [color-scheme:dark]"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                ) : (
                  <div className="w-full bg-zinc-900/20 border border-zinc-800/50 rounded-lg p-3 text-zinc-600 text-sm italic select-none">
                    Sem horário fixo
                  </div>
                )}
              </div>

              {/* Pin */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${isPinned
                      ? 'bg-zinc-800 border-sky-500 text-sky-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                >
                  <Pin size={16} className={isPinned ? 'fill-sky-400' : ''} />
                  <span className="text-sm font-medium">{isPinned ? 'Fixado' : 'Fixar'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-sky-900/20 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskForm;