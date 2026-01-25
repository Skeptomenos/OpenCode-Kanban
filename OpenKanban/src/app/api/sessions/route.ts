import { NextResponse } from 'next/server';
import { LocalOpenCodeAdapter } from '@/contract/opencode/adapter';

export async function GET() {
  try {
    // 1. Initialize Adapter (The Contract)
    const repo = new LocalOpenCodeAdapter();
    
    // 2. Fetch Data
    const [sessions, projects] = await Promise.all([
      repo.getAllSessions(),
      repo.getAllProjects()
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
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to load sessions' } 
    }, { status: 500 });
  }
}
