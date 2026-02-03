import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface Props {
    message: string;
    type?: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<Props> = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 ${type === 'success'
                ? 'bg-emerald-950/90 border-emerald-900 text-emerald-200'
                : 'bg-red-950/90 border-red-900 text-red-200'
            }`}>
            {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

export default Toast;
