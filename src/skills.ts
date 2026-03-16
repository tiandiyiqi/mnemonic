import path from 'path';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { Skill, SourceInfo } from './types.js';
import { cloneRepo, cleanupTempRepo } from './git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILL_SEARCH_PATHS = [
  '',
  'skills',
  'skills/.curated',
  'skills/.experimental',
  'skills/.system',
  '.agents/skills',
  '.agent/skills',
  '.augment/skills',
  '.claude/skills',
  '.claude/commands',
  '.codebuddy/skills',
  '.commandcode/skills',
  '.continue/skills',
  '.cortex/skills',
  '.crush/skills',
  '.factory/skills',
  '.goose/skills',
  '.junie/skills',
  '.iflow/skills',
  '.kilocode/skills',
  '.kiro/skills',
  '.kode/skills',
  '.mcpjam/skills',
  '.vibe/skills',
  '.mux/skills',
  '.openhands/skills',
  '.pi/skills',
  '.qoder/skills',
  '.qwen/skills',
  '.roo/skills',
  '.trae/skills',
  '.windsurf/skills',
  '.zencoder/skills',
  '.neovate/skills',
  '.pochi/skills',
  '.adal/skills',
];

const PLUGIN_MANIFEST_PATHS = [
  '.claude-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
];

export async function discoverSkills(source: SourceInfo): Promise<Skill[]> {
  const repoPath = await getRepoPath(source);
  const skills: Skill[] = [];
  
  const pluginSkills = await discoverFromPluginManifests(repoPath);
  skills.push(...pluginSkills);
  
  const pathSkills = await discoverFromSearchPaths(repoPath);
  skills.push(...pathSkills);
  
  const rootSkill = await discoverFromRoot(repoPath);
  if (rootSkill) {
    const exists = skills.some((s) => s.name === rootSkill.name);
    if (!exists) {
      skills.unshift(rootSkill);
    }
  }
  
  if (source.type !== 'local') {
    await cleanupTempRepo(repoPath);
  }
  
  return skills.filter((skill) => skill.name && skill.description);
}

async function getRepoPath(source: SourceInfo): Promise<string> {
  if (source.type === 'local') {
    return source.url;
  }
  
  let repoPath = await cloneRepo(source);
  
  if (source.subpath) {
    repoPath = path.join(repoPath, source.subpath);
  }
  
  return repoPath;
}

async function discoverFromRoot(repoPath: string): Promise<Skill | null> {
  const skillPath = path.join(repoPath, 'SKILL.md');
  
  if (await fs.pathExists(skillPath)) {
    const skill = await parseSkillFile(skillPath);
    if (skill) {
      skill.sourcePath = repoPath;
      return skill;
    }
  }
  
  return null;
}

async function discoverFromSearchPaths(repoPath: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  
  for (const searchPath of SKILL_SEARCH_PATHS) {
    const fullPath = searchPath ? path.join(repoPath, searchPath) : repoPath;
    
    if (!(await fs.pathExists(fullPath))) {
      continue;
    }
    
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        
        const skillFilePath = path.join(fullPath, entry.name, 'SKILL.md');
        
        if (await fs.pathExists(skillFilePath)) {
          const skill = await parseSkillFile(skillFilePath);
          if (skill) {
            const exists = skills.some((s) => s.name === skill.name);
            if (!exists) {
              skills.push(skill);
            }
          }
        }
      }
    }
  }
  
  return skills;
}

async function discoverFromPluginManifests(repoPath: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  
  for (const manifestPath of PLUGIN_MANIFEST_PATHS) {
    const fullPath = path.join(repoPath, manifestPath);
    
    if (!(await fs.pathExists(fullPath))) {
      continue;
    }
    
    try {
      const content = await fs.readJson(fullPath);
      const pluginRoot = content.metadata?.pluginRoot || '.';
      const plugins = content.plugins || [];
      
      for (const plugin of plugins) {
        const pluginSkills = plugin.skills || [];
        
        for (const skillPath of pluginSkills) {
          const fullSkillPath = path.join(repoPath, pluginRoot, skillPath);
          const skillFilePath = path.join(fullSkillPath, 'SKILL.md');
          
          if (await fs.pathExists(skillFilePath)) {
            const skill = await parseSkillFile(skillFilePath);
            if (skill) {
              const exists = skills.some((s) => s.name === skill.name);
              if (!exists) {
                skills.push(skill);
              }
            }
          }
        }
      }
    } catch {
      continue;
    }
  }
  
  return skills;
}

export async function parseSkillFile(skillFilePath: string): Promise<Skill | null> {
  try {
    const content = await fs.readFile(skillFilePath, 'utf-8');
    const { data, content: body } = matter(content);
    
    const name = data.name || path.basename(path.dirname(skillFilePath));
    const description = data.description || extractDescription(body);
    
    if (!name || !description) {
      return null;
    }
    
    const skillDir = path.dirname(skillFilePath);
    
    return {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      path: skillFilePath,
      sourcePath: skillDir,
      metadata: data,
      internal: data.metadata?.internal === true,
    };
  } catch (error) {
    return null;
  }
}

function extractDescription(body: string): string {
  const lines = body.split('\n').filter((line) => line.trim());
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      return trimmed.slice(0, 200);
    }
  }
  
  return '';
}

export async function getSkillByName(
  source: SourceInfo,
  skillName: string
): Promise<Skill | null> {
  const skills = await discoverSkills(source);
  return skills.find((s) => s.name === skillName) || null;
}

export async function getBuiltInSkills(): Promise<Skill[]> {
  const packageRoot = path.resolve(__dirname, '..');
  const skillsDir = path.join(packageRoot, 'skills');
  
  if (!(await fs.pathExists(skillsDir))) {
    return [];
  }
  
  const skills: Skill[] = [];
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    
    const skillFilePath = path.join(skillsDir, entry.name, 'SKILL.md');
    
    if (await fs.pathExists(skillFilePath)) {
      const skill = await parseSkillFile(skillFilePath);
      if (skill) {
        skill.sourcePath = path.join(skillsDir, entry.name);
        skills.push(skill);
      }
    }
  }
  
  return skills;
}
