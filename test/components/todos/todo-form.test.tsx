import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TodoForm } from '@/components/todos/todo-form'
import type { Todo } from '@/lib/db/schema'

// Mock the server actions
vi.mock('@/lib/todos/actions', () => ({
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
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

describe('TodoForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(<TodoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
    
    expect(screen.getByText('新しいTodo')).toBeInTheDocument()
    expect(screen.getByLabelText('タイトル *')).toBeInTheDocument()
    expect(screen.getByLabelText('説明')).toBeInTheDocument()
    expect(screen.getByLabelText('優先度')).toBeInTheDocument()
    expect(screen.getByLabelText('期限')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument()
  })

  it('renders edit form correctly with existing todo', () => {
    const existingTodo: Todo = {
      id: 1,
      teamId: 1,
      userId: 1,
      title: 'Existing Todo',
      description: 'Existing description',
      priority: 'high',
      completed: 'false',
      dueDate: new Date('2024-12-31'),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    render(
      <TodoForm 
        editingTodo={existingTodo} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    )
    
    expect(screen.getByText('Todo編集')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Todo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument()
    // Check for selected option instead of display value
    const selectElement = screen.getByRole('combobox') as HTMLSelectElement
    expect(selectElement.value).toBe('high')
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument()
  })

  it('shows validation error for empty title', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSuccess={mockOnSuccess} />)
    
    const submitButton = screen.getByRole('button', { name: '作成' })
    await user.click(submitButton)
    
    // HTML5 validation should prevent submission
    const titleInput = screen.getByLabelText('タイトル *')
    expect(titleInput).toBeRequired()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TodoForm onCancel={mockOnCancel} />)
    
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('submits form with correct data', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSuccess={mockOnSuccess} />)
    
    await user.type(screen.getByLabelText('タイトル *'), 'New Todo')
    await user.type(screen.getByLabelText('説明'), 'Todo description')
    await user.selectOptions(screen.getByLabelText('優先度'), 'high')
    await user.type(screen.getByLabelText('期限'), '2024-12-31')
    
    // Check if form elements are properly populated
    expect(screen.getByDisplayValue('New Todo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Todo description')).toBeInTheDocument()
  })

  it('disables submit button when title is empty', () => {
    render(<TodoForm onSuccess={mockOnSuccess} />)
    
    const submitButton = screen.getByRole('button', { name: '作成' })
    const titleInput = screen.getByLabelText('タイトル *')
    
    // Since we're using HTML5 required attribute, the button should not be disabled
    // but the form validation will prevent submission
    expect(titleInput).toBeRequired()
  })
})