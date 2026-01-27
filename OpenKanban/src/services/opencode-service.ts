import type { IOpenCodeRepository } from '../contract/opencode/repository';
import type { OpenCodeProject, OpenCodeSession, OpenCodeMessageWithParts } from '../contract/opencode/types';

export class OpenCodeService {
  constructor(private readonly adapter: IOpenCodeRepository) {}

  async getAllSessions(query?: string): Promise<OpenCodeSession[]> {
    return this.adapter.getAllSessions(query);
  }

  async getAllProjects(): Promise<OpenCodeProject[]> {
    return this.adapter.getAllProjects();
  }

  async getSessionById(id: string): Promise<OpenCodeSession | null> {
    return this.adapter.getSessionById(id);
  }

  async getSessionMessages(sessionId: string): Promise<OpenCodeMessageWithParts[]> {
    return this.adapter.getSessionMessages(sessionId);
  }
}
