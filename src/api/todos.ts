import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';

export const USER_ID = 1625;

export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

export const addTodo = (title: string) => {
  return client.post<Todo>(`/todos`, {
    title,
    userId: USER_ID,
    completed: false,
  });
};

export const deleteTodo = (todoId: number) => {
  return client.delete(`/todos/${todoId}`);
};

export const toggleTodo = (todoId: number, completed: boolean) => {
  return client.patch(`/todos/${todoId}`, { completed });
};

export const updateTodoTitle = (todoId: number, title: string) => {
  return client.patch(`/todos/${todoId}`, { title });
};
