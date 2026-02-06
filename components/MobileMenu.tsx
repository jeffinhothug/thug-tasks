import React from 'react';
import { X, MonitorPlay, Bell, LogIn, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    authUserId: string | null;
    isOffline: boolean;
    onManualLogin: () => void;
    onOpenStartupGuide: () => void;
    onTestNotification: () => void;
    onCheckUpdates: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
    isOpen,
    onClose,
    authUserId,
    isOffline,
    onManualLogin,
    onOpenStartupGuide,
    onTestNotification,
    onCheckUpdates
}) => {
    return (
        <>
            {/* Overlay Backdrop */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 left-0 w-3/4 max-w-xs h-full bg-zinc-900 border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/50">
                            <span className="font-bold text-white text-lg">T</span>
                        </div>
                        <span className="font-bold text-zinc-100 italic">Thug Tasks</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-6 overflow-y-auto">

                    {/* Status Section */}
                    <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500 font-mono">STATUS DO SISTEMA</span>
                            {isOffline ? (
                                <WifiOff size={14} className="text-orange-500" />
                            ) : (
                                <Wifi size={14} className="text-green-500" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${authUserId ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm text-zinc-300 font-medium">
                                    {authUserId ? 'Conectado (Cloud)' : 'Desconectado'}
                                </span>
                            </div>
                            {authUserId && (
                                <span className="text-xs text-zinc-600 block pl-4 truncate">ID: {authUserId}</span>
                            )}
                        </div>

                        {!authUserId && (
                            <button
                                onClick={() => { onManualLogin(); onClose(); }}
                                className="mt-3 w-full py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-green-600/30 transition-colors"
                            >
                                <LogIn size={14} /> Tentar Conexão
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <span className="text-xs text-zinc-500 font-mono px-1">FERRAMENTAS</span>

                        <button
                            onClick={() => { onTestNotification(); onClose(); }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800 border border-zinc-800/50"
                        >
                            <div className="p-2 bg-purple-500/10 rounded-md text-purple-400">
                                <Bell size={18} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">Testar Notificações</span>
                                <span className="text-[10px] text-zinc-500">Enviar alerta de teste</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { onOpenStartupGuide(); onClose(); }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800 border border-zinc-800/50"
                        >
                            <div className="p-2 bg-sky-500/10 rounded-md text-sky-400">
                                <MonitorPlay size={18} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">Iniciar c/ Windows</span>
                                <span className="text-[10px] text-zinc-500">Configurar auto-start</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { onCheckUpdates(); onClose(); }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800 border border-zinc-800/50"
                        >
                            <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400">
                                <RefreshCw size={18} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">Buscar Atualizações</span>
                                <span className="text-[10px] text-zinc-500">Forçar recarregamento</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-600 font-mono">v1.5.2</span>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
