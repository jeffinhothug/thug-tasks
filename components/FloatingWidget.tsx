import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskPriority } from '../types';
import { Plus, GripVertical, AlertCircle, X } from 'lucide-react';
import dayjs from 'dayjs';

interface Props {
  tasks: Task[];
  onNewTask: () => void;
}

const FloatingWidget: React.FC<Props> = ({ tasks, onNewTask }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Filter top 5 urgent
  const urgentTasks = tasks
    .filter(t => t.priority === TaskPriority.HIGH)
    .slice(0, 5);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible || urgentTasks.length === 0) return null;

  return (
    <div
      ref={widgetRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      className="fixed z-50 w-64 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-sky-500/20"
    >
      {/* Header / Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="bg-zinc-800 p-2 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider">
          <button
            onClick={() => setIsVisible(false)}
            onMouseDown={(e) => e.stopPropagation()}
            className="mr-1 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <X size={14} />
          </button>
          <AlertCircle size={14} />
          <span>Urgentes ({urgentTasks.length})</span>
        </div>
        <GripVertical size={16} className="text-zinc-500" />
      </div>

      {/* List */}
      <div className="flex-1 max-h-48 overflow-y-auto custom-scrollbar p-1">
        {urgentTasks.map(task => (
          <div key={task.id} className="p-2 border-b border-zinc-800 last:border-0 text-sm hover:bg-zinc-800/50 rounded transition-colors">
            <p className="font-medium text-zinc-200 truncate">{task.title}</p>
            <p className="text-[10px] text-zinc-500">
              Vence {dayjs(task.dueDate).fromNow()}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <button
        onClick={onNewTask}
        className="w-full py-2 bg-sky-900/50 hover:bg-sky-800/50 text-sky-400 text-xs font-semibold uppercase transition-colors flex items-center justify-center gap-1 border-t border-zinc-700"
      >
        <Plus size={14} /> Tarefa Rápida
      </button>
    </div>
  );
};

export default FloatingWidget;