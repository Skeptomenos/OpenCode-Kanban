import { NextResponse } from 'next/server';
import { LocalOpenCodeAdapter } from '@/contract/opencode/adapter';
import { OpenCodeService } from '@/services/opencode-service';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const adapter = new LocalOpenCodeAdapter();
    const service = new OpenCodeService(adapter);
    
    const [sessions, projects] = await Promise.all([
      service.getAllSessions(),
      service.getAllProjects()
    ]);
    
    // 3. Return Envelope (API Standard)
    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.slice(0, 100), // Limit for v1 performance
        projects
      }
    });
  } catch (error) {
    logger.error('GET /api/sessions failed', { error: String(error) });
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to load sessions' } 
    }, { status: 500 });
  }
}
