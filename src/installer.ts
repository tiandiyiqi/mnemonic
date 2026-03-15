import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { Agent, Skill, InstallResult, SkillLock } from './types.js';
import { resolveAgentPath } from './agents.js';

const LOCK_FILE_NAME = 'skills-lock.json';
const LOCK_VERSION = '1.0.0';

export async function installSkill(
  skill: Skill,
  agents: Agent[],
  options: {
    global: boolean;
    copy: boolean;
    source: string;
    commit?: string;
  }
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  
  const sourceDir = path.resolve(process.cwd(), skill.sourcePath);
  
  for (const agent of agents) {
    const targetDir = resolveAgentPath(agent, options.global);
    const skillDir = path.join(targetDir, skill.name);
    
    try {
      await fs.ensureDir(targetDir);
    } catch (dirError) {
      throw new Error(`Failed to create directory ${targetDir}: ${dirError instanceof Error ? dirError.message : String(dirError)}`);
    }
    
    if (await fs.pathExists(skillDir)) {
      try {
        const stat = await fs.lstat(skillDir);
        if (stat.isSymbolicLink()) {
          await fs.unlink(skillDir);
        } else {
          await fs.remove(skillDir);
        }
      } catch {
        await fs.remove(skillDir);
      }
    }
    
    if (options.copy) {
      await fs.copy(sourceDir, skillDir);
    } else {
      await createSymlink(sourceDir, skillDir);
    }
    
    results.push({
      skill,
      agent,
      targetPath: skillDir,
      method: options.copy ? 'copy' : 'symlink',
    });
  }
  
  await updateLockFile(skill, agents, options);
  
  return results;
}

async function createSymlink(source: string, target: string): Promise<void> {
  if (await fs.pathExists(target)) {
    try {
      const stat = await fs.lstat(target);
      if (stat.isSymbolicLink()) {
        await fs.unlink(target);
      } else {
        await fs.remove(target);
      }
    } catch {
      await fs.remove(target);
    }
  }
  
  try {
    await fs.symlink(source, target);
  } catch (error) {
    try {
      await fs.copy(source, target);
    } catch (copyError) {
      throw new Error(`Failed to create symlink or copy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function updateLockFile(
  skill: Skill,
  agents: Agent[],
  options: {
    global: boolean;
    source: string;
    commit?: string;
  }
): Promise<void> {
  const lockPath = getLockPath(options.global);
  
  let lock: SkillLock;
  
  if (await fs.pathExists(lockPath)) {
    lock = await fs.readJson(lockPath);
  } else {
    lock = {
      version: LOCK_VERSION,
      installed: [],
    };
  }
  
  const existingIndex = lock.installed.findIndex((i) => i.name === skill.name);
  
  const entry = {
    name: skill.name,
    source: options.source,
    commit: options.commit,
    installedAt: new Date().toISOString(),
    agents: agents.map((a) => a.name),
  };
  
  if (existingIndex >= 0) {
    lock.installed[existingIndex] = entry;
  } else {
    lock.installed.push(entry);
  }
  
  await fs.ensureDir(path.dirname(lockPath));
  await fs.writeJson(lockPath, lock, { spaces: 2 });
}

export async function getLockFile(global: boolean): Promise<SkillLock | null> {
  const lockPath = getLockPath(global);
  
  if (!(await fs.pathExists(lockPath))) {
    return null;
  }
  
  return fs.readJson(lockPath);
}

export function getLockPath(global: boolean): string {
  if (global) {
    return path.join(os.homedir(), '.mnemonic', LOCK_FILE_NAME);
  }
  return path.join(process.cwd(), '.mnemonic', LOCK_FILE_NAME);
}

export async function removeSkillFromLock(
  skillName: string,
  global: boolean
): Promise<void> {
  const lock = await getLockFile(global);
  
  if (!lock) {
    return;
  }
  
  lock.installed = lock.installed.filter((i) => i.name !== skillName);
  
  const lockPath = getLockPath(global);
  
  if (lock.installed.length === 0) {
    await fs.remove(lockPath);
  } else {
    await fs.writeJson(lockPath, lock, { spaces: 2 });
  }
}

export async function isSkillInstalled(
  skillName: string,
  agent: Agent,
  global: boolean
): Promise<boolean> {
  const targetDir = resolveAgentPath(agent, global);
  const skillDir = path.join(targetDir, skillName);
  return fs.pathExists(skillDir);
}

export async function getInstalledSkillPath(
  skillName: string,
  agent: Agent,
  global: boolean
): Promise<string | null> {
  const targetDir = resolveAgentPath(agent, global);
  const skillDir = path.join(targetDir, skillName);
  
  if (await fs.pathExists(skillDir)) {
    return skillDir;
  }
  
  return null;
}
