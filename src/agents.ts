import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { Agent } from './types.js';

export const AGENTS: Agent[] = [
  {
    name: 'amp',
    displayName: 'Amp',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'agents', 'skills'),
  },
  {
    name: 'antigravity',
    displayName: 'Antigravity',
    projectPath: '.agent/skills/',
    globalPath: path.join(os.homedir(), '.gemini', 'antigravity', 'skills'),
  },
  {
    name: 'augment',
    displayName: 'Augment',
    projectPath: '.augment/skills/',
    globalPath: path.join(os.homedir(), '.augment', 'skills'),
  },
  {
    name: 'claude-code',
    displayName: 'Claude Code',
    projectPath: '.claude/skills/',
    globalPath: path.join(os.homedir(), '.claude', 'skills'),
  },
  {
    name: 'cline',
    displayName: 'Cline',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.agents', 'skills'),
  },
  {
    name: 'codebuddy',
    displayName: 'CodeBuddy',
    projectPath: '.codebuddy/skills/',
    globalPath: path.join(os.homedir(), '.codebuddy', 'skills'),
  },
  {
    name: 'codex',
    displayName: 'Codex',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.codex', 'skills'),
  },
  {
    name: 'command-code',
    displayName: 'Command Code',
    projectPath: '.commandcode/skills/',
    globalPath: path.join(os.homedir(), '.commandcode', 'skills'),
  },
  {
    name: 'continue',
    displayName: 'Continue',
    projectPath: '.continue/skills/',
    globalPath: path.join(os.homedir(), '.continue', 'skills'),
  },
  {
    name: 'cortex',
    displayName: 'Cortex Code',
    projectPath: '.cortex/skills/',
    globalPath: path.join(os.homedir(), '.snowflake', 'cortex', 'skills'),
  },
  {
    name: 'crush',
    displayName: 'Crush',
    projectPath: '.crush/skills/',
    globalPath: path.join(os.homedir(), '.config', 'crush', 'skills'),
  },
  {
    name: 'cursor',
    displayName: 'Cursor',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.cursor', 'skills'),
  },
  {
    name: 'droid',
    displayName: 'Droid',
    projectPath: '.factory/skills/',
    globalPath: path.join(os.homedir(), '.factory', 'skills'),
  },
  {
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.gemini', 'skills'),
  },
  {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.copilot', 'skills'),
  },
  {
    name: 'goose',
    displayName: 'Goose',
    projectPath: '.goose/skills/',
    globalPath: path.join(os.homedir(), '.config', 'goose', 'skills'),
  },
  {
    name: 'junie',
    displayName: 'Junie',
    projectPath: '.junie/skills/',
    globalPath: path.join(os.homedir(), '.junie', 'skills'),
  },
  {
    name: 'iflow-cli',
    displayName: 'iFlow CLI',
    projectPath: '.iflow/skills/',
    globalPath: path.join(os.homedir(), '.iflow', 'skills'),
  },
  {
    name: 'kimi-cli',
    displayName: 'Kimi Code CLI',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'agents', 'skills'),
  },
  {
    name: 'kilo',
    displayName: 'Kilo Code',
    projectPath: '.kilocode/skills/',
    globalPath: path.join(os.homedir(), '.kilocode', 'skills'),
  },
  {
    name: 'kiro-cli',
    displayName: 'Kiro CLI',
    projectPath: '.kiro/skills/',
    globalPath: path.join(os.homedir(), '.kiro', 'skills'),
  },
  {
    name: 'kode',
    displayName: 'Kode',
    projectPath: '.kode/skills/',
    globalPath: path.join(os.homedir(), '.kode', 'skills'),
  },
  {
    name: 'mcpjam',
    displayName: 'MCPJam',
    projectPath: '.mcpjam/skills/',
    globalPath: path.join(os.homedir(), '.mcpjam', 'skills'),
  },
  {
    name: 'mistral-vibe',
    displayName: 'Mistral Vibe',
    projectPath: '.vibe/skills/',
    globalPath: path.join(os.homedir(), '.vibe', 'skills'),
  },
  {
    name: 'mux',
    displayName: 'Mux',
    projectPath: '.mux/skills/',
    globalPath: path.join(os.homedir(), '.mux', 'skills'),
  },
  {
    name: 'opencode',
    displayName: 'OpenCode',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'opencode', 'skills'),
  },
  {
    name: 'openhands',
    displayName: 'OpenHands',
    projectPath: '.openhands/skills/',
    globalPath: path.join(os.homedir(), '.openhands', 'skills'),
  },
  {
    name: 'openclaw',
    displayName: 'OpenClaw',
    projectPath: 'skills/',
    globalPath: path.join(os.homedir(), '.openclaw', 'skills'),
  },
  {
    name: 'pi',
    displayName: 'Pi',
    projectPath: '.pi/skills/',
    globalPath: path.join(os.homedir(), '.pi', 'agent', 'skills'),
  },
  {
    name: 'qoder',
    displayName: 'Qoder',
    projectPath: '.qoder/skills/',
    globalPath: path.join(os.homedir(), '.qoder', 'skills'),
  },
  {
    name: 'qwen-code',
    displayName: 'Qwen Code',
    projectPath: '.qwen/skills/',
    globalPath: path.join(os.homedir(), '.qwen', 'skills'),
  },
  {
    name: 'replit',
    displayName: 'Replit',
    projectPath: '.agents/skills/',
    globalPath: path.join(os.homedir(), '.config', 'agents', 'skills'),
  },
  {
    name: 'roo',
    displayName: 'Roo Code',
    projectPath: '.roo/skills/',
    globalPath: path.join(os.homedir(), '.roo', 'skills'),
  },
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
    name: 'warp',
    displayName: 'Warp',
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
    name: 'zencoder',
    displayName: 'Zencoder',
    projectPath: '.zencoder/skills/',
    globalPath: path.join(os.homedir(), '.zencoder', 'skills'),
  },
  {
    name: 'neovate',
    displayName: 'Neovate',
    projectPath: '.neovate/skills/',
    globalPath: path.join(os.homedir(), '.neovate', 'skills'),
  },
  {
    name: 'pochi',
    displayName: 'Pochi',
    projectPath: '.pochi/skills/',
    globalPath: path.join(os.homedir(), '.pochi', 'skills'),
  },
  {
    name: 'adal',
    displayName: 'AdaL',
    projectPath: '.adal/skills/',
    globalPath: path.join(os.homedir(), '.adal', 'skills'),
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
  'antigravity': ['.agent/config.json'],
  'codebuddy': ['.codebuddy/config.json'],
  'command-code': ['.commandcode/config.json'],
  'cortex': ['.cortex/config.json'],
  'crush': ['.crush/config.json'],
  'droid': ['.factory/config.json'],
  'github-copilot': ['.copilot/config.json'],
  'iflow-cli': ['.iflow/config.json'],
  'kimi-cli': ['.kimi/config.json'],
  'kilo': ['.kilocode/config.json'],
  'kode': ['.kode/config.json'],
  'mcpjam': ['.mcpjam/config.json'],
  'mistral-vibe': ['.vibe/config.json'],
  'mux': ['.mux/config.json'],
  'openclaw': ['.openclaw/config.json'],
  'pi': ['.pi/config.json'],
  'qoder': ['.qoder/config.json'],
  'replit': ['.replit/config.json'],
  'zencoder': ['.zencoder/config.json'],
  'neovate': ['.neovate/config.json'],
  'pochi': ['.pochi/config.json'],
  'adal': ['.adal/config.json'],
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
