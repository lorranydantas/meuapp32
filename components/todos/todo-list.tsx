'use client';

import { useState, useEffect } from 'react';
import { TodoForm } from './todo-form';
import { TodoItem } from './todo-item';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import type { Todo } from '@/lib/db/schema';

interface TodoListProps {
  initialTodos: Todo[];
}

export function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const refreshTodos = () => {
    window.location.reload();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTodo(null);
    refreshTodos();
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setShowForm(false);
  };

  const filteredTodos = todos.filter(todo => {
    const statusMatch = filter === 'all' || 
      (filter === 'active' && todo.completed === 'false') ||
      (filter === 'completed' && todo.completed === 'true');
    
    const priorityMatch = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    return statusMatch && priorityMatch;
  });

  const completedCount = todos.filter(todo => todo.completed === 'true').length;
  const totalCount = todos.length;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Todo リスト</h1>
          <p className="text-gray-600">
            {completedCount}/{totalCount} 個完了
          </p>
        </div>
        
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            新しいTodo
          </Button>
        )}
      </div>

      {/* フォーム */}
      {showForm && (
        <TodoForm
          editingTodo={editingTodo}
          onCancel={handleCancelEdit}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">フィルター:</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            全て
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            未完了
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            完了済み
          </Button>
        </div>

        <div className="flex gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全ての優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>

      {/* Todo リスト */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {filter === 'all' && priorityFilter === 'all' 
              ? 'まだTodoがありません。新しいTodoを作成してみましょう！'
              : 'フィルター条件に一致するTodoがありません。'}
          </div>
        ) : (
          filteredTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={handleEdit}
              onUpdate={refreshTodos}
            />
          ))
        )}
      </div>
    </div>
  );
}