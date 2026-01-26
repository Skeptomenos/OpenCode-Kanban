import { NextRequest, NextResponse } from 'next/server';
import { LocalOpenCodeAdapter } from '@/contract/opencode/adapter';
import { OpenCodeService } from '@/services/opencode-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const adapter = new LocalOpenCodeAdapter();
    const service = new OpenCodeService(adapter);
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || undefined;
    
    const [sessions, projects] = await Promise.all([
      service.getAllSessions(query),
      service.getAllProjects()
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.slice(0, 100),
        projects
      }
    });
  } catch (error) {
    logger.error('GET /api/sessions failed', { error: String(error) });
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to load sessions', code: 'INTERNAL_ERROR' } 
    }, { status: 500 });
  }
}
