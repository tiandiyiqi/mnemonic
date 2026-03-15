import { PathLike } from 'fs-extra';

export interface Agent {
  name: string;
  displayName: string;
  projectPath: string;
  globalPath: string;
  detected?: boolean;
}

export interface Skill {
  name: string;
  description: string;
  path: string;
  sourcePath: string;
  metadata?: Record<string, unknown>;
  internal?: boolean;
}

export interface SourceInfo {
  type: 'github' | 'gitlab' | 'local' | 'git' | 'npm';
  url: string;
  repo?: string;
  owner?: string;
  branch?: string;
  subpath?: string;
}

export interface AddOptions {
  source: string;
  global?: boolean;
  agent?: string[];
  skill?: string[];
  list?: boolean;
  copy?: boolean;
  yes?: boolean;
  all?: boolean;
}

export interface ListOptions {
  global?: boolean;
  agent?: string[];
}

export interface RemoveOptions {
  skills?: string[];
  global?: boolean;
  agent?: string[];
  yes?: boolean;
  all?: boolean;
}

export interface InstallResult {
  skill: Skill;
  agent: Agent;
  targetPath: string;
  method: 'symlink' | 'copy';
}

export interface SkillLock {
  version: string;
  installed: {
    name: string;
    source: string;
    commit?: string;
    installedAt: string;
    agents: string[];
  }[];
}
