'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { toggleTodoCompletion, deleteTodo } from '@/lib/todos/actions';
import { Edit, Trash2, Check, Clock } from 'lucide-react';
import type { Todo } from '@/lib/db/schema';
import type { ActionState } from '@/lib/auth/middleware';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onUpdate: () => void;
}

export function TodoItem({ todo, onEdit, onUpdate }: TodoItemProps) {
  const [toggleState, toggleAction] = useActionState<ActionState, FormData>(toggleTodoCompletion, {});
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deleteTodo, {});
  
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = async (formData: FormData) => {
    setIsToggling(true);
    formData.append('id', todo.id.toString());
    await toggleAction(formData);
    if (toggleState.success) {
      onUpdate();
    }
    setIsToggling(false);
  };

  const handleDelete = async (formData: FormData) => {
    if (!confirm('このTodoを削除しますか？')) return;
    
    setIsDeleting(true);
    formData.append('id', todo.id.toString());
    await deleteAction(formData);
    if (deleteState.success) {
      onUpdate();
    }
    setIsDeleting(false);
  };

  const isCompleted = todo.completed === 'true';
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高'
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('ja-JP');
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !isCompleted;

  return (
    <div className={`p-4 bg-white border rounded-lg ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <form action={handleToggleComplete} className="inline">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isToggling}
              className={`mt-1 ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
            >
              <Check className={`h-4 w-4 ${isCompleted ? 'text-green-600' : ''}`} />
            </Button>
          </form>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                {todo.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[todo.priority as keyof typeof priorityColors]}`}>
                {priorityLabels[todo.priority as keyof typeof priorityLabels]}
              </span>
              
              {todo.dueDate && (
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(todo.dueDate)}</span>
                  {isOverdue && <span className="font-medium">（期限切れ）</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(todo)}
            disabled={isDeleting}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <form action={handleDelete} className="inline">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}