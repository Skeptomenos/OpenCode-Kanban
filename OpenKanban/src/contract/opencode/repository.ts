import { OpenCodeProject, OpenCodeSession, OpenCodeMessageWithParts } from './types';

export interface IOpenCodeRepository {
  getAllSessions(query?: string): Promise<OpenCodeSession[]>;
  getAllProjects(): Promise<OpenCodeProject[]>;
  getSessionById(id: string): Promise<OpenCodeSession | null>;
  getSessionMessages(sessionId: string): Promise<OpenCodeMessageWithParts[]>;
}
