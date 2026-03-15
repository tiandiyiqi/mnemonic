import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { execa } from 'execa';
import { SourceInfo } from './types.js';

export async function cloneRepo(
  source: SourceInfo,
  targetDir?: string
): Promise<string> {
  const cloneUrl = getCloneUrl(source);
  const repoName = source.repo || path.basename(cloneUrl, '.git');
  const cloneDir = targetDir || path.join(os.tmpdir(), 'mnemonic-skills', repoName);
  
  await fs.ensureDir(path.dirname(cloneDir));
  
  if (await fs.pathExists(cloneDir)) {
    await fs.remove(cloneDir);
  }
  
  try {
    await execa('git', ['clone', '--depth', '1', cloneUrl, cloneDir], {
      stdio: 'pipe',
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
    throw error;
  }
  
  return cloneDir;
}

export async function getLatestCommit(repoDir: string): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', 'HEAD'], {
      cwd: repoDir,
    });
    return stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get latest commit: ${error.message}`);
    }
    throw error;
  }
}

export async function getRemoteUrl(repoDir: string): Promise<string> {
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], {
      cwd: repoDir,
    });
    return stdout.trim();
  } catch {
    return '';
  }
}

function getCloneUrl(source: SourceInfo): string {
  switch (source.type) {
    case 'github':
      return `https://github.com/${source.owner}/${source.repo}.git`;
    case 'gitlab':
      return `https://gitlab.com/${source.owner}/${source.repo}.git`;
    case 'git':
      return source.url;
    default:
      throw new Error(`Cannot clone source type: ${source.type}`);
  }
}

export async function cleanupTempRepo(repoDir: string): Promise<void> {
  const tempSkillsDir = path.join(os.tmpdir(), 'mnemonic-skills');
  if (repoDir.startsWith(tempSkillsDir)) {
    await fs.remove(repoDir);
  }
}
