import fs from 'fs';
import path from 'path';
import os from 'os';
import { IOpenCodeRepository } from './repository';
import { OpenCodeProject, OpenCodeSession, OpenCodeMessageWithParts, OpenCodeMessagePart } from './types';
import { ProjectSchema, SessionSchema, MessageSchema, MessagePartSchema } from './schemas';
import { logger } from '@/lib/logger';
import { now } from '@/lib/date-utils';

// Default path if not provided
const DEFAULT_STORAGE_PATH = path.join(os.homedir(), '.local/share/opencode/storage');

// Session index entry: maps sessionId to file path for O(1) lookup
interface SessionIndexEntry {
  filePath: string;
  updatedAt: number;
}

// Module-level cache shared across adapter instances (singleton pattern)
// This avoids rebuilding the index on every API request
let sessionIndex: Map<string, SessionIndexEntry> | null = null;
let sessionIndexBuiltAt: number = 0;
const SESSION_INDEX_TTL_MS = 60_000; // 1 minute TTL for cache freshness

export class LocalOpenCodeAdapter implements IOpenCodeRepository {
  private readonly storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || DEFAULT_STORAGE_PATH;
  }

  /**
   * Build or refresh the session index.
   * Maps sessionId → filePath for O(1) lookups instead of O(N) iteration.
   * Uses module-level cache with TTL for efficiency across requests.
   */
  private async ensureSessionIndex(): Promise<Map<string, SessionIndexEntry>> {
    const timestamp = now();
    
    // Return cached index if still valid
    if (sessionIndex && (timestamp - sessionIndexBuiltAt) < SESSION_INDEX_TTL_MS) {
      return sessionIndex;
    }

    logger.debug('Building session index', { storagePath: this.storagePath });
    const startTime = performance.now();
    
    const newIndex = new Map<string, SessionIndexEntry>();
    const sessionBaseDir = path.join(this.storagePath, 'session');
    
    if (!fs.existsSync(sessionBaseDir)) {
      sessionIndex = newIndex;
      sessionIndexBuiltAt = timestamp;
      return newIndex;
    }

    // Index a directory of session files (only reads filename, not content)
    const indexDir = async (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      const files = await fs.promises.readdir(dirPath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(dirPath, file);
        // Extract session ID from filename (e.g., "ses_abc123.json" → "ses_abc123")
        const sessionId = file.replace('.json', '');
        
        try {
          const stat = await fs.promises.stat(filePath);
          newIndex.set(sessionId, {
            filePath,
            updatedAt: stat.mtimeMs
          });
        } catch (error) {
          // File may have been deleted between readdir and stat - skip
          logger.debug('Session file stat failed, skipping', { filePath, error: String(error) });
        }
      }
    };

    // 1. Index global sessions
    await indexDir(path.join(sessionBaseDir, 'global'));

    // 2. Index project sessions
    const dirs = await fs.promises.readdir(sessionBaseDir);
    for (const dir of dirs) {
      if (dir === 'global' || dir.startsWith('.')) continue;
      const projectPath = path.join(sessionBaseDir, dir);
      try {
        if ((await fs.promises.stat(projectPath)).isDirectory()) {
          await indexDir(projectPath);
        }
      } catch (error) {
        // Directory may have been deleted - skip
        logger.debug('Project directory stat failed, skipping', { projectPath, error: String(error) });
      }
    }

    const elapsed = performance.now() - startTime;
    logger.debug('Session index built', { 
      entries: newIndex.size, 
      durationMs: Math.round(elapsed) 
    });

    sessionIndex = newIndex;
    sessionIndexBuiltAt = timestamp;
    return newIndex;
  }

  /**
   * Invalidate the session index cache.
   * Call this after operations that modify session files.
   */
  static invalidateSessionIndex(): void {
    sessionIndex = null;
    sessionIndexBuiltAt = 0;
    logger.debug('Session index invalidated');
  }

  async getAllProjects(): Promise<OpenCodeProject[]> {
    const projectDir = path.join(this.storagePath, 'project');
    if (!fs.existsSync(projectDir)) return [];

    const projects: OpenCodeProject[] = [];
    
    let files: string[];
    try {
      files = await fs.promises.readdir(projectDir);
    } catch (error) {
      logger.error('Failed to read project directory', { 
        projectDir, 
        error: String(error) 
      });
      return []; // Graceful degradation
    }

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
          logger.warn('Invalid project file', { file, errors: result.error.flatten() });
        }
      } catch (error) {
        logger.error('Failed to read project file', { file, error: String(error) });
      }
    }
    return projects;
  }

  async getAllSessions(query?: string): Promise<OpenCodeSession[]> {
    const sessionBaseDir = path.join(this.storagePath, 'session');
    if (!fs.existsSync(sessionBaseDir)) return [];

    const sessionsMap = new Map<string, OpenCodeSession>();
    const searchTerm = query?.toLowerCase().trim();

    const processDir = async (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      
      let files: string[];
      try {
        files = await fs.promises.readdir(dirPath);
      } catch (error) {
        logger.debug('Directory read failed, skipping', { dirPath, error: String(error) });
        return;
      }
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = await fs.promises.readFile(path.join(dirPath, file), 'utf-8');
          const raw = JSON.parse(content);
          
          const result = SessionSchema.safeParse(raw);
          if (result.success) {
            const session = result.data;
            
            if (searchTerm) {
              const matchesTitle = session.title.toLowerCase().includes(searchTerm);
              const matchesId = session.id.toLowerCase().includes(searchTerm);
              if (!matchesTitle && !matchesId) continue;
            }
            
            sessionsMap.set(session.id, session);
          }
        } catch (error) {
          logger.warn('Failed to read/parse session file', { dirPath, file, error: String(error) });
        }
      }
    };

    await processDir(path.join(sessionBaseDir, 'global'));

    let dirs: string[];
    try {
      dirs = await fs.promises.readdir(sessionBaseDir);
    } catch (error) {
      logger.error('Failed to read session base directory', { 
        sessionBaseDir, 
        error: String(error) 
      });
      return Array.from(sessionsMap.values())
        .sort((a, b) => b.time.updated - a.time.updated);
    }

    for (const dir of dirs) {
      if (dir === 'global' || dir.startsWith('.')) continue;
      const projectPath = path.join(sessionBaseDir, dir);
      try {
        if ((await fs.promises.stat(projectPath)).isDirectory()) {
          await processDir(projectPath);
        }
      } catch {
        logger.debug('Directory stat failed, skipping', { projectPath });
      }
    }

    return Array.from(sessionsMap.values())
      .sort((a, b) => b.time.updated - a.time.updated);
  }

  async getSessionById(id: string): Promise<OpenCodeSession | null> {
    const index = await this.ensureSessionIndex();
    const entry = index.get(id);
    
    if (!entry) {
      return null;
    }

    try {
      const content = await fs.promises.readFile(entry.filePath, 'utf-8');
      const raw = JSON.parse(content);
      const result = SessionSchema.safeParse(raw);
      
      if (result.success) {
        return result.data;
      }
      
      logger.warn('Session file failed validation', { id, filePath: entry.filePath });
      return null;
    } catch (error) {
      logger.warn('Failed to read session file', { id, filePath: entry.filePath, error: String(error) });
      return null;
    }
  }

  async getSessionMessages(sessionId: string): Promise<OpenCodeMessageWithParts[]> {
    const messageDir = path.join(this.storagePath, 'message', sessionId);
    if (!fs.existsSync(messageDir)) return [];

    const messages: OpenCodeMessageWithParts[] = [];

    let files: string[];
    try {
      files = await fs.promises.readdir(messageDir);
    } catch (error) {
      logger.debug('Failed to read message directory', { messageDir, error: String(error) });
      return [];
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.promises.readFile(path.join(messageDir, file), 'utf-8');
        const raw = JSON.parse(content);
        const result = MessageSchema.safeParse(raw);
        
        if (result.success) {
          const parts = await this.getMessageParts(result.data.id);
          messages.push({ ...result.data, parts });
        }
      } catch (error) {
        logger.debug('Failed to read message file', { file, error: String(error) });
      }
    }

    return messages.sort((a, b) => a.time.created - b.time.created);
  }

  private async getMessageParts(messageId: string): Promise<OpenCodeMessagePart[]> {
    const partDir = path.join(this.storagePath, 'part', messageId);
    if (!fs.existsSync(partDir)) return [];

    const parts: OpenCodeMessagePart[] = [];

    let files: string[];
    try {
      files = await fs.promises.readdir(partDir);
    } catch {
      return [];
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.promises.readFile(path.join(partDir, file), 'utf-8');
        const raw = JSON.parse(content);
        const result = MessagePartSchema.safeParse(raw);
        
        if (result.success) {
          parts.push(result.data);
        }
      } catch {
        continue;
      }
    }

    return parts.sort((a, b) => a.time.start - b.time.start);
  }
}
