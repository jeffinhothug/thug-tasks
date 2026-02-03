import React, { useState, useEffect } from 'react';
import { signInAnonymously } from "firebase/auth";
import Sidebar from './components/Sidebar';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import CompleteModal from './components/CompleteModal';
import FloatingWidget from './components/FloatingWidget';
import QuickAddInput from './components/QuickAddInput';
import {
  subscribeToPendingTasks,
  subscribeToCompletedTasks,
  addTask,
  completeTask,
  updateTask,
  groupTasksByDate,
  recalculateAllPriorities,
  cleanupOldTasks
} from './services/taskLogic';
import { auth } from './services/firebase';
import { Task, NewTaskInput, TaskPriority } from './types';
import { Search, Info } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import Toast from './components/Toast';

// Set locale globally
dayjs.locale('pt-br');

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Data State
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<NewTaskInput>>({});
  const [completeModalTask, setCompleteModalTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleManualLogin = async () => {
    try {
      await signInAnonymously(auth);
      showToast('Tentativa de conexão enviada...', 'success');
    } catch (error: any) {
      console.error(error);
      const code = error.code || 'unknown';
      showToast(`Erro de Auth (${code}): Verifique o Console do Firebase`, 'error');
    }
  };

  // Initialization
  useEffect(() => {
    // 0. Auth Monitor
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthUserId(user.uid);
      } else {
        setAuthUserId(null);
        showToast('⚠️ Usuário não autenticado', 'error');
      }
    });

    // 1. Subscribe to data
    const unsubscribePending = subscribeToPendingTasks(
      (tasks, isOffline) => {
        setPendingTasks(tasks);
        setIsOffline(isOffline);
      },
      (error) => showToast(`Erro Crítico de Conexão: ${error.message}`, 'error')
    );
    const unsubscribeCompleted = subscribeToCompletedTasks(setCompletedTasks);

    // 2. Run maintenance
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

  // Notification Check
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const checkDueTasks = () => {
      const now = dayjs();
      const tasks = [...pendingTasks];

      tasks.forEach(task => {
        if (task.isCompleted) return;

        let shouldNotify = false;
        let message = '';
        const notifiedKey = `notified-${task.id}-${dayjs().format('YYYY-MM-DD-HH')}`;

        if (localStorage.getItem(notifiedKey)) return;

        if (task.reminderTime) {
          const reminder = dayjs(task.reminderTime);
          const diffInMinutes = reminder.diff(now, 'minute');

          if (diffInMinutes >= 0 && diffInMinutes <= 15) {
            shouldNotify = true;
            message = `⏰ Lembrete: "${task.title}" é às ${reminder.format('HH:mm')}!`;
          }
        } else {
          const dueDate = dayjs(task.dueDate);
          if (dueDate.isSame(now, 'day')) {
            shouldNotify = true;
            message = `📅 Para Hoje (O Dia Todo): "${task.title}"`;
          }
        }

        if (shouldNotify) {
          new Notification('Thug Tasks', {
            body: message,
            icon: '/icon.svg'
          });
          localStorage.setItem(notifiedKey, 'true');
        }
      });
    };

    const timer = setInterval(checkDueTasks, 15 * 60 * 1000);
    checkDueTasks();

    return () => clearInterval(timer);
  }, [pendingTasks]);

  // Filter Logic
  const filterTasks = (tasks: Task[]) => {
    if (!searchTerm) return tasks;
    const lower = searchTerm.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(lower) ||
      t.description?.toLowerCase().includes(lower)
    );
  };

  // Handlers
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
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao salvar: ${errorMessage}`, 'error');
    }
  };

  const handleQuickAdd = async (title: string, dueDate: string) => {
    try {
      await addTask({
        title,
        dueDate,
        isPinned: false
      });
      showToast('Missão adicionada!');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(`Erro ao criar rápida: ${errorMessage}`, 'error');
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    await updateTask(id, { isPinned });
  };

  const initiateComplete = (task: Task) => {
    setCompleteModalTask(task);
  };

  const confirmComplete = async (id: string, note: string, createFollowUp: boolean) => {
    if (completeModalTask) {
      await completeTask(id, note);
      showToast('Tarefa concluída!');

      if (createFollowUp) {
        setFormInitialData({
          title: `Seguimento: ${completeModalTask.title}`,
          description: `Ref: ${completeModalTask.title} concluída em ${dayjs().format('D MMM, YYYY')}. ${note}`,
          isPinned: true
        });
        setTimeout(() => setIsFormOpen(true), 100);
      }
    }
    setCompleteModalTask(null);
  };

  const groupedCompleted = groupTasksByDate(filterTasks(completedTasks));
  const displayedPending = filterTasks(pendingTasks);

  return (
    <div className="flex min-h-screen bg-background text-zinc-100 overflow-hidden">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewTask={handleNewTask}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isOffline={isOffline}
        authUserId={authUserId}
        onManualLogin={handleManualLogin}
      />

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative pb-20 md:pb-0 md:pl-0">

        {/* Mobile Header with Search */}
        <div className="md:hidden p-4 border-b border-zinc-800 sticky top-0 bg-background/90 backdrop-blur-md z-10 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-zinc-600">v1.4 (Cloud Only)</span>
              <span className={`text-[10px] font-bold ${authUserId ? "text-green-600" : "text-red-500"}`}>
                {authUserId ? "Online" : "Desconectado"}
              </span>
            </div>

            <div className="flex gap-2 items-center">
              {isOffline && (
                <span className="text-[10px] text-orange-500 font-bold border border-orange-500/30 px-2 py-1 rounded bg-orange-500/10">
                  ⚠️ Offline
                </span>
              )}
              {!authUserId && (
                <button
                  onClick={handleManualLogin}
                  className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse"
                >
                  Conectar
                </button>
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

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">

          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab === 'pending' ? 'Missões Pendentes' : 'Histórico'}
            </h1>
            <p className="text-zinc-500 mt-1">
              {activeTab === 'pending'
                ? `Você tem ${displayedPending.length} tarefas ativas.`
                : 'Revise suas conquistas passadas.'
              }
            </p>
          </header>

          {activeTab === 'pending' ? (
            <>
              <QuickAddInput onAdd={handleQuickAdd} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedPending.length > 0 ? (
                  displayedPending.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={initiateComplete}
                      onPin={handlePin}
                      onEdit={handleEditTask}
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

      {/* Floating Elements */}
      <FloatingWidget tasks={pendingTasks} onNewTask={handleNewTask} />

      {/* Modals */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitTask}
        initialData={formInitialData}
      />

      <CompleteModal
        isOpen={!!completeModalTask}
        task={completeModalTask}
        onClose={() => setCompleteModalTask(null)}
        onConfirm={confirmComplete}
      />

    </div>
  );
};

export default App;