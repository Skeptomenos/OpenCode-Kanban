import fs from 'fs';
import path from 'path';
import os from 'os';
import { Project, Session } from '@/types/session';

const STORAGE_BASE = path.join(os.homedir(), '.local/share/opencode/storage');
const MAX_SESSIONS = 100;

export async function getProjects(): Promise<Project[]> {
  try {
    const projectDir = path.join(STORAGE_BASE, 'project');
    try {
      await fs.promises.access(projectDir);
    } catch {
      return [];
    }

    const files = await fs.promises.readdir(projectDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const projects: Project[] = [];
    for (const f of jsonFiles) {
      try {
        const content = await fs.promises.readFile(path.join(projectDir, f), 'utf-8');
        projects.push(JSON.parse(content));
      } catch (e) {
        console.warn('Failed to parse project:', f, e);
      }
    }
    return projects;
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
}

export async function getSessions(): Promise<{ sessions: Session[], debug: string[] }> {
  const debug: string[] = [];
  try {
    const sessionBaseDir = path.join(STORAGE_BASE, 'session');
    debug.push(`Reading sessions from: ${sessionBaseDir}`);
    
    try {
      await fs.promises.access(sessionBaseDir);
    } catch {
      debug.push('Session directory does not exist');
      return { sessions: [], debug };
    }

    const sessionsMap = new Map<string, Session>();

    // 1. Read global sessions
    const globalDir = path.join(sessionBaseDir, 'global');
    try {
      await fs.promises.access(globalDir);
      const globalFiles = (await fs.promises.readdir(globalDir)).filter(f => f.endsWith('.json'));
      debug.push(`Found ${globalFiles.length} global sessions`);
      
      for (const file of globalFiles) {
        try {
          const content = await fs.promises.readFile(path.join(globalDir, file), 'utf-8');
          const session = JSON.parse(content);
          sessionsMap.set(session.id, session);
        } catch (e) {
          console.warn('Failed to parse global session:', file, e);
        }
      }
    } catch {
      debug.push('Global dir not found');
    }

    // 2. Read project-specific sessions
    const allDirs = await fs.promises.readdir(sessionBaseDir);
    const projectDirs = allDirs.filter(d => d !== 'global' && !d.startsWith('.'));
    debug.push(`Found ${projectDirs.length} project directories`);
    
    for (const projectHash of projectDirs) {
      const projectSessionDir = path.join(sessionBaseDir, projectHash);
      const stat = await fs.promises.stat(projectSessionDir);
      if (stat.isDirectory()) {
        const files = (await fs.promises.readdir(projectSessionDir)).filter(f => f.endsWith('.json'));
        for (const file of files) {
          try {
            const content = await fs.promises.readFile(path.join(projectSessionDir, file), 'utf-8');
            const session = JSON.parse(content);
            sessionsMap.set(session.id, session);
          } catch (e) {
            console.warn('Failed to parse session:', file, e);
          }
        }
      }
    }

    const allSessions = Array.from(sessionsMap.values());
    debug.push(`Total unique sessions: ${allSessions.length}`);
    
    // Return newest 100 sessions for performance
    return { 
      sessions: allSessions.sort((a, b) => b.time.updated - a.time.updated).slice(0, MAX_SESSIONS),
      debug
    };
  } catch (error) {
    debug.push(`Error: ${error}`);
    return { sessions: [], debug };
  }
}
