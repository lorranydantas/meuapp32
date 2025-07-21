'use server';

import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  todos,
  activityLogs,
  type NewTodo,
  type NewActivityLog,
  ActivityType
} from '@/lib/db/schema';
import { getUserWithTeam } from '@/lib/db/queries';
import {
  validatedActionWithUser
} from '@/lib/auth/middleware';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional()
});

export const createTodo = validatedActionWithUser(
  createTodoSchema,
  async (data, _, user) => {
    const { title, description, priority, dueDate } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const newTodo: NewTodo = {
      teamId: userWithTeam.teamId,
      userId: user.id,
      title,
      description: description || null,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: 'false'
    };

    const [createdTodo] = await db.insert(todos).values(newTodo).returning();

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.CREATE_TODO
    );

    return { success: 'Todo created successfully', todo: createdTodo };
  }
);

const updateTodoSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional()
});

export const updateTodo = validatedActionWithUser(
  updateTodoSchema,
  async (data, _, user) => {
    console.log('Updating todo with data:', data);
    const { id, title, description, priority, dueDate } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const [updatedTodo] = await db
      .update(todos)
      .set({
        title,
        description: description || null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(todos.id, id),
          eq(todos.teamId, userWithTeam.teamId)
        )
      )
      .returning();

    if (!updatedTodo) {
      return { error: 'Todo not found or access denied' };
    }

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.UPDATE_TODO
    );

    return { success: 'Todo updated successfully', todo: updatedTodo };
  }
);

const toggleTodoSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
});

export const toggleTodoCompletion = validatedActionWithUser(
  toggleTodoSchema,
  async (data, _, user) => {
    const { id } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const [todo] = await db
      .select()
      .from(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (!todo) {
      return { error: 'Todo not found or access denied' };
    }

    const newCompleted = todo.completed === 'false' ? 'true' : 'false';

    const [updatedTodo] = await db
      .update(todos)
      .set({
        completed: newCompleted,
        updatedAt: new Date()
      })
      .where(eq(todos.id, id))
      .returning();

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.COMPLETE_TODO
    );

    return { success: 'Todo status updated successfully', todo: updatedTodo };
  }
);

const deleteTodoSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
});

export const deleteTodo = validatedActionWithUser(
  deleteTodoSchema,
  async (data, _, user) => {
    const { id } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const [deletedTodo] = await db
      .delete(todos)
      .where(
        and(
          eq(todos.id, id),
          eq(todos.teamId, userWithTeam.teamId)
        )
      )
      .returning();

    if (!deletedTodo) {
      return { error: 'Todo not found or access denied' };
    }

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.DELETE_TODO
    );

    return { success: 'Todo deleted successfully' };
  }
);

export async function getTodos(userId: number) {
  const userWithTeam = await getUserWithTeam(userId);

  if (!userWithTeam?.teamId) {
    return [];
  }

  const teamTodos = await db
    .select({
      id: todos.id,
      title: todos.title,
      description: todos.description,
      completed: todos.completed,
      priority: todos.priority,
      dueDate: todos.dueDate,
      createdAt: todos.createdAt,
      updatedAt: todos.updatedAt,
      userId: todos.userId
    })
    .from(todos)
    .where(eq(todos.teamId, userWithTeam.teamId))
    .orderBy(desc(todos.createdAt));

  return teamTodos;
}