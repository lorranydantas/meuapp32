import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TodoList } from '@/components/todos/todo-list'
import type { Todo } from '@/lib/db/schema'

// Mock child components
vi.mock('@/components/todos/todo-form', () => ({
  TodoForm: ({ onCancel, onSuccess }: any) => (
    <div data-testid="todo-form">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}))

vi.mock('@/components/todos/todo-item', () => ({
  TodoItem: ({ todo, onEdit }: any) => (
    <div data-testid="todo-item">
      <span>{todo.title}</span>
      <button onClick={() => onEdit(todo)}>Edit</button>
    </div>
  ),
}))

describe('TodoList', () => {
  const mockTodos: Todo[] = [
    {
      id: 1,
      teamId: 1,
      userId: 1,
      title: 'Active Todo',
      description: 'Description',
      priority: 'medium',
      completed: 'false',
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      teamId: 1,
      userId: 1,
      title: 'Completed Todo',
      description: 'Description',
      priority: 'high',
      completed: 'true',
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      teamId: 1,
      userId: 1,
      title: 'Low Priority Todo',
      description: 'Description',
      priority: 'low',
      completed: 'false',
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders todo list with header', () => {
    render(<TodoList initialTodos={mockTodos} />)
    
    expect(screen.getByText('Todo リスト')).toBeInTheDocument()
    expect(screen.getByText('1/3 個完了')).toBeInTheDocument()
    expect(screen.getByText('新しいTodo')).toBeInTheDocument()
  })

  it('renders all todos by default', () => {
    render(<TodoList initialTodos={mockTodos} />)
    
    expect(screen.getByText('Active Todo')).toBeInTheDocument()
    expect(screen.getByText('Completed Todo')).toBeInTheDocument()
    expect(screen.getByText('Low Priority Todo')).toBeInTheDocument()
  })

  it('shows form when "新しいTodo" button is clicked', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    const addButton = screen.getByText('新しいTodo')
    await user.click(addButton)
    
    expect(screen.getByTestId('todo-form')).toBeInTheDocument()
    expect(screen.queryByText('新しいTodo')).not.toBeInTheDocument()
  })

  it('hides form when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    // Show form
    await user.click(screen.getByText('新しいTodo'))
    expect(screen.getByTestId('todo-form')).toBeInTheDocument()
    
    // Cancel form
    await user.click(screen.getByText('Cancel'))
    expect(screen.queryByTestId('todo-form')).not.toBeInTheDocument()
    expect(screen.getByText('新しいTodo')).toBeInTheDocument()
  })

  it('filters todos by status', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    // Filter to show only active todos
    await user.click(screen.getByText('未完了'))
    
    expect(screen.getByText('Active Todo')).toBeInTheDocument()
    expect(screen.getByText('Low Priority Todo')).toBeInTheDocument()
    expect(screen.queryByText('Completed Todo')).not.toBeInTheDocument()
  })

  it('filters todos by completed status', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    // Filter to show only completed todos
    await user.click(screen.getByText('完了済み'))
    
    expect(screen.getByText('Completed Todo')).toBeInTheDocument()
    expect(screen.queryByText('Active Todo')).not.toBeInTheDocument()
    expect(screen.queryByText('Low Priority Todo')).not.toBeInTheDocument()
  })

  it('filters todos by priority', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    // Filter by high priority
    const prioritySelect = screen.getByRole('combobox')
    await user.selectOptions(prioritySelect, 'high')
    
    expect(screen.getByText('Completed Todo')).toBeInTheDocument()
    expect(screen.queryByText('Active Todo')).not.toBeInTheDocument()
    expect(screen.queryByText('Low Priority Todo')).not.toBeInTheDocument()
  })

  it('shows empty state when no todos match filter', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={[]} />)
    
    expect(screen.getByText('まだTodoがありません。新しいTodoを作成してみましょう！')).toBeInTheDocument()
  })

  it('shows filtered empty state', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    // Apply a filter that matches nothing
    const prioritySelect = screen.getByRole('combobox')
    await user.selectOptions(prioritySelect, 'high')
    await user.click(screen.getByText('未完了'))
    
    expect(screen.getByText('フィルター条件に一致するTodoがありません。')).toBeInTheDocument()
  })

  it('opens edit form when todo edit is clicked', async () => {
    const user = userEvent.setup()
    render(<TodoList initialTodos={mockTodos} />)
    
    const editButton = screen.getAllByText('Edit')[0]
    await user.click(editButton)
    
    expect(screen.getByTestId('todo-form')).toBeInTheDocument()
  })
})