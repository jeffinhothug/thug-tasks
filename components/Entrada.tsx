import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import { APP_VERSION } from '../src/constants';


interface EntradaProps {
    onAuthenticated: (uid: string) => void;
}

const Entrada: React.FC<EntradaProps> = ({ onAuthenticated }) => {
    const [senha, setSenha] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            // E-mail fixo conforme solicitado
            const email = 'master@thugtasks.com';
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            onAuthenticated(userCredential.user.uid);
        } catch (err: any) {
            console.error(err);
            setError('Acesso negado. Senha mestre incorreta.');

            // Feedback tátil de erro se disponível
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 50, 50]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans selection:bg-zinc-800 selection:text-white">
            {/* Decoração de fundo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-900/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                        <Logo size={80} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-1 italic">Thug Tasks</h1>
                    <p className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] uppercase">Missions & Discipline</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo de usuário oculto para que o navegador (Chrome/Google) reconheça e peça para salvar a senha */}
                    <input
                        type="email"
                        name="username"
                        value="master@thugtasks.com"
                        readOnly
                        className="hidden"
                        autoComplete="username"
                    />

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <ShieldCheck size={18} className="text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                        </div>
                        <input
                            type={showSenha ? "text" : "password"}
                            name="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Senha Mestra"
                            required
                            autoFocus
                            autoComplete="current-password"
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-11 pr-12 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all duration-300"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSenha(!showSenha)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs text-center font-medium animate-in fade-in zoom-in-95">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !senha}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-xl"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                Entrar
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <footer className="mt-12 text-center">
                    <p className="text-[10px] font-mono text-zinc-800 tracking-widest uppercase">System Lockdown v{APP_VERSION}</p>

                </footer>
            </div>
        </div>
    );
};

export default Entrada;
