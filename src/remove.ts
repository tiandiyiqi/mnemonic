import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import prompts from 'prompts';
import { RemoveOptions } from './types.js';
import { AGENTS, getAgentsByNames, resolveAgentPath } from './agents.js';
import { removeSkillFromLock } from './installer.js';

export async function remove(options: RemoveOptions): Promise<void> {
  const global = options.global || false;
  let skillsToRemove = options.skills || [];
  
  if (options.all) {
    skillsToRemove = await getAllInstalledSkills(global);
  }
  
  if (skillsToRemove.length === 0) {
    const installed = await getAllInstalledSkills(global);
    
    if (installed.length === 0) {
      console.log(chalk.yellow('No skills installed.'));
      return;
    }
    
    const { selected } = await prompts({
      type: 'multiselect',
      name: 'selected',
      message: 'Select skills to remove',
      choices: installed.map((s) => ({ title: s, value: s })),
    });
    
    if (!selected || selected.length === 0) {
      console.log(chalk.gray('No skills selected.'));
      return;
    }
    
    skillsToRemove = selected;
  }
  
  let agents = AGENTS;
  
  if (options.agent && options.agent.length > 0) {
    agents = getAgentsByNames(options.agent);
  }
  
  if (!options.yes) {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `Remove ${skillsToRemove.length} skill(s) from ${agents.length} agent(s)?`,
      initial: false,
    });
    
    if (!confirmed) {
      console.log(chalk.gray('Removal cancelled.'));
      return;
    }
  }
  
  let removed = 0;
  
  for (const skillName of skillsToRemove) {
    for (const agent of agents) {
      const skillPath = resolveAgentPath(agent, global);
      const skillDir = path.join(skillPath, skillName);
      
      if (await fs.pathExists(skillDir)) {
        await fs.remove(skillDir);
        removed++;
        console.log(chalk.gray(`  Removed ${skillName} from ${agent.displayName}`));
      }
    }
    
    await removeSkillFromLock(skillName, global);
  }
  
  if (removed > 0) {
    console.log(chalk.green(`\n✓ Removed ${removed} skill installation(s).`));
  } else {
    console.log(chalk.yellow('No matching skills found to remove.'));
  }
}

async function getAllInstalledSkills(global: boolean): Promise<string[]> {
  const skills = new Set<string>();
  
  for (const agent of AGENTS) {
    const skillPath = resolveAgentPath(agent, global);
    
    if (!(await fs.pathExists(skillPath))) {
      continue;
    }
    
    const entries = await fs.readdir(skillPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        skills.add(entry.name);
      }
    }
  }
  
  return Array.from(skills).sort();
}
