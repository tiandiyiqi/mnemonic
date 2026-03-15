import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { ListOptions, Agent } from './types.js';
import { AGENTS, getAgentsByNames, resolveAgentPath } from './agents.js';
import { getLockFile } from './installer.js';
import { parseSkillFile } from './skills.js';

interface SkillInfo {
  agents: Agent[];
  paths: string[];
  description: string;
}

export async function list(options: ListOptions): Promise<void> {
  const global = options.global || false;
  let agents = AGENTS;
  
  if (options.agent && options.agent.length > 0) {
    agents = getAgentsByNames(options.agent);
  }
  
  const installedSkills: Map<string, SkillInfo> = new Map();
  
  for (const agent of agents) {
    const skillPath = resolveAgentPath(agent, global);
    
    if (!(await fs.pathExists(skillPath))) {
      continue;
    }
    
    const entries = await fs.readdir(skillPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const isDir = entry.isDirectory() || entry.isSymbolicLink();
      if (!isDir) {
        continue;
      }
      
      const skillName = entry.name;
      const skillDir = path.join(skillPath, skillName);
      const skillFile = path.join(skillDir, 'SKILL.md');
      
      let description = '';
      if (await fs.pathExists(skillFile)) {
        const skill = await parseSkillFile(skillFile);
        description = skill?.description || '';
      }
      
      const existing = installedSkills.get(skillName);
      
      if (existing) {
        existing.agents.push(agent);
        existing.paths.push(skillDir);
      } else {
        installedSkills.set(skillName, {
          agents: [agent],
          paths: [skillDir],
          description,
        });
      }
    }
  }
  
  if (installedSkills.size === 0) {
    console.log(chalk.yellow('No skills installed.'));
    return;
  }
  
  console.log(chalk.bold('\nInstalled skills:\n'));
  
  for (const [name, info] of installedSkills) {
    const agentNames = info.agents.map((a: Agent) => a.displayName).join(', ');
    const description = info.description || '';
    
    console.log(`  ${chalk.green(name)}`);
    if (description) {
      console.log(`    ${chalk.gray(description)}`);
    }
    console.log(`    ${chalk.cyan('Agents:')} ${agentNames}`);
    console.log('');
  }
  
  const lock = await getLockFile(global);
  
  if (lock && lock.installed.length > 0) {
    console.log(chalk.bold('Lock file entries:'));
    for (const entry of lock.installed) {
      console.log(`  ${entry.name} from ${entry.source}`);
    }
    console.log('');
  }
}
