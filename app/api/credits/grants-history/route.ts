import { creditService } from '@/lib/services/credit-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId');
  const limit = request.nextUrl.searchParams.get('limit');
  const offset = request.nextUrl.searchParams.get('offset');

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  try {
    const history = await creditService.getGrantsHistory(
      parseInt(teamId),
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
