import { creditService } from '@/lib/services/credit-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { teamId, userId, credits, actionType, description, metadata } =
    await request.json();

  if (!teamId || !credits || !actionType) {
    return NextResponse.json(
      { error: 'teamId, credits, and actionType are required' },
      { status: 400 }
    );
  }

  try {
    const newBalance = await creditService.useCredits(
      teamId,
      userId,
      credits,
      actionType,
      description,
      metadata
    );
    return NextResponse.json(newBalance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
