/**
 * OpenCode Service Layer
 * @see ralph-wiggum/specs/354-service-completion.md:L10-26
 */

import type { IOpenCodeRepository } from '../contract/opencode/repository';
import type { OpenCodeProject, OpenCodeSession } from '../contract/opencode/types';

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
}
