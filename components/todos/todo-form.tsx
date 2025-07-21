'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTodo, updateTodo } from '@/lib/todos/actions';
import { Plus, Edit } from 'lucide-react';
import type { Todo } from '@/lib/db/schema';
import type { ActionState } from '@/lib/auth/middleware';

interface TodoFormProps {
  editingTodo?: Todo | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function TodoForm({ editingTodo, onCancel, onSuccess }: TodoFormProps) {
  const [createState, createAction] = useActionState<ActionState, FormData>(createTodo, {});
  const [updateState, updateAction] = useActionState<ActionState, FormData>(updateTodo, {});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = editingTodo ? updateState : createState;
  const action = editingTodo ? updateAction : createAction;

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    if (editingTodo) {
      formData.append('id', editingTodo.id.toString());
    }
    
    await action(formData);
    
    if (state.success) {
      onSuccess?.();
    }
    setIsSubmitting(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg border">
      <div className="flex items-center gap-2">
        {editingTodo ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        <h3 className="font-semibold">{editingTodo ? 'Todo編集' : '新しいTodo'}</h3>
      </div>

      {state.error && (
        <div className="text-red-600 text-sm">{state.error}</div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          タイトル *
        </label>
        <Input
          id="title"
          name="title"
          defaultValue={editingTodo?.title || ''}
          placeholder="Todoのタイトルを入力"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={editingTodo?.description || ''}
          placeholder="詳細な説明（任意）"
          className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            優先度
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={(editingTodo?.priority as 'low' | 'medium' | 'high') || 'medium'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
            期限
          </label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={editingTodo?.dueDate ? editingTodo.dueDate.toISOString().split('T')[0] : ''}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : editingTodo ? '更新' : '作成'}
        </Button>
        {(editingTodo || onCancel) && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}