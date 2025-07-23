import { creditService } from '@/lib/services/credit-service';
import { InsufficientCreditsError } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { teamId, prompt } = await request.json();
  const requiredCredits = 10; // Define based on your pricing

  try {
    // Use credits first
    await creditService.useCredits(
      teamId,
      null, // userId if available
      requiredCredits,
      'ai_generation',
      `Generated content for prompt: ${prompt.substring(0, 50)}...`
    );

    // Then perform the actual operation
    // const result = await generateAIContent(prompt);

    return NextResponse.json({ result: 'AI content generated' });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
