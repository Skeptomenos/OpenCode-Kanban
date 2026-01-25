import fs from 'fs';
import path from 'path';
import os from 'os';
import { IOpenCodeRepository } from './repository';
import { OpenCodeProject, OpenCodeSession } from './types';
import { ProjectSchema, SessionSchema } from './schemas';

// Default path if not provided
const DEFAULT_STORAGE_PATH = path.join(os.homedir(), '.local/share/opencode/storage');

export class LocalOpenCodeAdapter implements IOpenCodeRepository {
  private readonly storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || DEFAULT_STORAGE_PATH;
  }

  async getAllProjects(): Promise<OpenCodeProject[]> {
    const projectDir = path.join(this.storagePath, 'project');
    if (!fs.existsSync(projectDir)) return [];

    const projects: OpenCodeProject[] = [];
    const files = await fs.promises.readdir(projectDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.promises.readFile(path.join(projectDir, file), 'utf-8');
        const raw = JSON.parse(content);
        
        // Zod Validation (Edge Check)
        const result = ProjectSchema.safeParse(raw);
        if (result.success) {
          projects.push(result.data);
        } else {
          console.warn(`Invalid project file ${file}:`, result.error.flatten());
        }
      } catch (error) {
        console.error(`Failed to read project ${file}`, error);
      }
    }
    return projects;
  }

  async getAllSessions(): Promise<OpenCodeSession[]> {
    const sessionBaseDir = path.join(this.storagePath, 'session');
    if (!fs.existsSync(sessionBaseDir)) return [];

    const sessionsMap = new Map<string, OpenCodeSession>();

    // Helper to process a directory of session files
    const processDir = async (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      const files = await fs.promises.readdir(dirPath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = await fs.promises.readFile(path.join(dirPath, file), 'utf-8');
          const raw = JSON.parse(content);
          
          // Zod Validation
          const result = SessionSchema.safeParse(raw);
          if (result.success) {
            sessionsMap.set(result.data.id, result.data);
          }
        } catch (error) {
          // Silent fail for unreadable files
        }
      }
    };

    // 1. Global Sessions
    await processDir(path.join(sessionBaseDir, 'global'));

    // 2. Project Sessions
    const dirs = await fs.promises.readdir(sessionBaseDir);
    for (const dir of dirs) {
      if (dir === 'global' || dir.startsWith('.')) continue;
      const projectPath = path.join(sessionBaseDir, dir);
      if ((await fs.promises.stat(projectPath)).isDirectory()) {
        await processDir(projectPath);
      }
    }

    return Array.from(sessionsMap.values())
      .sort((a, b) => b.time.updated - a.time.updated);
  }

  async getSessionById(id: string): Promise<OpenCodeSession | null> {
    // This is tricky because we don't know which subfolder the session is in.
    // Efficient strategy: Search global first, then iterate projects? 
    // OR just use getAllSessions and find? (Slow for one item)
    // For local FS with 8k files, getAllSessions might be acceptable for v1, 
    // but a direct lookup would be better if we knew the projectID.
    
    // For now, let's implement via getAllSessions to ensure correctness
    // Optimization: In Phase 2, we can maintain a cached index.
    const all = await this.getAllSessions();
    return all.find(s => s.id === id) || null;
  }
}
