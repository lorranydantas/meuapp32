import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TodoItem } from '@/components/todos/todo-item'
import type { Todo } from '@/lib/db/schema'

// Mock the server actions
vi.mock('@/lib/todos/actions', () => ({
  toggleTodoCompletion: vi.fn(),
  deleteTodo: vi.fn(),
}))

// Mock useActionState
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useActionState: vi.fn((action, initialState) => [
      initialState,
      vi.fn()
    ])
  }
})

describe('TodoItem', () => {
  const mockOnEdit = vi.fn()
  const mockOnUpdate = vi.fn()

  const mockTodo: Todo = {
    id: 1,
    teamId: 1,
    userId: 1,
    title: 'Test Todo',
    description: 'Test description',
    priority: 'medium',
    completed: 'false',
    dueDate: new Date('2024-12-31'),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders todo item correctly', () => {
    render(
      <TodoItem 
        todo={mockTodo} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('中')).toBeInTheDocument() // medium priority in Japanese
    expect(screen.getByText('2024/12/31')).toBeInTheDocument()
  })

  it('shows completed todo with different styling', () => {
    const completedTodo = { ...mockTodo, completed: 'true' as const }
    
    render(
      <TodoItem 
        todo={completedTodo} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    const title = screen.getByText('Test Todo')
    expect(title).toHaveClass('line-through')
  })

  it('shows overdue indicator for past due dates', () => {
    const overdueTodo = { 
      ...mockTodo, 
      dueDate: new Date('2020-01-01') // Past date
    }
    
    render(
      <TodoItem 
        todo={overdueTodo} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    expect(screen.getByText('（期限切れ）')).toBeInTheDocument()
  })

  it('shows correct priority colors', () => {
    const highPriorityTodo = { ...mockTodo, priority: 'high' as const }
    
    render(
      <TodoItem 
        todo={highPriorityTodo} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    const priorityBadge = screen.getByText('高')
    expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <TodoItem 
        todo={mockTodo} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    const editButton = screen.getByRole('button', { name: '' }) // Edit icon button
    await user.click(editButton)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTodo)
  })

  it('shows confirmation dialog before deleting', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false)
    
    const user = userEvent.setup()
    
    render(
      <TodoItem 
        todo={mockTodo} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    const deleteButton = screen.getAllByRole('button')[2] // Delete button is third
    await user.click(deleteButton)
    
    expect(confirmSpy).toHaveBeenCalledWith('このTodoを削除しますか？')
    
    confirmSpy.mockRestore()
  })

  it('renders without description', () => {
    const todoWithoutDescription = { ...mockTodo, description: null }
    
    render(
      <TodoItem 
        todo={todoWithoutDescription} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
  })

  it('renders without due date', () => {
    const todoWithoutDueDate = { ...mockTodo, dueDate: null }
    
    render(
      <TodoItem 
        todo={todoWithoutDueDate} 
        onEdit={mockOnEdit} 
        onUpdate={mockOnUpdate} 
      />
    )
    
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
    expect(screen.queryByText('2024/12/31')).not.toBeInTheDocument()
  })
})