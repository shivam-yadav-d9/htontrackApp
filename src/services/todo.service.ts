import { APP_MODE } from '@/config/appMode';
import { api } from './api';
import { localDb } from './localJsonDb';
import { storage } from '@/utils/storage';

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface Todo {
  id: string;
  user_id?: string;
  staff_id?: string;
  store_code?: string;
  title: string;
  description?: string | null;
  priority: string;
  due_date?: string | null;
  status: string;
  todo_type?: string;
  related_module?: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_by_id?: string;
  assigned_to_id?: string;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  todo_type?: string;
  related_module?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  status?: string;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
  status?: string;
}

async function getMyUserId(): Promise<string> {
  const userStr = await storage.getItem('karmyogi_user');
  if (!userStr) return '';
  try { return (JSON.parse(userStr) as { id: string }).id; } catch { return ''; }
}

export const todoService = {
  async getMyTodos(): Promise<Todo[]> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const todos = await localDb.getCollection<Todo & { user_id?: string; staff_id?: string }>('todos');
      return todos.filter((t) => t.user_id === uid || t.staff_id === uid);
    }
    return api.get<Todo[]>('/todos/my');
  },

  async createTodo(payload: CreateTodoPayload): Promise<Todo> {
    if (APP_MODE === 'offline_apk') {
      const uid = await getMyUserId();
      const item: Todo = {
        id: localDb.generateId('todo'),
        user_id: uid,
        staff_id: uid,
        priority: 'medium',
        status: 'pending',
        created_at: new Date().toISOString(),
        ...payload,
      };
      return localDb.addItem('todos', item);
    }
    return api.post<Todo>('/todos', payload);
  },

  async create(payload: CreateTodoPayload): Promise<Todo> {
    return todoService.createTodo(payload);
  },

  async updateTodo(id: string, payload: UpdateTodoPayload | Partial<CreateTodoPayload>): Promise<Todo> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<Todo>('todos', id, { ...payload, updated_at: new Date().toISOString() });
      return updated ?? ({ id } as Todo);
    }
    return api.put<Todo>(`/todos/${id}`, payload);
  },

  async update(id: string, payload: UpdateTodoPayload): Promise<Todo> {
    return todoService.updateTodo(id, payload);
  },

  async markComplete(id: string): Promise<Todo> {
    if (APP_MODE === 'offline_apk') {
      const updated = await localDb.updateItem<Todo>('todos', id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      return updated ?? ({ id } as Todo);
    }
    return api.post<Todo>(`/todos/${id}/complete`, {});
  },

  async complete(id: string): Promise<Todo> {
    return todoService.markComplete(id);
  },

  async deleteTodo(id: string): Promise<{ message: string }> {
    if (APP_MODE === 'offline_apk') {
      await localDb.deleteItem('todos', id);
      return { message: 'Deleted' };
    }
    return api.delete<{ message: string }>(`/todos/${id}`);
  },

  async delete(id: string): Promise<void> {
    if (APP_MODE === 'offline_apk') {
      await localDb.deleteItem('todos', id);
      return;
    }
    return api.delete<void>(`/todos/${id}`);
  },
};
