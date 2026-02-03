export enum TaskPriority {
  HIGH = 'high',     // <= 3 days or overdue
  MEDIUM = 'medium', // 4-7 days
  LOW = 'low'        // > 7 days
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO String (Date only usually)
  reminderTime?: string; // ISO String (Date + Time) for specific notification
  priority: TaskPriority;
  isPinned: boolean;
  isCompleted: boolean;
  completedAt?: string; // ISO String
  completionNote?: string;
  createdAt: string;
}

export type NewTaskInput = Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'priority'>;

export interface GroupedCompletedTasks {
  [year: string]: {
    [month: string]: Task[];
  };
}