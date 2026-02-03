import React from 'react';
import { Task, TaskPriority } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pin, Calendar, Check } from 'lucide-react';

dayjs.extend(relativeTime);

interface Props {
  task: Task;
  onComplete: (task: Task) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<Props> = ({ task, onComplete, onPin, onEdit }) => {

  const priorityColors = {
    [TaskPriority.HIGH]: 'border-red-500/50 hover:border-red-500 shadow-red-900/10',
    [TaskPriority.MEDIUM]: 'border-yellow-500/50 hover:border-yellow-500 shadow-yellow-900/10',
    [TaskPriority.LOW]: 'border-blue-500/50 hover:border-blue-500 shadow-blue-900/10'
  };

  const priorityBadge = {
    [TaskPriority.HIGH]: 'text-red-400 bg-red-400/10',
    [TaskPriority.MEDIUM]: 'text-yellow-400 bg-yellow-400/10',
    [TaskPriority.LOW]: 'text-blue-400 bg-blue-400/10'
  };

  // Force re-render every minute to update relative time
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      onClick={() => onEdit(task)}
      className={`group relative bg-surface border ${priorityColors[task.priority]} rounded-xl p-4 transition-all duration-300 hover:shadow-lg flex flex-col justify-between h-full cursor-pointer hover:scale-[1.02]`}
    >

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>
          {task.priority === TaskPriority.HIGH ? 'ALTA' : task.priority === TaskPriority.MEDIUM ? 'MÉDIA' : 'BAIXA'}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onPin(task.id, !task.isPinned); }}
          aria-label={task.isPinned ? "Desafixar tarefa" : "Fixar tarefa"}
          className={`transition-colors ${task.isPinned ? 'text-sky-400 opacity-100' : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-300'}`}
        >
          <Pin size={16} className={task.isPinned ? 'fill-sky-400' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4 flex-1">
        <h3 className="text-zinc-100 font-semibold mb-1 leading-snug">{task.title}</h3>
        {task.description && (
          <p className="text-zinc-500 text-sm line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-1 text-zinc-500 text-xs">
          <Calendar size={12} />
          <span>{dayjs(task.dueDate).format('D MMM')}</span>
          <span className="text-zinc-700">•</span>
          <span className={task.priority === TaskPriority.HIGH ? 'text-red-400 font-medium' : ''}>
            {dayjs(task.dueDate).fromNow(true)} restantes
          </span>
          {task.reminderTime && (
            <span className="ml-2 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 flex items-center gap-1">
              {dayjs(task.reminderTime).format('HH:mm')}
            </span>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onComplete(task); }}
          aria-label="Concluir tarefa"
          className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-sky-500 hover:border-sky-500 hover:text-white transition-all transform hover:scale-110"
          title="Concluir Tarefa"
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;