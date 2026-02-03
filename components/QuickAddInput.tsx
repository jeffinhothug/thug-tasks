import React, { useState } from 'react';
import { Plus, CornerDownLeft } from 'lucide-react';
import dayjs from 'dayjs';

interface Props {
    onAdd: (title: string, dueDate: string) => Promise<void>;
}

const QuickAddInput: React.FC<Props> = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || loading) return;

        setLoading(true);
        try {
            // Default: Due tomorrow (High Priority context)
            const tomorrow = dayjs().add(1, 'day').toISOString();
            await onAdd(title, tomorrow);
            setTitle('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 relative group">
            <div className={`absolute inset-y-0 left-4 flex items-center transition-colors ${loading ? 'text-sky-500' : 'text-zinc-500 group-focus-within:text-sky-400'}`}>
                <Plus size={20} className={loading ? 'animate-spin' : ''} />
            </div>

            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                placeholder="Adicionar nova missão rápida..."
                className="w-full bg-surface border border-zinc-800 rounded-xl py-4 pl-12 pr-12 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:bg-surfaceHover transition-all shadow-lg shadow-black/20"
            />

            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="text-xs font-mono text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5 bg-zinc-900/50 opacity-0 group-focus-within:opacity-100 transition-opacity flex items-center gap-1">
                    ENTER <CornerDownLeft size={10} />
                </span>
            </div>
        </form>
    );
};

export default QuickAddInput;
