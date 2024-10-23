import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getTodos,
  addTodo,
  deleteTodo,
  USER_ID,
  toggleTodo,
  updateTodoTitle,
} from './api/todos';
import { Todo } from './types/Todo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';
import { FilterStates, ErrorMessages } from './types/enums';
import { TodoItem } from './components/TodoItem';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(FilterStates.ALL);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingId, setIsEditingId] = useState<number | null>(null);

  const handleAddTodo = useCallback(async (): Promise<void> => {
    if (title.trim() === '') {
      setError(ErrorMessages.NAMING_TODOS);
      setTimeout(() => setError(null), 3000);

      return;
    }

    setIsAdding(true);

    try {
      const newTempTodo: Todo = {
        id: 0,
        userId: USER_ID,
        title,
        completed: false,
      };

      setTempTodo(newTempTodo);

      const newTodo = await addTodo(title.trim());

      setTodos(prevTodos => [...prevTodos, newTodo]);
      setTempTodo(null);
      setTitle('');
    } catch {
      setError(ErrorMessages.ADDING_TODOS);
      setTempTodo(null);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsAdding(false);
      setTimeout(() => {
        const input =
          document.querySelector<HTMLInputElement>('.todoapp__new-todo');

        input?.focus();
      }, 100);
    }
  }, [title]);

  const handleDeleteTodo = useCallback(
    async (todoId: number): Promise<void> => {
      try {
        await deleteTodo(todoId);
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
      } catch {
        setError(ErrorMessages.DELETING_TODOS);
        setTimeout(() => setError(null), 3000);
      } finally {
        const input =
          document.querySelector<HTMLInputElement>('.todoapp__new-todo');

        input?.focus();
      }
    },
    [],
  );

  const handleToggleTodoStatus = useCallback(
    async (todoId: number, completed: boolean): Promise<void> => {
      try {
        await toggleTodo(todoId, completed);
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === todoId ? { ...todo, completed } : todo,
          ),
        );
      } catch {
        setError(ErrorMessages.UPDATE_TODOS);
        setTimeout(() => setError(null), 3000);
      }
    },
    [],
  );

  const handleUpdateTodoTitle = useCallback(
    async (todoId: number, newTitle: string): Promise<void> => {
      const existingTodo = todos.find(todo => todo.id === todoId);

      if (!existingTodo) {
        return;
      }

      if (newTitle.trim() === existingTodo.title) {
        setIsEditingId(null);

        return;
      }

      if (newTitle.trim() === '') {
        try {
          await deleteTodo(todoId);
          setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
          setIsEditingId(null);
        } catch {
          setError(ErrorMessages.DELETING_TODOS);
          setTimeout(() => setError(null), 3000);
        }

        return;
      }

      try {
        await updateTodoTitle(todoId, newTitle);
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === todoId ? { ...todo, title: newTitle } : todo,
          ),
        );
        setIsEditingId(null);
      } catch {
        setError(ErrorMessages.UPDATE_TODOS);
        setTimeout(() => setError(null), 3000);
      }
    },
    [todos],
  );

  const handleDoubleClick = useCallback((todoId: number) => {
    setIsEditingId(todoId);
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      switch (filter) {
        case FilterStates.ACTIVE:
          return !todo.completed;
        case FilterStates.COMPLETED:
          return todo.completed;
        default:
          return true;
      }
    });
  }, [todos, filter]);

  const hasTodos = todos.length > 0;
  const allCompleted = todos.length > 0 && todos.every(todo => todo.completed);

  const handleToggleAllTodos = useCallback(async () => {
    const newCompletedState = !allCompleted;

    try {
      const updatePromises = todos.map(async todo => {
        if (todo.completed !== newCompletedState) {
          await toggleTodo(todo.id, newCompletedState);

          return { ...todo, completed: newCompletedState };
        }

        return todo;
      });

      const updatedTodos = await Promise.all(updatePromises);

      setTodos(updatedTodos);
    } catch {
      setError(ErrorMessages.UPDATE_TODOS);
      setTimeout(() => setError(null), 3000);
    }
  }, [todos, allCompleted]);

  const handleClearCompleted = useCallback(async (): Promise<void> => {
    const completedTodos = todos.filter(todo => todo.completed);

    try {
      const deletionResults = await Promise.allSettled(
        completedTodos.map(todo => handleDeleteTodo(todo.id)),
      );

      const hasErrors = deletionResults.some(
        result => result.status === 'rejected',
      );

      if (hasErrors) {
        setError('Unable to delete some completed todos');
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    } catch {
      setError('Unable to clear completed todos');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  }, [handleDeleteTodo, todos]);

  const handleHideError = () => {
    setError(null);
  };

  const handleCancelEdit = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsEditingId(null);
    }
  };

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const data = await getTodos();

        setTodos(data);
      } catch (err) {
        setError(ErrorMessages.LOAD_TODOS);
        const timer = setTimeout(() => setError(null), 3000);

        return () => clearTimeout(timer);
      }
    };

    fetchTodos();
  }, []);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <Header
          allCompleted={allCompleted}
          onAddTodo={handleAddTodo}
          onToggleAllTodos={handleToggleAllTodos}
          title={title}
          setTitle={setTitle}
          todoCount={todos.length}
          isAdding={isAdding}
          setError={setError}
        />

        {hasTodos &&
          filteredTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onDelete={handleDeleteTodo}
              onToggleStatus={handleToggleTodoStatus}
              onUpdateTitle={handleUpdateTodoTitle}
              setError={setError}
              isEditing={isEditingId === todo.id}
              onDoubleClick={() => handleDoubleClick(todo.id)}
              onCancelEdit={event => handleCancelEdit(event)}
            />
          ))}

        {tempTodo && (
          <TodoItem
            todo={tempTodo}
            onDelete={handleDeleteTodo}
            onToggleStatus={handleToggleTodoStatus}
            onUpdateTitle={handleUpdateTodoTitle}
            setError={setError}
            isAdding={isAdding}
          />
        )}

        {hasTodos && (
          <Footer
            todos={todos}
            filter={filter}
            setFilter={setFilter}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>
      <ErrorNotification error={error} onHideError={handleHideError} />
    </div>
  );
};
