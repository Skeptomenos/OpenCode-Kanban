export interface Session {
  id: string;
  title: string;
  slug: string;
  projectID: string;
  directory: string;
  parentID?: string;
  time: {
    created: number;
    updated: number;
  };
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

export interface Project {
  id: string;
  worktree: string;
  icon?: {
    color: string;
    url?: string;
  };
  time?: {
    created: number;
    updated: number;
  };
}

export interface SessionAPIResponse {
  sessions: Session[];
  projects: Project[];
  debug?: string[];
}
