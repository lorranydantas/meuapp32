import { Suspense } from 'react';
import { getUser } from '@/lib/db/queries';
import { getTodos } from '@/lib/todos/actions';
import { TodoList } from '@/components/todos/todo-list';
import type { User } from '@/lib/db/schema';

async function TodosContent() {
  const user = (await getUser()) as User;
  const todos = await getTodos(user.id);

  return <TodoList initialTodos={todos} />;
}

function TodosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-white border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TodosPage() {
  return (
    <div className="p-4 lg:p-6">
      <Suspense fallback={<TodosLoading />}>
        <TodosContent />
      </Suspense>
    </div>
  );
}