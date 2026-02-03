import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "./firebase";
export { auth }; // Re-export for App usage
import { Task, TaskPriority, NewTaskInput, GroupedCompletedTasks } from "../types";
import dayjs from "dayjs";

const COLLECTION_NAME = "tasks";

// --- Priority Calculation ---

export const calculatePriority = (dueDate: string): TaskPriority => {
  const now = dayjs();
  const due = dayjs(dueDate);
  const diffDays = due.diff(now, 'day');

  if (diffDays <= 3) return TaskPriority.HIGH;
  if (diffDays <= 7) return TaskPriority.MEDIUM;
  return TaskPriority.LOW;
};

// --- CRUD ---

export const addTask = async (input: NewTaskInput): Promise<string> => {
  const priority = calculatePriority(input.dueDate);

  // Firestore does not accept 'undefined', so we must sanitize the input
  const safeInput = { ...input };
  Object.keys(safeInput).forEach(key => {
    if (safeInput[key as keyof NewTaskInput] === undefined) {
      delete safeInput[key as keyof NewTaskInput];
    }
  });

  const newTask = {
    ...safeInput,
    priority,
    isPinned: input.isPinned || false,
    isCompleted: false,
    createdAt: new Date().toISOString()
  };

  // Timeout protection (Increased to 30s to avoid false positives on slow networks)
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("O servidor demorou para responder, mas sua missão deve ter sido salva localmente.")), 30000)
  );

  const docRef = await Promise.race([
    addDoc(collection(db, COLLECTION_NAME), newTask),
    timeout
  ]);

  return docRef.id;
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  const taskRef = doc(db, COLLECTION_NAME, id);
  // Recalculate priority if date changes
  if (updates.dueDate) {
    updates.priority = calculatePriority(updates.dueDate);
  }

  // Remove undefined fields
  const safeUpdates = { ...updates };
  Object.keys(safeUpdates).forEach(key => {
    if (safeUpdates[key as keyof Task] === undefined) {
      delete safeUpdates[key as keyof Task];
    }
  });

  await updateDoc(taskRef, safeUpdates);
};

export const completeTask = async (id: string, note?: string) => {
  const taskRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(taskRef, {
    isCompleted: true,
    completedAt: new Date().toISOString(),
    completionNote: note || ""
  });
};

export const deleteTask = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

// --- Subscriptions ---

export const subscribeToPendingTasks = (callback: (tasks: Task[], isOffline: boolean) => void, onError?: (error: Error) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("isCompleted", "==", false)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    const isOffline = snapshot.metadata.fromCache;

    // Client-side sorting: Pinned first, then by Due Date asc
    tasks.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix();
    });

    callback(tasks, isOffline);
  }, (error) => {
    console.error("Erro no subscribePending:", error);
    if (onError) onError(error);
  });
};

export const subscribeToCompletedTasks = (callback: (tasks: Task[]) => void, onError?: (error: Error) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("isCompleted", "==", true)
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    // Sort by completedAt desc
    tasks.sort((a, b) => dayjs(b.completedAt).unix() - dayjs(a.completedAt).unix());
    callback(tasks);
  }, (error) => {
    console.error("Erro no subscribeCompleted:", error);
    if (onError) onError(error);
  });
};

// --- Helpers ---

export const groupTasksByDate = (tasks: Task[]): GroupedCompletedTasks => {
  const groups: GroupedCompletedTasks = {};

  tasks.forEach(task => {
    if (!task.completedAt) return;
    const date = dayjs(task.completedAt);
    const year = date.format('YYYY');
    // MMMM will be in Portuguese thanks to locale setting in App.tsx
    const month = date.format('MMMM');

    if (!groups[year]) groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];

    groups[year][month].push(task);
  });

  return groups;
};

// --- Automation ---

export const recalculateAllPriorities = async () => {
  const q = query(collection(db, COLLECTION_NAME), where("isCompleted", "==", false));
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  let hasUpdates = false;

  snapshot.docs.forEach(docSnap => {
    const task = docSnap.data() as Task;
    const currentPriority = task.priority;
    const correctPriority = calculatePriority(task.dueDate);

    if (currentPriority !== correctPriority) {
      batch.update(docSnap.ref, { priority: correctPriority });
      hasUpdates = true;
    }
  });

  if (hasUpdates) await batch.commit();
};

export const cleanupOldTasks = async () => {
  const sixMonthsAgo = dayjs().subtract(6, 'month').toISOString();

  const q = query(
    collection(db, COLLECTION_NAME),
    where("isCompleted", "==", true),
    where("completedAt", "<", sixMonthsAgo)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  if (snapshot.empty) return;

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Limpeza automática: ${snapshot.size} tarefas antigas removidas.`);
};