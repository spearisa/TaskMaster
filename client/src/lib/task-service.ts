import { apiRequest } from './queryClient';
import { InsertTask, TaskWithStringDates } from '@shared/schema';

export async function getAllTasks(): Promise<TaskWithStringDates[]> {
  const response = await apiRequest('GET', '/api/tasks', null);
  return response.json();
}

export async function getTaskById(id: number): Promise<TaskWithStringDates> {
  const response = await apiRequest('GET', `/api/tasks/${id}`, null);
  return response.json();
}

export async function createTask(task: InsertTask): Promise<TaskWithStringDates> {
  const response = await apiRequest('POST', '/api/tasks', task);
  return response.json();
}

export async function updateTask(id: number, task: Partial<InsertTask>): Promise<TaskWithStringDates> {
  const response = await apiRequest('PATCH', `/api/tasks/${id}`, task);
  return response.json();
}

export async function deleteTask(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/tasks/${id}`, null);
}

export async function completeTask(id: number): Promise<TaskWithStringDates> {
  const response = await apiRequest('POST', `/api/tasks/${id}/complete`, null);
  return response.json();
}

export async function getAISuggestions(context: { taskTitle?: string; description?: string }): Promise<any> {
  const response = await apiRequest('POST', '/api/ai/suggestions', context);
  return response.json();
}
