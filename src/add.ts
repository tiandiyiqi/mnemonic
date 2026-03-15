import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import prompts from 'prompts';
import { AddOptions, SourceInfo } from './types.js';
import { parseSource } from './source-parser.js';
import { discoverSkills, getBuiltInSkills } from './skills.js';
import { AGENTS, detectInstalledAgents, getAgentsByNames, resolveAgentPath } from './agents.js';
import { installSkill } from './installer.js';

export async function add(options: AddOptions): Promise<void> {
  const spinner = ora('Parsing source...').start();
  
  try {
    const source = options.source;
    let sourceInfo: SourceInfo;
    
    const builtInSkills = await getBuiltInSkills();
    const builtInSkill = builtInSkills.find(
      (s) => s.name === source || s.name === path.basename(source)
    );
    
    if (builtInSkill && (source.startsWith('./') || source.startsWith('skills/') || !source.includes('/'))) {
      sourceInfo = { type: 'local' as const, url: builtInSkill.sourcePath };
      spinner.text = `Using built-in skill: ${builtInSkill.name}`;
    } else {
      sourceInfo = parseSource(source);
      spinner.text = `Fetching skills from ${source}...`;
    }
    
    let skills = await discoverSkills(sourceInfo);
    
    const showInternal = process.env.INSTALL_INTERNAL_SKILLS === '1' || process.env.INSTALL_INTERNAL_SKILLS === 'true';
    skills = skills.filter((s) => !s.internal || showInternal);
    
    if (skills.length === 0) {
      spinner.fail('No skills found in the specified source.');
      return;
    }
    
    if (options.list) {
      spinner.stop();
      console.log(chalk.bold('\nAvailable skills:\n'));
      for (const skill of skills) {
        console.log(`  ${chalk.green(skill.name)} - ${skill.description}`);
      }
      console.log('');
      return;
    }
    
    spinner.text = `Found ${skills.length} skill(s)`;
    
    let targetAgents = await getTargetAgents(options, spinner);
    
    if (!options.yes && targetAgents.length > 1) {
      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: `Install to ${targetAgents.length} agents?`,
        initial: true,
      });
      
      if (!confirmed) {
        spinner.info('Installation cancelled.');
        return;
      }
    }
    
    let skillsToInstall = skills;
    
    if (options.skill && options.skill.length > 0) {
      if (options.skill.includes('*')) {
        skillsToInstall = skills;
      } else {
        skillsToInstall = skills.filter((s) => options.skill?.includes(s.name));
      }
    }
    
    if (skillsToInstall.length === 0) {
      spinner.fail('No matching skills found.');
      return;
    }
    
    const installMethod = options.copy ? 'Copying' : 'Linking';
    spinner.start(`${installMethod} skills...`);
    
    for (const skill of skillsToInstall) {
      await installSkill(skill, targetAgents, {
        global: options.global || false,
        copy: options.copy || false,
        source: source,
        commit: undefined,
      });
    }
    
    spinner.succeed(`Installed ${skillsToInstall.length} skill(s) to ${targetAgents.length} agent(s)`);
    
    console.log(chalk.bold('\nInstalled skills:'));
    for (const skill of skillsToInstall) {
      console.log(`  ${chalk.green('✓')} ${skill.name}`);
    }
    
    console.log(chalk.bold('\nTarget agents:'));
    for (const agent of targetAgents) {
      const targetPath = resolveAgentPath(agent, options.global || false);
      console.log(`  ${chalk.cyan('→')} ${agent.displayName}: ${targetPath}`);
    }
    
    console.log('');
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
}

async function getTargetAgents(
  options: AddOptions,
  spinner: Ora
): Promise<typeof AGENTS> {
  if (options.agent && options.agent.length > 0) {
    const agents = getAgentsByNames(options.agent);
    if (agents.length === 0) {
      throw new Error('No valid agents specified. Use --agent to specify agents.');
    }
    return agents;
  }
  
  if (options.all) {
    return AGENTS;
  }
  
  spinner.text = 'Detecting installed agents...';
  
  const detected = await detectInstalledAgents();
  
  if (detected.length > 0) {
    return detected;
  }
  
  console.log(chalk.yellow('\nNo agents detected. Installing to default agents.\n'));
  
  const defaultAgents = AGENTS.slice(0, 3);
  return defaultAgents;
}
