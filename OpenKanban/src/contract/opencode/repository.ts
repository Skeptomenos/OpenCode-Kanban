import { OpenCodeProject, OpenCodeSession } from './types';

export interface IOpenCodeRepository {
  /**
   * Get all available sessions from storage.
   * Sorted by updated time (descending).
   */
  getAllSessions(): Promise<OpenCodeSession[]>;

  /**
   * Get all registered projects.
   */
  getAllProjects(): Promise<OpenCodeProject[]>;

  /**
   * Get a single session by ID.
   * Returns null if not found.
   */
  getSessionById(id: string): Promise<OpenCodeSession | null>;
}
