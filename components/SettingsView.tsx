import React, { useState, useEffect } from 'react';
import {
    Bell,
    RefreshCw,
    Monitor,
    Settings as SettingsIcon,
    CheckCircle2,
    Download,
    Send,
    Info,
    Zap
} from 'lucide-react';
import { requestNotificationPermission, sendBroadcastNotification } from '../services/messaging';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

interface NotificationSettings {
    system: boolean;
    tasks: boolean;
    engagement: boolean;
    sounds: boolean;
}

interface SettingsViewProps {
    version: string;
    userId: string;
    onTestNotification: () => void;
    onCheckUpdates: () => void;
    onOpenStartupGuide: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    version,
    userId,
    onTestNotification,
    onCheckUpdates,
    onOpenStartupGuide,
}) => {
    const [isDesktop, setIsDesktop] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        system: true,
        tasks: true,
        engagement: true,
        sounds: true
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    useEffect(() => {
        // Detectar se é desktop
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 768 && !('ontouchstart' in window));
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);

        // Escutar configurações do Firestore
        const unsubSettings = onSnapshot(doc(db, "users", userId), (docSnap) => {
            if (docSnap.exists() && docSnap.data().notificationSettings) {
                setSettings(docSnap.data().notificationSettings);
            }
            setIsLoadingSettings(false);
        });

        // Capturar prompt de instalação PWA
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('resize', checkDesktop);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleEnableNotifications = async () => {
        const token = await requestNotificationPermission(userId);
        if (token) {
            setNotificationPermission('granted');
        } else {
            setNotificationPermission(Notification.permission);
        }
    };

    const handleBroadcastTest = async () => {
        unlockAudio(); // Desbloqueia áudio no mobile
        if (isBroadcasting) return;
        setIsBroadcasting(true);
        const success = await sendBroadcastNotification(
            "🚀 Alerta Geral: Thug Style",
            "Este é um disparo de broadcast para todos os dispositivos conectados! 🔥",
            userId,
            "system"
        );
        setTimeout(() => setIsBroadcasting(false), 2000);
    };

    const unlockAudio = () => {
        // Toca um som ultra-curto e silencioso para desbloquear o contexto de áudio em browsers mobile
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhAAQACABAAAABkYXRhAgAAAAEA');
        audio.play().catch(() => {});
    };

    const toggleSetting = async (key: keyof NotificationSettings) => {
        unlockAudio(); // Desbloqueia áudio para futuras notificações
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // UI instantânea
        
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                notificationSettings: newSettings
            });
        } catch (error) {
            console.error("Erro ao salvar configuração:", error);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                        <SettingsIcon className="text-sky-400" size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-100 italic tracking-tight">Configurações</h2>
                </div>
                <p className="text-zinc-500 text-sm">Gerencie notificações, atualizações e status do sistema.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card: Notificações */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col h-full hover:border-zinc-700 transition-colors group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                Notificações
                            </h3>
                            <p className="text-xs text-zinc-500">Receba alertas nativos no PC e Celular</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                            <Bell size={20} />
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-zinc-800/50">
                        <div className="flex gap-3">
                            <Info size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                                <p className="text-zinc-300 mb-1">
                                    <span className="font-bold">PC:</span> Alertas fixos na tela até fechar.
                                </p>
                                <p className="text-zinc-300">
                                    <span className="font-bold">Mobile:</span> Vibração e som na barra de status.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                        <div className="flex gap-3">
                            <div className={`flex-1 ${notificationPermission === 'granted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'} rounded-xl flex items-center justify-center p-3 border`}>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {notificationPermission === 'granted' ? 'Conectado' : 'Inativo'}
                                </span>
                            </div>
                            {notificationPermission !== 'granted' ? (
                                <button
                                    onClick={handleEnableNotifications}
                                    className="flex-[1.5] bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-900/20"
                                >
                                    <Bell size={16} />
                                    Ativar
                                </button>
                            ) : (
                                <button
                                    onClick={() => { unlockAudio(); onTestNotification(); }}
                                    className="flex-[1.5] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-zinc-700/50"
                                >
                                    <Send size={16} />
                                    Teste Simples
                                </button>
                            )}
                        </div>
                        
                    {notificationPermission === 'granted' && (
                        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Preferências Globais (Sincronizado)</h4>
                            
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                    onClick={() => toggleSetting('system')}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.system ? 'bg-zinc-800/50 border-sky-500/30 text-sky-400' : 'bg-black/20 border-zinc-800 text-zinc-500 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                        <Info size={14} /> Sistema
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.system ? 'bg-sky-500' : 'bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.system ? 'right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => toggleSetting('tasks')}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.tasks ? 'bg-zinc-800/50 border-emerald-500/30 text-emerald-400' : 'bg-black/20 border-zinc-800 text-zinc-500 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                        <Zap size={14} /> Tarefas
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.tasks ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.tasks ? 'right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => toggleSetting('engagement')}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.engagement ? 'bg-zinc-800/50 border-purple-500/30 text-purple-400' : 'bg-black/20 border-zinc-800 text-zinc-500 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                        <Monitor size={14} /> Relatórios
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.engagement ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.engagement ? 'right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => toggleSetting('sounds')}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.sounds ? 'bg-zinc-800/50 border-yellow-500/30 text-yellow-400' : 'bg-black/20 border-zinc-800 text-zinc-500 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3 text-xs font-bold">
                                        <Bell size={14} /> Sons Premium
                                    </div>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.sounds ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.sounds ? 'right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={handleBroadcastTest}
                                disabled={isBroadcasting}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/40 disabled:opacity-50 mt-2"
                            >
                                <Zap size={18} className={isBroadcasting ? "animate-pulse text-yellow-400" : "text-yellow-400"} />
                                {isBroadcasting ? "Propagando Sinal..." : "Teste Geral (Broadcast)"}
                            </button>
                        </div>
                    )}
                    </div>
                </div>

                {/* Card: Atualização e Instalação */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col h-full hover:border-zinc-700 transition-colors group text-zinc-200">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold text-zinc-100">Atualização e Instalação</h3>
                            <p className="text-xs text-zinc-500 font-mono">Versão instalada: {version}</p>
                        </div>
                        <div className="p-3 bg-sky-500/10 rounded-full text-sky-400">
                            <RefreshCw size={20} />
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-zinc-800/50 flex items-center justify-between">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Status PWA</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                            <CheckCircle2 size={12} />
                            VERSÃO MAIS RECENTE
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button
                            onClick={handleInstallClick}
                            disabled={!deferredPrompt}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                        >
                            <Download size={18} />
                            Instalar App no Dispositivo
                        </button>
                        <button
                            onClick={onCheckUpdates}
                            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-900/20"
                        >
                            <RefreshCw size={18} />
                            Buscar Atualização (Thug Standard)
                        </button>
                    </div>

                    <p className="mt-4 text-[9px] text-zinc-600 text-center leading-tight">
                        Se o botão de instalar não funcionar, use o menu do navegador "Adicionar à Tela Inicial".
                    </p>
                </div>

                {/* Card: Ferramentas (Windows Only) */}
                {isDesktop && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col h-full hover:border-zinc-700 transition-colors group col-span-1 md:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl font-bold text-zinc-100">Configurações de Desktop</h3>
                                <p className="text-xs text-zinc-500">Otimizações exclusivas para PC</p>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                                <Monitor size={20} />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={onOpenStartupGuide}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-zinc-700/50"
                            >
                                <Monitor size={20} className="text-purple-400" />
                                Configurar Início com o Windows
                            </button>
                            <div className="flex-1 p-4 rounded-2xl bg-black/20 border border-zinc-800/50 flex items-center gap-3">
                                <Info size={16} className="text-zinc-600" />
                                <p className="text-[10px] text-zinc-500">
                                    Ideal para garantir que você nunca esqueça suas missões ao ligar o computador.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <footer className="pt-8 text-center">
                <div className="inline-block p-1 px-3 bg-zinc-900 border border-zinc-800 rounded-full">
                    <p className="text-[10px] font-mono text-zinc-400">
                        System Identity: <span className="text-zinc-200">Thug Tasks v{version}</span> | Status: <span className="text-emerald-400">ACTIVE</span>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default SettingsView;
