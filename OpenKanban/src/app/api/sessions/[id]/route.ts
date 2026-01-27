import { NextRequest, NextResponse } from 'next/server';
import { LocalOpenCodeAdapter } from '@/contract/opencode/adapter';
import { OpenCodeService } from '@/services/opencode-service';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const adapter = new LocalOpenCodeAdapter();
    const service = new OpenCodeService(adapter);
    
    const [session, messages] = await Promise.all([
      service.getSessionById(id),
      service.getSessionMessages(id)
    ]);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: { message: 'Session not found', code: 'NOT_FOUND' }
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: { session, messages }
    });
  } catch (error) {
    logger.error('GET /api/sessions/[id] failed', { error: String(error) });
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to load session', code: 'INTERNAL_ERROR' } 
    }, { status: 500 });
  }
}
