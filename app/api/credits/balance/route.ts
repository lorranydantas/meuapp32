import { creditService } from '@/lib/services/credit-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  try {
    const balance = await creditService.getCreditBalance(parseInt(teamId));
    return NextResponse.json(balance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
