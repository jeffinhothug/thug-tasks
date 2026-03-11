import React, { useState, useEffect } from 'react';
import { signOut } from "firebase/auth";
import Sidebar from './components/Sidebar';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import CompleteModal from './components/CompleteModal';
import QuickAddInput from './components/QuickAddInput';
import StartupGuide from './components/StartupGuide';
import MobileMenu from './components/MobileMenu';
import Entrada from './components/Entrada';
import SettingsView from './components/SettingsView';
import NotificationMonitor from './components/NotificationMonitor';
import { APP_VERSION } from './src/constants';
import { useRegisterSW } from 'virtual:pwa-register/react';

import {
  subscribeToPendingTasks,
  subscribeToCompletedTasks,
  addTask,
  completeTask,
  updateTask,
  groupTasksByDate,
  recalculateAllPriorities,
  cleanupOldTasks,
  deleteTask
} from './services/taskLogic';
import { auth } from './services/firebase';
import { requestNotificationPermission, sendBroadcastNotification } from './services/messaging';
import { Task, NewTaskInput, TaskPriority } from './types';
import { Search, Info, Menu } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import Toast from './components/Toast';

// Configuração global do idioma
dayjs.locale('pt-br');

const App: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'settings'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado dos Dados
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  // Estado da UI
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<NewTaskInput>>({});
  const [completeModalTask, setCompleteModalTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isStartupGuideOpen, setIsStartupGuideOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // PWA Update Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const handleCheckForUpdates = () => {
    if (needRefresh) {
      updateServiceWorker(true);
    } else {
      // Força uma verificação manual se o navegador suportar
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update().then(() => {
              showToast("Verificando atualizações...");
            });
          }
        });
      } else {
        showToast("Verificando atualizações...");
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleManualLogin = () => {
    // Agora o login é feito via componente Entrada
    setAuthUserId(null);
  };


  // Inicialização
  useEffect(() => {
    // 0. Monitor de Autenticação
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthUserId(user.uid);
        // Solicita permissão e salva token se houver usuário
        requestNotificationPermission(user.uid);
      } else {
        setAuthUserId(null);
      }
    });

    // 1. Inscrição nos dados
    const unsubscribePending = subscribeToPendingTasks(
      (tasks, isOffline) => {
        setPendingTasks(tasks);
        setIsOffline(isOffline);
      },
      (error) => showToast(`Erro Crítico de Conexão: ${error.message}`, 'error')
    );
    const unsubscribeCompleted = subscribeToCompletedTasks(setCompletedTasks);

    // 2. Executar manutenção
    const initMaintenance = async () => {
      await recalculateAllPriorities();
      await cleanupOldTasks();

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    initMaintenance();

    return () => {
      unsubscribeAuth();
      unsubscribePending();
      unsubscribeCompleted();
    };
  }, []);


  // Auxiliar de Notificação
  const sendNotification = async (title: string, options?: NotificationOptions) => {
    try {
      if (!('Notification' in window)) {
        return;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }

      const enhancedOptions = {
        icon: '/icon.svg',
        badge: '/icon.svg', // Pequeno ícone na barra (Android)
        vibrate: [200, 100, 200], // Vibrar: Tumm-tumm
        requireInteraction: true, // No PC, a notificação fica até clicar (Windows Toast persistente)
        ...options
      } as NotificationOptions;

      // Tenta usar ServiceWorker para notificações ricas (Mobile/Barra de Status)
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, enhancedOptions);
      } else {
        // Fallback para API clássica (PC sem SW)
        new Notification(title, enhancedOptions);
      }
    } catch (err) {
      // Falha silenciosa ou log de produção se necessário
      new Notification(title, options);
    }
  };

  const handleTestNotification = () => {
    sendNotification("Thug Tasks: Teste", {
      body: "Se você viu isso, suas notificações estão funcionando! 🔥",
      tag: "test-notification"
    });
  };

  // Hook de Verificação de Domínio e Notificações
  useEffect(() => {
    // 1. Verificar se está no domínio correto (Evita versões antigas/links errados)
    const currentHost = window.location.hostname;
    const officialHost = 'thug-tasks-jeffinho.web.app';
    const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';

    if (!isLocal && currentHost !== officialHost) {
      showToast(`⚠️ Você pode estar em um link antigo! O oficial é: ${officialHost}`, "error");
    }

    // 2. Permissão de Notificação
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const checkNotifications = () => {
      // ... resto do código igual ...
      const now = dayjs();
      const hour = now.hour();
      const minute = now.minute();

      // 1. Lembretes de Tarefas Agendadas
      pendingTasks.forEach(task => {
        if (task.isCompleted) return;

        let shouldNotify = false;
        let message = '';
        const notifiedKey = `notified-${task.id}-${now.format('YYYY-MM-DD-HH')}`;

        if (localStorage.getItem(notifiedKey)) return;

        if (task.reminderTime) {
          const reminder = dayjs(task.reminderTime);
          const diffInMinutes = reminder.diff(now, 'minute');

          // Notifica se faltar entre 0 e 15 min
          if (diffInMinutes >= 0 && diffInMinutes <= 15) {
            shouldNotify = true;
            message = `⏰ Daqui a pouco: "${task.title}"`;
          }
        } else if (task.dueDate) {
          const dueDate = dayjs(task.dueDate);
          // Notifica às 08:00 se for pro dia
          if (dueDate.isSame(now, 'day') && hour === 8 && minute < 15) {
            shouldNotify = true;
            message = `📅 Missão de Hoje: "${task.title}"`;
          }
        }

        if (shouldNotify) {
          sendBroadcastNotification('Thug Tasks Alert', message, authUserId!, 'task');
          localStorage.setItem(notifiedKey, 'true');
        }
      });

      // 2. Lembrete de Engajamento Noturno (20h)
      // Verifica se é entre 20:00 e 20:59
      if (hour === 20) {
        const engagementKey = `engagement-${now.format('YYYY-MM-DD')}`;
        if (!localStorage.getItem(engagementKey)) {
          let title = '';
          let body = '';

          if (pendingTasks.length > 0) {
            title = '⚠️ Revisão Noturna';
            body = `Você tem ${pendingTasks.length} missões pendentes. Vai encerrar o dia assim?`;
          } else {
            // Se não tem pendentes, talvez sugerir criar para amanhã
            title = '🌙 Noite Livre?';
            body = 'Noite livre? Aproveite para revisar ou criar uma nova missão para amanhã.';
          }

          sendBroadcastNotification(title, body, authUserId!, 'engagement');
          localStorage.setItem(engagementKey, 'true');
        }
      }
    };

    const timer = setInterval(checkNotifications, 5 * 60 * 1000); // Check a cada 5 min em vez de 15
    checkNotifications();

    return () => clearInterval(timer);
  }, [pendingTasks]);

  // Lógica de Filtro
  const filterTasks = (tasks: Task[]) => {
    if (!searchTerm) return tasks;
    const lower = searchTerm.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(lower) ||
      t.description?.toLowerCase().includes(lower)
    );
  };

  // Manipuladores (Handlers)
  const handleNewTask = () => {
    setEditingTaskId(null);
    setFormInitialData({});
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setFormInitialData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      reminderTime: task.reminderTime,
      isPinned: task.isPinned
    });
    setIsFormOpen(true);
  };

  const handleSubmitTask = async (input: NewTaskInput) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, input);
        showToast('Tarefa atualizada!');
      } else {
        await addTask(input);
        showToast('Tarefa salva com sucesso!');
      }
      setIsFormOpen(false);
      setEditingTaskId(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao salvar: ${errorMessage}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAdd = async (title: string, dueDate: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await addTask({
        title,
        dueDate,
        isPinned: false
      });
      showToast('Missão adicionada!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao criar rápida: ${errorMessage}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    await updateTask(id, { isPinned });
  };

  const handleDeleteTask = async (id: string) => {
    if (isProcessing) return;
    if (confirm('Tem certeza que deseja explodir essa missão?')) {
      setIsProcessing(true);
      try {
        await deleteTask(id);
        showToast('Missão abortada (deletada)!');
      } catch (error) {
        showToast('Erro ao deletar tarefa', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const initiateComplete = (task: Task) => {
    setCompleteModalTask(task);
  };

  const confirmComplete = async (id: string, note: string, createFollowUp: boolean) => {
    if (isProcessing) return;
    if (completeModalTask) {
      setIsProcessing(true);
      try {
        await completeTask(id, note);
        showToast('Tarefa concluída!');

        // Feedback Tátil PWA: Vibrar curto ao concluir missão
        if ('vibrate' in navigator) {
          navigator.vibrate([100]);
        }

        if (createFollowUp) {
          setFormInitialData({
            title: `Seguimento: ${completeModalTask.title}`,
            description: `Ref: ${completeModalTask.title} concluída em ${dayjs().format('D MMM, YYYY')}. ${note}`,
            isPinned: true
          });
          setTimeout(() => setIsFormOpen(true), 100);
        }
      } catch (error) {
        showToast('Erro ao concluir tarefa', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
    setCompleteModalTask(null);
  };

  const groupedCompleted = groupTasksByDate(filterTasks(completedTasks));
  const displayedPending = filterTasks(pendingTasks);

  if (!authUserId) {
    return <Entrada onAuthenticated={(uid) => setAuthUserId(uid)} />;
  }

  return (
    <div className="flex min-h-screen bg-background text-zinc-100 overflow-hidden">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <NotificationMonitor userId={authUserId} />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewTask={handleNewTask}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isOffline={isOffline}
        authUserId={authUserId}
        onManualLogin={handleManualLogin}
        onOpenStartupGuide={() => setIsStartupGuideOpen(true)}
        onTestNotification={handleTestNotification}
        onCheckUpdates={handleCheckForUpdates}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 h-screen overflow-y-auto relative pb-20 md:pb-0 md:pl-0">

        {/* Cabeçalho Mobile com Busca */}
        <div className="md:hidden p-4 border-b border-zinc-800 sticky top-0 bg-background/90 backdrop-blur-md z-10 flex flex-col gap-3">
          <div className="flex justify-between items-center">

            {/* Esquerda: Menu e Versão */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-zinc-400 hover:text-white p-1 -ml-1"
              >
                <Menu size={24} />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold font-mono text-zinc-300">v{APP_VERSION}</span>
                <span className={`text-[10px] font-bold ${authUserId ? "text-green-500" : "text-red-500"}`}>
                  {authUserId ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            {/* Direita: Status Offline (simplificado) */}
            <div className="flex gap-2 items-center">
              {isOffline && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Offline" />
              )}
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 relative">
          {/* Efeito de Gradiente UX Premium no topo (Desktop) */}
          <div className="hidden md:block absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab === 'pending' ? 'Missões Pendentes' : activeTab === 'completed' ? 'Histórico' : 'Configurações'}
            </h1>
            <p className="text-zinc-500 mt-1">
              {activeTab === 'pending'
                ? `Você tem ${displayedPending.length} tarefas ativas.`
                : 'Revise suas conquistas passadas.'
              }
            </p>
          </header>

          {activeTab === 'settings' ? (
            <SettingsView
              version={APP_VERSION}
              userId={authUserId}
              onTestNotification={handleTestNotification}
              onCheckUpdates={handleCheckForUpdates}
              onOpenStartupGuide={() => setIsStartupGuideOpen(true)}
            />
          ) : activeTab === 'pending' ? (
            <>
              <div className={isProcessing ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <QuickAddInput onAdd={handleQuickAdd} />
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isProcessing ? 'opacity-70' : ''}`}>
                {displayedPending.length > 0 ? (
                  displayedPending.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={initiateComplete}
                      onPin={handlePin}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-zinc-600">
                    {searchTerm ? 'Nenhuma tarefa encontrada.' : 'Tudo limpo. Descanse.'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-8">
              {Object.keys(groupedCompleted).sort((a, b) => Number(b) - Number(a)).map(year => (
                <div key={year}>
                  {Object.keys(groupedCompleted[year]).map(month => (
                    <div key={`${year}-${month}`} className="mb-8">
                      <h3 className="text-xl font-bold text-zinc-400 mb-4 sticky top-0 bg-background py-2 z-0 border-b border-zinc-800 w-fit pr-8 capitalize">
                        {month} {year}
                      </h3>
                      <div className="space-y-2">
                        {groupedCompleted[year][month].map(task => (
                          <div key={task.id} className="bg-surfaceHover/50 p-4 rounded-lg flex justify-between items-center border border-zinc-800">
                            <div>
                              <p className="font-medium text-zinc-300 line-through decoration-zinc-600">{task.title}</p>
                              {task.completionNote && (
                                <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                                  <Info size={12} /> Nota: {task.completionNote}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-zinc-600 font-mono capitalize">
                              {dayjs(task.completedAt).format('D MMM')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div className="py-20 text-center text-zinc-600">Sem histórico ainda.</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Elementos Flutuantes */}
      {/* Elementos Flutuantes (Removido por solicitação) */}
      {/* <FloatingWidget tasks={pendingTasks} onNewTask={handleNewTask} /> */}

      {/* Modais */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitTask}
        initialData={formInitialData}
        onDelete={() => editingTaskId && handleDeleteTask(editingTaskId)}
      />

      <CompleteModal
        isOpen={!!completeModalTask}
        task={completeModalTask}
        onClose={() => setCompleteModalTask(null)}
        onConfirm={confirmComplete}
      />

      <StartupGuide
        isOpen={isStartupGuideOpen}
        onClose={() => setIsStartupGuideOpen(false)}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        authUserId={authUserId}
        isOffline={isOffline}
        onManualLogin={handleManualLogin}
        onOpenStartupGuide={() => setIsStartupGuideOpen(true)}
        onTestNotification={handleTestNotification}
        onCheckUpdates={handleCheckForUpdates}
        setActiveTab={setActiveTab}
      />

    </div>
  );
};

export default App;