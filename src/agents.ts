import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { Agent } from './types.js';

export const AGENTS: Agent[] = [
  {
    name: 'trae',
    displayName: 'Trae',
    projectPath: '.trae/skills/',
    globalPath: path.join(os.homedir(), '.trae', 'skills'),
  },
  {
    name: 'trae-cn',
    displayName: 'Trae CN',
    projectPath: '.trae/skills/',
    globalPath: path.join(os.homedir(), '.trae-cn', 'skills'),
  },
  {
    name: 'claude-code',
    displayName: 'Claude Code',
    projectPath: '.claude/skills/',
    globalPath: path.join(os.homedir(), '.claude', 'skills'),
  },
  {
    name: 'cursor',
    displayName: 'Cursor',
    projectPath: '.cursor/skills/',
    globalPath: path.join(os.homedir(), '.cursor', 'skills'),
  },
  {
    name: 'codex',
    displayName: 'Codex',
    projectPath: '.codex/skills/',
    globalPath: path.join(os.homedir(), '.codex', 'skills'),
  },
  {
    name: 'cline',
    displayName: 'Cline',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.agents', 'skills'),
  },
  {
    name: 'windsurf',
    displayName: 'Windsurf',
    projectPath: '.windsurf/skills/',
    globalPath: path.join(os.homedir(), '.codeium', 'windsurf', 'skills'),
  },
  {
    name: 'augment',
    displayName: 'Augment',
    projectPath: '.augment/skills/',
    globalPath: path.join(os.homedir(), '.augment', 'skills'),
  },
  {
    name: 'continue',
    displayName: 'Continue',
    projectPath: '.continue/skills/',
    globalPath: path.join(os.homedir(), '.continue', 'skills'),
  },
  {
    name: 'goose',
    displayName: 'Goose',
    projectPath: '.goose/skills/',
    globalPath: path.join(os.homedir(), '.config', 'goose', 'skills'),
  },
  {
    name: 'opencode',
    displayName: 'OpenCode',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'opencode', 'skills'),
  },
  {
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.gemini', 'skills'),
  },
  {
    name: 'roo',
    displayName: 'Roo Code',
    projectPath: '.roo/skills/',
    globalPath: path.join(os.homedir(), '.roo', 'skills'),
  },
  {
    name: 'junie',
    displayName: 'Junie',
    projectPath: '.junie/skills/',
    globalPath: path.join(os.homedir(), '.junie', 'skills'),
  },
  {
    name: 'kiro-cli',
    displayName: 'Kiro CLI',
    projectPath: '.kiro/skills/',
    globalPath: path.join(os.homedir(), '.kiro', 'skills'),
  },
  {
    name: 'qwen-code',
    displayName: 'Qwen Code',
    projectPath: '.qwen/skills/',
    globalPath: path.join(os.homedir(), '.qwen', 'skills'),
  },
  {
    name: 'openhands',
    displayName: 'OpenHands',
    projectPath: '.openhands/skills/',
    globalPath: path.join(os.homedir(), '.openhands', 'skills'),
  },
  {
    name: 'amp',
    displayName: 'Amp',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'agents', 'skills'),
  },
  {
    name: 'universal',
    displayName: 'Universal',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'agents', 'skills'),
  },
];

const AGENT_DETECTION_PATHS: Record<string, string[]> = {
  'trae': ['.trae/rules', '.trae/settings.json'],
  'trae-cn': ['.trae/rules', '.trae/settings.json'],
  'claude-code': ['.claude/settings.json', '.claude/commands'],
  'cursor': ['.cursorrules', '.cursor/rules', '.cursor/settings.json'],
  'codex': ['.codex/config.json', '.codexrc'],
  'cline': ['.clinerules', '.cline/config.json'],
  'windsurf': ['.windsurfrules', '.windsurf/rules'],
  'augment': ['.augment/config.json'],
  'continue': ['.continue/config.json', 'continue.json'],
  'goose': ['.goose/config.yaml'],
  'opencode': ['.opencode.json', 'opencode.json'],
  'gemini-cli': ['.gemini/config.json'],
  'roo': ['.roo/config.json'],
  'junie': ['.junie/config.json'],
  'kiro-cli': ['.kiro/config.json'],
  'qwen-code': ['.qwen/config.json'],
  'openhands': ['.openhands/config.json'],
  'amp': ['.amp/config.json'],
};

export async function detectInstalledAgents(): Promise<Agent[]> {
  const detected: Agent[] = [];
  const cwd = process.cwd();
  
  for (const agent of AGENTS) {
    const detectionPaths = AGENT_DETECTION_PATHS[agent.name] || [];
    let isDetected = false;
    
    for (const detectionPath of detectionPaths) {
      const projectPath = path.join(cwd, detectionPath);
      const globalPath = path.join(os.homedir(), detectionPath);
      
      if (await fs.pathExists(projectPath)) {
        isDetected = true;
        break;
      }
      
      if (await fs.pathExists(globalPath)) {
        isDetected = true;
        break;
      }
    }
    
    if (isDetected) {
      detected.push({ ...agent, detected: true });
    }
  }
  
  return detected;
}

export function getAgentByName(name: string): Agent | undefined {
  return AGENTS.find((agent) => agent.name === name);
}

export function getAgentSkillPath(agent: Agent, global: boolean): string {
  return global ? agent.globalPath : agent.projectPath;
}

export function resolveAgentPath(
  agent: Agent,
  global: boolean,
  projectRoot?: string
): string {
  if (global) {
    return agent.globalPath;
  }
  return path.join(projectRoot || process.cwd(), agent.projectPath);
}

export function getAgentsByNames(names: string[]): Agent[] {
  if (names.includes('*')) {
    return AGENTS;
  }
  
  return names
    .map((name) => getAgentByName(name))
    .filter((agent): agent is Agent => agent !== undefined);
}
