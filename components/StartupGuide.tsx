import React from 'react';
import { X, ExternalLink, Monitor } from 'lucide-react';

interface StartupGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const StartupGuide: React.FC<StartupGuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Monitor size={20} className="text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-100">Iniciar com Windows</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 text-zinc-300 text-sm leading-relaxed">
                    <p>
                        Por limitações de segurança dos navegadores, sites não podem se configurar sozinhos para iniciar com o sistema.
                        <br /><br />
                        Mas você pode configurar isso manualmente em <b>3 passos simples</b>:
                    </p>

                    <ol className="space-y-4 list-decimal list-inside marker:text-purple-500 marker:font-bold">
                        <li className="pl-2">
                            <span className="font-semibold text-white">Instale o App:</span>
                            <br />
                            Caso não tenha instalado, procure o ícone de instalação <span className='inline-block border border-zinc-700 rounded px-1 text-xs'>+</span> ou "Instalar Thug Tasks" na barra de endereço do navegador.
                        </li>

                        <li className="pl-2">
                            <span className="font-semibold text-white">Abra as Configurações do App:</span>
                            <br />
                            Digite <code className="bg-zinc-950 px-2 py-1 rounded text-purple-300 select-all border border-zinc-800">chrome://apps</code> (ou <code>edge://apps</code>) na barra de endereço e dê Enter.
                        </li>

                        <li className="pl-2">
                            <span className="font-semibold text-white">Ative a Inicialização:</span>
                            <br />
                            Clique com o botão direito no ícone do <b>Thug Tasks</b>, escolha <span className="text-white font-medium">"Configurações"</span> e marque a opção <span className="text-green-400 font-medium">"Iniciar app ao fazer login"</span>.
                        </li>
                    </ol>

                    <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 text-xs text-zinc-400 flex gap-2">
                        <ExternalLink size={14} className="shrink-0 mt-0.5" />
                        Isso garante que suas missões estejam prontas assim que você ligar a máquina.
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-2">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-zinc-100 text-zinc-900 font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Entendi, vou configurar!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartupGuide;
