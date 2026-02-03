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

  // ... (existing code)

  {/* Mobile Header with Search */ }
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
      </main >

  {/* Floating Elements */ }
  < FloatingWidget tasks = { pendingTasks } onNewTask = { handleNewTask } />

    {/* Modals */ }
    < TaskForm
isOpen = { isFormOpen }
onClose = {() => setIsFormOpen(false)}
onSubmit = { handleSubmitTask }
initialData = { formInitialData }
  />

  <CompleteModal
    isOpen={!!completeModalTask}
    task={completeModalTask}
    onClose={() => setCompleteModalTask(null)}
    onConfirm={confirmComplete}
  />

    </div >
  );
};

export default App;